import { join, dirname } from "node:path";
import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync } from "node:fs";
import { parseRouteIdToRegex } from "@flowjs/router";
// We import renderSSR directly from the @flowjs/server package
import { renderSSR } from "@flowjs/server";

/**
 * Builds the static SSG export representation
 */
export async function exportApp(options: { root: string }) {
    const { root } = options;
    const outDir = join(root, "out");
    const manifestPath = join(root, "dist/manifest.json");

    console.log("▶️  flowjs export — initiating Static Site Generation...");

    if (!existsSync(manifestPath)) {
        console.error("❌ Fatal: dist/manifest.json not found. Run `flowjs build` first.");
        process.exit(1);
    }

    const flowManifest = JSON.parse(readFileSync(manifestPath, "utf-8"));
    const serverEntryPath = join(root, "dist/server/server-entry.js");
    const clientDistPath = join(root, "dist/client");

    if (!existsSync(serverEntryPath)) {
        console.error("❌ Fatal: Server entry not found. Run `flowjs build` first.");
        process.exit(1);
    }

    // Refresh output directory
    if (!existsSync(outDir)) {
        mkdirSync(outDir, { recursive: true });
    }

    // Clone static assets immediately
    if (existsSync(clientDistPath)) {
        console.log("   Copying static assets to out/...");
        cpSync(clientDistPath, outDir, { recursive: true });
    }

    // Import the compiled server entry dynamically (bypassing TS constraints with arbitrary path casting)
    let serverManifest: any;
    try {
        const mod = await import(`file://${serverEntryPath}`);
        serverManifest = mod.manifest;
    } catch (err) {
        console.error("❌ Failed to load server-entry.js", err);
        process.exit(1);
    }

    let generatedCount = 0;

    for (const routeId of Object.keys(flowManifest)) {
        const compileMeta = flowManifest[routeId];
        const routeModules = serverManifest.routes[routeId];

        // Skip API routes which have no client chunk
        if (!compileMeta.clientChunkPath || !routeModules) {
            continue;
        }

        const pageModRaw = await routeModules.page();

        // Normalize ES module exports (handles both `export default definePage({...})` and `export const config = ...`)
        const pageMod = (pageModRaw.default && pageModRaw.default.default)
            ? pageModRaw.default
            : pageModRaw;

        // Check for SSG opt-in: config.dynamic === "force-static"
        if (pageMod.config?.dynamic !== "force-static") {
            continue;
        }

        console.log(`⚡ Exporting route: ${routeId}`);

        // Helper to evaluate static segments
        const { paramNames, segments } = parseRouteIdToRegex(routeId);

        // If route has dynamic parameters (e.g. /blog/[slug])
        if (paramNames.length > 0) {
            if (typeof pageMod.generateStaticParams !== "function") {
                console.warn(`⚠️  Warning: Route ${routeId} is dynamic but missing generateStaticParams(). Skipping.`);
                continue;
            }

            const paramList = await pageMod.generateStaticParams();
            for (const paramRecord of paramList) {
                // Construct real output pathname
                let outPathname = "";
                for (const segment of segments) {
                    if (segment.kind === "static") {
                        outPathname += "/" + segment.raw;
                    } else if (segment.kind === "dynamic" || segment.kind === "catchAll") {
                        const val = paramRecord[segment.paramName!];
                        if (val !== undefined) {
                            outPathname += "/" + (Array.isArray(val) ? val.join("/") : val);
                        }
                    }
                }
                if (!outPathname) outPathname = "/";

                await renderAndWritePage({
                    root, outDir, routeId, pathname: outPathname, params: paramRecord,
                    pageMod, routeModules, clientDistPath
                });
                generatedCount++;
            }
        } else {
            // Static route mapping (e.g. /about or /)
            const outPathname = routeId === "/" ? "/" : routeId;
            await renderAndWritePage({
                root, outDir, routeId, pathname: outPathname, params: {},
                pageMod, routeModules, clientDistPath
            });
            generatedCount++;
        }
    }

    console.log(`✅ Export completed successfully. Generated ${generatedCount} static HTML files.`);
}

async function renderAndWritePage({
    outDir, pathname, params, pageMod, routeModules, clientDistPath
}: {
    root: string, outDir: string, routeId: string, pathname: string, params: Record<string, any>,
    pageMod: any, routeModules: any, clientDistPath: string
}) {
    // Note: URL doesn't accurately reflect a browser origin during SSG, we stub it statically.
    const url = new URL(pathname, "http://localhost");

    let data = null;
    if (pageMod.loader) {
        // Stub incomplete FlowContext request for SSG evaluation
        data = await pageMod.loader({ params, url, request: new Request(url.href) });
    }

    let meta = {};
    if (pageMod.meta) {
        meta = typeof pageMod.meta === "function" ? await pageMod.meta({ data }) : pageMod.meta;
    }

    const viteManifestPath = join(clientDistPath, ".vite/manifest.json");
    let clientEntryUrl = "";
    if (existsSync(viteManifestPath)) {
        const viteManifest = JSON.parse(readFileSync(viteManifestPath, "utf8"));
        const entryKey = Object.keys(viteManifest).find(k => viteManifest[k].isEntry);
        if (entryKey) {
            clientEntryUrl = "/" + viteManifest[entryKey].file;
        }
    }

    const LayoutComponents = [];
    for (const layoutLoader of routeModules.layouts) {
        const lMod = await layoutLoader();
        if (lMod.default) LayoutComponents.push({ default: lMod.default });
    }

    const html = await renderSSR({
        page: { default: pageMod.default?.default || pageMod.default }, // Correct normalization pass
        layouts: LayoutComponents,
        data,
        meta,
        params,
        url,
        clientEntryUrl
    });

    // Resolve structural write paths: /about -> /about/index.html (or /index.html for /)
    const writePath = pathname.endsWith("/")
        ? join(outDir, pathname, "index.html")
        : join(outDir, pathname, "index.html");

    console.log(`[DEBUG] outDir: ${outDir}, pathname: ${pathname} -> writePath: ${writePath}`);
    mkdirSync(dirname(writePath), { recursive: true });
    writeFileSync(writePath, html, "utf-8");

    // Also write data payload for SPA navigations
    const dataPath = join(outDir, `__flow/data${pathname === "/" ? "/index" : pathname}.json`);
    console.log(`[DEBUG] Write Data: ${dataPath}`);
    mkdirSync(dirname(dataPath), { recursive: true });
    writeFileSync(dataPath, JSON.stringify({ routeId: pathname, data }), "utf-8");

    console.log(`   └─ Wrote ${pathname} -> out${pathname === "/" ? "" : pathname}/index.html`);
}
