/**
 * Test script — verifies scanAppDir + matchRoute against the example app/ directory.
 *
 * Run: node --loader ts-node/esm examples/basic/src/test-router.ts
 *   or: build first, then run compiled JS.
 */

import { scanAppDir, matchRoute } from "@flowjs/router";
import { resolve } from "node:path";

const appDir = resolve(import.meta.dirname, "../app");
console.log(`\n📂 Scanning: ${appDir}\n`);

const manifest = scanAppDir(appDir);

console.log(`Found ${manifest.routes.length} routes:\n`);
for (const route of manifest.routes) {
    console.log(`  ${route.routeId}`);
    console.log(`    pattern : ${route.pathnamePattern}`);
    console.log(`    regex   : ${route.regex}`);
    console.log(`    params  : [${route.paramNames.join(", ")}]`);
    console.log(`    file    : ${route.filePath}`);
    if (route.layouts && route.layouts.length > 0) {
        console.log(`    layouts : [${route.layouts.join(", ")}]`);
    }
    console.log();
}

// Test matching
const testPaths = [
    "/",
    "/about",
    "/blog",
    "/blog/hello-world",
    "/docs/getting-started/installation",
    "/dashboard",
    "/settings",
    "/nonexistent",
];

console.log("─── Route matching ────────────────────────\n");
for (const p of testPaths) {
    const match = matchRoute(p, manifest);
    if (match) {
        console.log(`  ✅ ${p} → ${match.route.routeId}`, match.params);
    } else {
        console.log(`  ❌ ${p} → no match`);
    }
}
console.log();
