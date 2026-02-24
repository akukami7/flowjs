import { join, resolve, relative } from "node:path";
import { writeFileSync, mkdirSync, readFileSync, existsSync, readdirSync } from "node:fs";
import { build as viteBuild } from "vite";
import react from "@vitejs/plugin-react";
import { scanAppDir } from "@flowjs/router";

export async function build(options: { root: string }) {
    const root = resolve(options.root);
    const appDir = join(root, "app");
    const flowjsDir = join(root, ".flowjs");

    // Create .flowjs hidden compilation directory
    mkdirSync(flowjsDir, { recursive: true });

    // ── Validate app/ directory ──────────────────────────────────────────
    if (!existsSync(appDir)) {
        console.error(`\n❌ FlowJS Error: MISSING_APP_DIR`);
        console.error(`   The "app/" directory does not exist at "${appDir}".`);
        console.error(`\n   💡 Hint: Create an app/ directory in your project root with at least one page.tsx.`);
        console.error(`   📖 Docs: https://flowjs.dev/docs/routing\n`);
        process.exit(1);
    }

    // ── Validate root layout ─────────────────────────────────────────────
    const layoutCandidates = ["layout.tsx", "layout.ts", "layout.jsx", "layout.js"];
    const hasRootLayout = layoutCandidates.some(f => existsSync(join(appDir, f)));
    if (!hasRootLayout) {
        console.warn(`\n⚠️  FlowJS Warning: MISSING_ROOT_LAYOUT`);
        console.warn(`   No root layout found at "${appDir}/layout.tsx".`);
        console.warn(`\n   💡 Hint: Create app/layout.tsx exporting a default component that wraps {children}.`);
        console.warn(``);
        console.warn(`   Example:`);
        console.warn(`     export default function RootLayout({ children }: { children: React.ReactNode }) {`);
        console.warn(`       return <html><body>{children}</body></html>;`);
        console.warn(`     }`);
        console.warn(`\n   📖 Docs: https://flowjs.dev/docs/routing#layouts\n`);
    }

    console.log("🔍 Scanning app directory...");
    const manifest = scanAppDir(appDir);

    // ── Print route table ────────────────────────────────────────────────
    if (manifest.routes.length > 0) {
        console.log(`\n📋 Discovered ${manifest.routes.length} route(s):\n`);
        console.log(`   ${'Route'.padEnd(25)} ${'Pattern'.padEnd(22)} ${'Type'.padEnd(12)} Layouts`);
        console.log(`   ${'─'.repeat(25)} ${'─'.repeat(22)} ${'─'.repeat(12)} ${'─'.repeat(7)}`);
        for (const route of manifest.routes) {
            const hasDynamic = route.segments.some(s => s.kind === 'dynamic' || s.kind === 'catchAll');
            const type = route.filePath.endsWith('api.ts') || route.filePath.endsWith('api.js')
                ? 'API'
                : hasDynamic ? 'Dynamic' : 'Static';
            console.log(`   ${route.routeId.padEnd(25)} ${route.pathnamePattern.padEnd(22)} ${type.padEnd(12)} ${route.layouts.length}`);
        }
        console.log();
    } else {
        console.warn(`\n⚠️  No routes found. Make sure you have page.tsx files in app/.\n`);
    }

    // 1. Generate Virtual Entries
    let clientRoutesCode = "";
    let serverRoutesCode = "";

    manifest.routes.forEach((route) => {
        // Paths must be relative to .flowjs/
        // windows requires forward slashes for ES imports
        const relativePagePath = join("..", "app", route.filePath.replace(appDir, "")).replace(/\\/g, "/");
        const layoutImports = route.layouts.map(l => join("..", "app", l.filePath.replace(appDir, "")).replace(/\\/g, "/"));

        // Client (dynamic chunks logic for SPA routes)
        clientRoutesCode += `  "${route.routeId}": {\n`;
        clientRoutesCode += `    page: () => import("${relativePagePath}"),\n`;
        clientRoutesCode += `    layouts: [\n`;
        layoutImports.forEach(lPath => {
            clientRoutesCode += `      () => import("${lPath}"),\n`;
        });
        clientRoutesCode += `    ]\n  },\n`;

        // Server (bundled server layout for SSR and backend logic execution)
        serverRoutesCode += `  "${route.routeId}": {\n`;
        serverRoutesCode += `    page: () => import("${relativePagePath}"),\n`;
        serverRoutesCode += `    layouts: [\n`;
        layoutImports.forEach(lPath => {
            serverRoutesCode += `      () => import("${lPath}"),\n`;
        });
        serverRoutesCode += `    ]\n  },\n`;
    });

    const clientEntryCode = `
import { hydrate } from "flowjs/client";
const manifest = {
    routes: {
${clientRoutesCode}
    }
};
hydrate(manifest);
`;

    // Collect static assets for routing configurations
    const rootDir = join(appDir, ".."); // appDir is already root/app, so rootDir is root
    let middlewarePath = "";
    if (existsSync(join(rootDir, "src/middleware.ts"))) {
        middlewarePath = join(rootDir, "src/middleware.ts");
    } else if (existsSync(join(rootDir, "middleware.ts"))) {
        middlewarePath = join(rootDir, "middleware.ts");
    }

    const serverEntryCode = `
${middlewarePath ? `import { middleware as _mw } from ${JSON.stringify(relative(flowjsDir, middlewarePath).replace(/\\/g, '/'))};\nexport const middleware = _mw;` : `export const middleware = null;`}

export const manifest = {
    routes: {
${serverRoutesCode}
    }
};
`;

    const clientEntryPath = join(flowjsDir, "client-entry.tsx");
    const serverEntryPath = join(flowjsDir, "server-entry.tsx");

    writeFileSync(clientEntryPath, clientEntryCode);
    writeFileSync(serverEntryPath, serverEntryCode);

    // 2. Build Client Bundle
    console.log("📦 Building client bundle...");
    await viteBuild({
        root,
        plugins: [react() as any],
        build: {
            outDir: join(root, "dist/client"),
            emptyOutDir: true,
            manifest: true, // Output .vite/manifest.json to trace chunks
            rollupOptions: {
                input: clientEntryPath,
                // App pages might import from 'flowjs' which inadvertently brings in
                // Node.js server exports. We explicitly externalize these backend 
                // namespaces so Rollup ignores them in the frontend compilation pass.
                external: [
                    "@flowjs/server",
                    "@flowjs/build",
                    "vite",
                    "http",
                    "fs",
                    "path",
                    "url",
                    "node:fs",
                    "node:path",
                    "node:url",
                    "node:http"
                ]
            }
        }
    });

    // 3. Build Server Bundle
    console.log("📦 Building server bundle...");
    await viteBuild({
        root,
        plugins: [react() as any],
        build: {
            outDir: join(root, "dist/server"),
            emptyOutDir: true,
            ssr: true,
            target: "node18",
            rollupOptions: {
                input: serverEntryPath,
                output: {
                    format: "esm" // ESM required 
                },
                external: [
                    "@flowjs/server",
                    "@flowjs/build",
                    "flowjs",
                    "vite",
                    "http",
                    "fs"
                ]
            }
        },
        ssr: {
            external: ["@flowjs/server", "@flowjs/build", "flowjs", "vite"]
        }
    });

    // 4. Generate Core framework manifest.json
    console.log("🛠️  Generating aggregate flowjs manifest.json...");

    const viteManifestPath = join(root, "dist/client/.vite/manifest.json");
    let viteManifest: Record<string, any> = {};
    if (existsSync(viteManifestPath)) {
        viteManifest = JSON.parse(readFileSync(viteManifestPath, "utf8"));
    }

    const flowManifest: Record<string, { serverModulePath: string, clientChunkPath: string }> = {};

    manifest.routes.forEach(route => {
        // Vite's manifest keys are posix relative paths
        const pageRelative = ".flowjs/../app" + route.filePath.replace(appDir, "").replace(/\\/g, "/");

        // Attempt to find the chunk for the client component in Vite's manifest output.
        // It's mapped roughly onto the source file paths.
        let clientChunk = "";
        for (const [key, value] of Object.entries(viteManifest)) {
            if (key.endsWith(pageRelative.replace(".flowjs/../", ""))) {
                clientChunk = "dist/client/" + value.file;
            }
        }

        // Standardize output mappings as requested by spec
        flowManifest[route.routeId] = {
            // Virtual entry is what SSR relies on. In real Next.js, this maps to distinct layout chunks
            serverModulePath: "dist/server/.flowjs/server-entry.js",
            clientChunkPath: clientChunk || "dist/client/unknown-chunk.js"
        };
    });

    // Add API routes to the manifest as requested (scanner finds them if they are api.ts)
    manifest.routes.filter(r => r.filePath.endsWith("api.ts") || r.filePath.endsWith("api.js")).forEach(route => {
        flowManifest[route.routeId] = {
            serverModulePath: "dist/server/.flowjs/server-entry.js",
            clientChunkPath: "" // APIs don't run on the client
        };
    });

    writeFileSync(join(root, "dist/manifest.json"), JSON.stringify(flowManifest, null, 2));

    console.log("✅ Build complete!");
}
