/**
 * @flowjs/router — Route manifest types
 *
 * Describes the shape of the file-system based route tree.
 */

// ─── Segment types ──────────────────────────────────────────────────────────

/** The kind of a single URL segment. */
export type SegmentKind = "static" | "dynamic" | "catchAll";

/** A parsed URL path segment. */
export interface RouteSegment {
    /** Raw directory name as found on disk, e.g. `"[id]"` or `"blog"`. */
    raw: string;
    /** Cleaned segment used in the URL pattern, e.g. `":id"` or `"blog"`. */
    pattern: string;
    /** What kind of segment this is. */
    kind: SegmentKind;
    /** Name of the param for dynamic / catch-all segments (`undefined` for static). */
    paramName?: string;
}

// ─── Route entry ────────────────────────────────────────────────────────────

/** A single route discovered by `scanAppDir`. */
export interface RouteEntry {
    /**
     * Unique route identifier built from the relative directory path.
     * Route-group folders (parenthesised) are stripped.
     *
     * Examples:
     * - `"/"` (root page)
     * - `"/blog"` (static)
     * - `"/blog/[slug]"` (dynamic)
     * - `"/docs/[...path]"` (catch-all)
     */
    routeId: string;

    /**
     * Human-readable URL pattern.
     * - static:   `/blog`
     * - dynamic:  `/blog/:slug`
     * - catchAll: `/docs/:path*`
     */
    pathnamePattern: string;

    /** Pre-compiled regex that matches this route against a real pathname. */
    regex: RegExp;

    /** Ordered list of dynamic param names (empty for fully-static routes). */
    paramNames: string[];

    /** Absolute path to the `page.tsx` / `page.ts` file. */
    filePath: string;

    /** All layouts wrapping this page, from root to leaf. */
    layouts: LayoutEntry[];

    /** Parsed segments making up this route. */
    segments: RouteSegment[];
}

// ─── Layout entry ───────────────────────────────────────────────────────────

/** A discovered layout in the file system. */
export interface LayoutEntry {
    /** Absolute path to the `layout.tsx` / `layout.ts` file. */
    filePath: string;
    /** The URL route scope this layout applies to (ignoring route groups). */
    routeIdScope: string;
}

// ─── Route manifest ─────────────────────────────────────────────────────────

/** The result of scanning an `app/` directory. */
export interface RouteManifest {
    /** All discovered page routes, ordered by specificity (static first). */
    routes: RouteEntry[];
}

// ─── Match result ───────────────────────────────────────────────────────────

/** The result of matching a pathname against the manifest. */
export interface RouteMatch {
    /** The matched route entry. */
    route: RouteEntry;
    /** Extracted dynamic params. */
    params: Record<string, string>;
}
