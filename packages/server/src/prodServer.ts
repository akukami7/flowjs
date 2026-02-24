import { createServer, IncomingMessage, ServerResponse } from "node:http";
import { join, extname } from "node:path";
import { readFileSync, statSync, existsSync } from "node:fs";
import { matchRoute, parseRouteIdToRegex } from "@flowjs/router";
import { renderSSR } from "./ssr/render.js";
import { applyMiddleware, loadRootMiddleware } from "./middleware.js";

// MIME types for static files serving
const MIME_TYPES: Record<string, string> = {
    ".html": "text/html",
    ".js": "application/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
};

export async function createProdServer(options: { root: string; port: number }) {
    const { root, port } = options;

    const manifestPath = join(root, "dist/manifest.json");
    if (!existsSync(manifestPath)) {
        console.error("❌ Cannot start production server: dist/manifest.json is missing.");
        console.error("   Please run `flowjs build` first.");
        process.exit(1);
    }

    const flowManifest = JSON.parse(readFileSync(manifestPath, "utf8"));
    const clientDistPath = join(root, "dist/client");

    // Pre-load the single compiled server-entry mapping from the build.
    // In our simplified build architecture, everything is bundled into server-entry.js
    const serverEntryPath = join(root, "dist/server/server-entry.js");
    let serverManifest: any = {};
    try {
        // We add randomized query to avoid node cache issues if rebuilding, but for pure prod, it's fine.
        const serverModule = await import("file://" + serverEntryPath);
        serverManifest = serverModule.manifest;
    } catch (err) {
        console.error("❌ Failed to load server-entry.js", err);
        process.exit(1);
    }

    const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
        try {
            const url = new URL(req.url || "/", `http://${req.headers.host}`);
            let pathname = url.pathname;

            // 1. Intercept SPA data requests
            const isDataRequest = pathname.startsWith("/__flow/data");
            if (isDataRequest) {
                pathname = pathname.replace("/__flow/data", "");
                if (pathname === "") pathname = "/";
            }

            // 2. Serve static assets from dist/client
            // If the URL matches a real file in dist/client, serve it natively.
            const staticFilePath = join(clientDistPath, pathname);
            if (!isDataRequest && pathname !== "/" && existsSync(staticFilePath) && statSync(staticFilePath).isFile()) {
                const ext = extname(staticFilePath);
                const contentType = MIME_TYPES[ext] || "application/octet-stream";
                res.setHeader("Content-Type", contentType);

                // Cache aggressive for hashed assets in /assets/
                if (pathname.startsWith("/assets/")) {
                    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
                } else {
                    res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
                }

                const content = readFileSync(staticFilePath);
                res.writeHead(200);
                res.end(content);
                return;
            }

            // 3. FlowJS Routing System
            // Reconstruct the RouteManifest using the runtime regex generator
            const routesList = Object.keys(flowManifest).map(id => {
                const { regex, paramNames, segments, pathnamePattern } = parseRouteIdToRegex(id);
                return {
                    routeId: id,
                    filePath: id, // fake path for SSR mapping
                    regex,
                    paramNames,
                    segments,
                    pathnamePattern,
                };
            });

            // Dynamic routing fallback: load production server bundle
            const serverDistPath = join(root, "dist/server");
            const { manifest } = await import("file://" + join(serverDistPath, "server-entry.js"));

            // 0. Evaluate global root middleware interceptors
            const middlewareFn = await loadRootMiddleware(undefined, root);
            if (await applyMiddleware(req, res, middlewareFn)) {
                return; // Early short-circuit response generated
            }

            const match = matchRoute(pathname, { routes: routesList as any });

            if (match) {
                const compileMeta = flowManifest[match.route.routeId];

                // Execute underlying dynamically loaded Layouts & Pages
                const routeModules = manifest.routes[match.route.routeId]; // Changed from serverManifest.routes
                if (!routeModules) {
                    res.writeHead(500);
                    res.end("Internal Server Error: Missing route map");
                    return;
                }

                // If this is an API route, execute it (Convention: endpoints end in api or .ts/.js files matched early)
                if (compileMeta.clientChunkPath === "") {
                    // It's an API route!
                    const apiMod = await routeModules.page();
                    const handlers = apiMod.default || apiMod;
                    const method = req.method?.toUpperCase() || "GET";

                    if (handlers[method] && typeof handlers[method] === "function") {
                        const handler = handlers[method];
                        const nextRes = await handler({
                            request: new Request(url.href, {
                                method: req.method,
                                headers: req.headers as HeadersInit
                            }),
                            params: match.params,
                            query: Object.fromEntries(url.searchParams.entries()),
                            url: url
                        });

                        res.writeHead(nextRes.status, Object.fromEntries(nextRes.headers.entries()));
                        res.end(await nextRes.text());
                        return;
                    }
                }

                // 4. Resolve components and execute loader
                const PageMod = await routeModules.page();

                const loader = PageMod.loader || PageMod.default?.loader;
                let data = null;
                if (loader) {
                    try {
                        data = await loader({ params: match.params, request: req, url });
                    } catch (loaderErr: any) {
                        console.error(
                            `\n❌ FlowJS Error: LOADER_THROW\n` +
                            `   Loader for route "${match.route.routeId}" threw an error:\n` +
                            `      ${loaderErr.message}\n\n` +
                            `   💡 Hint: Check your loader function for unhandled exceptions.\n` +
                            `      Wrap async calls in try/catch.\n` +
                            `   📖 Docs: https://flowjs.dev/docs/data-loading\n`
                        );
                        throw loaderErr;
                    }
                }

                if (isDataRequest) {
                    res.setHeader("Content-Type", "application/json");
                    res.writeHead(200);
                    res.end(JSON.stringify({
                        routeId: match.route.routeId,
                        data
                    }));
                    return;
                }

                // Resolve metadata
                const metaFn = PageMod.meta || PageMod.default?.meta;
                let meta = {};
                if (metaFn) {
                    meta = typeof metaFn === "function" ? await metaFn({ data, params: match.params }) : metaFn;
                }

                // Resolve client chunk
                const viteManifestPath = join(clientDistPath, ".vite/manifest.json");
                let clientEntryUrl = "";
                if (existsSync(viteManifestPath)) {
                    const viteManifest = JSON.parse(readFileSync(viteManifestPath, "utf8"));
                    const entryKey = Object.keys(viteManifest).find(k => viteManifest[k].isEntry);
                    if (entryKey) {
                        clientEntryUrl = "/" + viteManifest[entryKey].file;
                    }
                }

                // 5. SSR HTML Rendering for frontend views
                const LayoutComponents = [];
                for (const layoutLoader of routeModules.layouts) {
                    const lMod = await layoutLoader();
                    LayoutComponents.push(lMod);
                }

                const html = await renderSSR({
                    page: PageMod,
                    layouts: LayoutComponents,
                    data,
                    meta,
                    params: match.params,
                    url,
                    clientEntryUrl
                });

                res.setHeader("Content-Type", "text/html");
                res.writeHead(200);
                res.end(html);
                return;
            }

            res.writeHead(404, { "Content-Type": "text/plain" });
            res.end("404 Not Found");
        } catch (e: any) {
            console.error("Production server error:", e);
            res.writeHead(500, { "Content-Type": "text/plain" });
            res.end("Internal Server Error");
        }
    });

    server.listen(port, () => {
        console.log(`🚀 FlowJS Production Server running at http://localhost:${port}`);
    });
}
