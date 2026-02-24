/**
 * @flowjs/router — File-system scanner
 *
 * Recursively walks `app/` to discover page.tsx/ts and layout.tsx/ts files,
 * then builds a RouteManifest.
 *
 * Conventions:
 * - `page.tsx` / `page.ts`       → page component
 * - `layout.tsx` / `layout.ts`   → layout wrapper
 * - `[param]`                    → dynamic segment
 * - `[...param]`                 → catch-all segment
 * - `(group)`                    → route group (ignored in URL, just organises code)
 */

import { readdirSync, statSync, existsSync } from "node:fs";
import { join, relative, resolve, sep } from "node:path";
import type {
    RouteEntry,
    RouteManifest,
    RouteSegment,
    SegmentKind,
} from "./types.js";
import { buildLayoutTree } from "./layoutTree.js";

// ─── Constants ──────────────────────────────────────────────────────────────

const PAGE_FILES = ["page.tsx", "page.ts", "page.jsx", "page.js", "api.ts", "api.js"];
const LAYOUT_FILES = ["layout.tsx", "layout.ts", "layout.jsx", "layout.js"];

// ─── Helpers ────────────────────────────────────────────────────────────────

/** Check if a directory name is a route group `(name)`. */
function isRouteGroup(name: string): boolean {
    return name.startsWith("(") && name.endsWith(")");
}

/** Check if a directory name is a dynamic segment `[param]`. */
function isDynamicSegment(name: string): boolean {
    return (
        name.startsWith("[") &&
        name.endsWith("]") &&
        !name.startsWith("[...")
    );
}

/** Check if a directory name is a catch-all segment `[...param]`. */
function isCatchAllSegment(name: string): boolean {
    return name.startsWith("[...") && name.endsWith("]");
}

/** Extract param name from `[param]` or `[...param]`. */
function extractParamName(raw: string): string {
    if (raw.startsWith("[...")) {
        return raw.slice(4, -1);
    }
    return raw.slice(1, -1);
}

/** Parse a single directory name into a RouteSegment. */
function parseSegment(raw: string): RouteSegment {
    if (isCatchAllSegment(raw)) {
        const paramName = extractParamName(raw);
        return {
            raw,
            pattern: `:${paramName}*`,
            kind: "catchAll" as SegmentKind,
            paramName,
        };
    }

    if (isDynamicSegment(raw)) {
        const paramName = extractParamName(raw);
        return {
            raw,
            pattern: `:${paramName}`,
            kind: "dynamic" as SegmentKind,
            paramName,
        };
    }

    return {
        raw,
        pattern: raw,
        kind: "static" as SegmentKind,
    };
}

/** Build a regex + param-name list from parsed segments. */
function buildRouteRegex(segments: RouteSegment[]): {
    regex: RegExp;
    paramNames: string[];
} {
    const paramNames: string[] = [];

    if (segments.length === 0) {
        // Root route: matches exactly "/"
        return { regex: /^\/$/, paramNames };
    }

    let pattern = "^";

    for (const seg of segments) {
        switch (seg.kind) {
            case "static":
                pattern += `/${escapeRegex(seg.pattern)}`;
                break;

            case "dynamic":
                pattern += `/([^/]+)`;
                paramNames.push(seg.paramName!);
                break;

            case "catchAll":
                pattern += `/(.+)`;
                paramNames.push(seg.paramName!);
                break;
        }
    }

    pattern += "/?$";

    return { regex: new RegExp(pattern), paramNames };
}

/** Escape special regex chars in a string. */
function escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Find the first matching file from a list of candidates in a directory. */
function findFile(dir: string, candidates: string[]): string | undefined {
    for (const name of candidates) {
        const full = join(dir, name);
        if (existsSync(full)) {
            return full;
        }
    }
    return undefined;
}

/**
 * Build `pathnamePattern` from segments.
 * - static:    `/blog`
 * - dynamic:   `/blog/:slug`
 * - catchAll:  `/docs/:path*`
 */
function buildPathnamePattern(segments: RouteSegment[]): string {
    if (segments.length === 0) return "/";
    return "/" + segments.map((s) => s.pattern).join("/");
}

