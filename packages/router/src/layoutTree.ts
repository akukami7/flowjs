import { existsSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import type { LayoutEntry } from "./types.js";

const LAYOUT_FILES = ["layout.tsx", "layout.ts", "layout.jsx", "layout.js"];

function findFile(dir: string, candidates: string[]): string | undefined {
    for (const name of candidates) {
        const full = join(dir, name);
        if (existsSync(full)) {
            return full;
        }
    }
    return undefined;
}

function isRouteGroup(name: string): boolean {
    return name.startsWith("(") && name.endsWith(")");
}

/**
 * Reconstructs the layout hierarchy for a given page file path.
 *
 * @param appDir - Absolute path to the `app/` root directory.
 * @param pageFilePath - Absolute path to the matched `page.tsx`.
 * @returns Array of `LayoutEntry`, ordered from root to leaf.
 */
export function buildLayoutTree(
    appDir: string,
    pageFilePath: string
): LayoutEntry[] {
    const layouts: LayoutEntry[] = [];
    const relPath = relative(appDir, dirname(pageFilePath));

    const parts = relPath === "" ? [] : relPath.split(sep);
    let currentDir = appDir;
    const scopeSegments: string[] = [];

    // 1. Check root layout in `app/`
    const rootLayout = findFile(currentDir, LAYOUT_FILES);
    if (rootLayout) {
        layouts.push({ filePath: rootLayout, routeIdScope: "/" });
    }

    // 2. Walk down to the page directory
    for (const part of parts) {
        currentDir = join(currentDir, part);

        if (!isRouteGroup(part)) {
            scopeSegments.push(part);
        }

        const scope = "/" + scopeSegments.join("/");

        const layoutFile = findFile(currentDir, LAYOUT_FILES);
        if (layoutFile) {
            layouts.push({ filePath: layoutFile, routeIdScope: scope });
        }
    }

    return layouts;
}
