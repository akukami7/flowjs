import { scanAppDir, matchRoute } from "../../packages/router/dist/index.js";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(__dirname, "../app");

console.log("Scanning:", appDir);

const manifest = scanAppDir(appDir);

console.log("Found", manifest.routes.length, "routes:");
for (const route of manifest.routes) {
    console.log("  ROUTE:", route.routeId, "->", route.pathnamePattern, "| params:", route.paramNames.join(",") || "(none)", "| regex:", route.regex.source);
}

console.log("");
console.log("--- Matching ---");

const tests = ["/", "/about", "/blog", "/blog/hello-world", "/docs/getting-started/installation", "/dashboard", "/settings", "/nonexistent"];
for (const p of tests) {
    const match = matchRoute(p, manifest);
    if (match) {
        const params = Object.keys(match.params).length > 0 ? JSON.stringify(match.params) : "{}";
        console.log("  OK", p, "->", match.route.routeId, params);
    } else {
        console.log("  MISS", p, "-> no match");
    }
}
