/**
 * @flowjs/router — Route matcher
 *
 * Matches a real URL pathname against the route manifest
 * and extracts dynamic parameters.
 */

import type { RouteEntry, RouteManifest, RouteMatch } from "./types.js";

/**
 * Match a pathname against the route manifest.
 * Returns the first matching route (routes are pre-sorted by specificity)
 * along with extracted params, or `null` if no route matches.
 *
 * @param pathname — The URL pathname to match, e.g. `"/blog/hello-world"`.
 * @param manifest — The route manifest from `scanAppDir`.
 *
 * @example
 * ```ts
 * const manifest = scanAppDir("/my-app/app");
 * const match = matchRoute("/blog/hello-world", manifest);
 * if (match) {
 *   console.log(match.route.routeId);   // "/blog/[slug]"
 *   console.log(match.params);           // { slug: "hello-world" }
 * }
 * ```
 */
export function matchRoute(
    pathname: string,
    manifest: RouteManifest,
): RouteMatch | null {
    // Normalise: ensure leading slash, no trailing slash (except root)
    const normalised = normalisePathname(pathname);

    for (const route of manifest.routes) {
        const match = route.regex.exec(normalised);
        if (!match) continue;

        const params: Record<string, string> = {};
        for (let i = 0; i < route.paramNames.length; i++) {
            params[route.paramNames[i]] = decodeURIComponent(match[i + 1]);
        }

        return { route, params };
    }

    return null;
}

/**
 * normalise a pathname for matching:
 * - Ensure leading `/`
 * - Remove trailing `/` (unless root)
 * - Collapse double slashes
 */
function normalisePathname(pathname: string): string {
    let p = pathname;

    // Ensure leading slash
    if (!p.startsWith("/")) {
        p = "/" + p;
    }

    // Collapse double slashes
    p = p.replace(/\/+/g, "/");

    // Remove trailing slash (keep root "/")
    if (p.length > 1 && p.endsWith("/")) {
        p = p.slice(0, -1);
    }

    return p;
}
