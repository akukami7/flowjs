/**
 * @flowjs/router
 *
 * File-system based App Router for FlowJS.
 *
 * Core API:
 * - `scanAppDir(appPath)` — scan `app/` directory and build a route manifest
 * - `matchRoute(pathname, manifest)` — match a URL to a route + extract params
 * - `createRouter(options)` — create a programmatic router instance
 */

// ── Types ───────────────────────────────────────────────────────────────────
export type {
    SegmentKind,
    RouteSegment,
    RouteEntry,
    RouteManifest,
    RouteMatch,
} from "./types.js";

// ── Scanner ─────────────────────────────────────────────────────────────────
export { scanAppDir, parseRouteIdToRegex } from "./scanner.js";
export { buildLayoutTree } from "./layoutTree.js";

// ── Matcher ─────────────────────────────────────────────────────────────────
export { matchRoute } from "./matcher.js";

// ── Programmatic router (legacy compat) ─────────────────────────────────────

export interface Route {
    path: string;
    component: string;
    children?: Route[];
}

export interface RouterOptions {
    basePath?: string;
    routes?: Route[];
}

export interface Router {
    options: RouterOptions;
    match(pathname: string): Route | null;
}

/**
 * Create a programmatic router instance (legacy / manual mode).
 * For file-system routing, use `scanAppDir` + `matchRoute` instead.
 */
export function createRouter(options: RouterOptions = {}): Router {
    const routes = options.routes ?? [];

    return {
        options,
        match(pathname: string): Route | null {
            return routes.find((r) => r.path === pathname) ?? null;
        },
    };
}