/** Build `routeId` from segments (uses raw directory names, no groups). */
function buildRouteId(segments: RouteSegment[]): string {
    if (segments.length === 0) return "/";
    return "/" + segments.map((s) => s.raw).join("/");
}

// ─── Specificity sorting ────────────────────────────────────────────────────

/**
 * Sort routes so that more specific routes come first:
 * 1. Static routes before dynamic
 * 2. Dynamic routes before catch-all
 * 3. Longer (more segments) before shorter within same kind
 */
function sortRoutes(routes: RouteEntry[]): RouteEntry[] {
    return routes.sort((a, b) => {
        const aScore = routeScore(a);
        const bScore = routeScore(b);
        return aScore - bScore;
    });
}

function routeScore(entry: RouteEntry): number {
    let score = 0;
    for (const seg of entry.segments) {
        switch (seg.kind) {
            case "static":
                score += 1;
                break;
            case "dynamic":
                score += 100;
                break;
            case "catchAll":
                score += 10000;
                break;
        }
    }
    // Fewer segments = higher priority within same kind
    return score;
}

// ─── Scanner ────────────────────────────────────────────────────────────────

/**
 * Recursively scan `appPath` to discover page files and build a route manifest.
 *
 * @param appPath — Absolute path to the `app/` directory.
 * @returns The complete route manifest for the application.
 *
 * @example
 * ```
 * const manifest = scanAppDir("/my-app/app");
 * console.log(manifest.routes);
 * ```
 */
export function scanAppDir(appPath: string): RouteManifest {
    const root = resolve(appPath);
    const routes: RouteEntry[] = [];

    function walk(dir: string, segmentsSoFar: RouteSegment[]): void {
        // Check for page in current directory
        const pageFile = findFile(dir, PAGE_FILES);
        if (pageFile) {
            const segments = [...segmentsSoFar];
            const { regex, paramNames } = buildRouteRegex(segments);

            routes.push({
                routeId: buildRouteId(segments),
                pathnamePattern: buildPathnamePattern(segments),
                regex,
                paramNames,
                filePath: pageFile,
                layouts: buildLayoutTree(root, pageFile),
                segments,
            });
        }

        // Recurse into subdirectories
        let entries: string[];
        try {
            entries = readdirSync(dir);
        } catch {
            return;
        }

        for (const entry of entries.sort()) {
            const fullPath = join(dir, entry);

            // Skip files — we only recurse into directories
            if (!statSync(fullPath).isDirectory()) continue;

            // Skip hidden directories and special dirs
            if (entry.startsWith(".") || entry.startsWith("_")) continue;

            if (isRouteGroup(entry)) {
                // Route groups: recurse but don't add a segment
                walk(fullPath, segmentsSoFar);
            } else {
                // Normal directory: parse as a route segment
                const segment = parseSegment(entry);
                walk(fullPath, [...segmentsSoFar, segment]);
            }
        }
    }

    walk(root, []);

    // ── Route Conflict Detection ─────────────────────────────────────────
    const seen = new Map<string, RouteEntry>();
    for (const route of routes) {
        const existing = seen.get(route.routeId);
        if (existing) {
            const err = new Error(
                `[FlowJS ROUTE_CONFLICT] Multiple pages resolve to the same route "${route.routeId}":\n` +
                `      → ${existing.filePath}\n` +
                `      → ${route.filePath}\n\n` +
                `   💡 Hint: Remove or rename one of the conflicting page files. Only one page.tsx can exist per route path.\n` +
                `   📖 Docs: https://flowjs.dev/docs/routing#conflicts`
            );
            err.name = "RouterError";
            throw err;
        }
        seen.set(route.routeId, route);
    }

    return { routes: sortRoutes(routes) };
}

/**
 * Parses a pure `routeId` string back into its RouteSegments and Regex objects.
 * Essential for stateless production server manifest reconstruction.
 */
export function parseRouteIdToRegex(routeId: string): { regex: RegExp; paramNames: string[]; segments: RouteSegment[]; pathnamePattern: string } {
    const rawSegments = routeId === "/" ? [] : routeId.split("/").filter(Boolean);
    const segments = rawSegments.map(parseSegment);
    const { regex, paramNames } = buildRouteRegex(segments);
    const pathnamePattern = buildPathnamePattern(segments);

    return { regex, paramNames, segments, pathnamePattern };
}
