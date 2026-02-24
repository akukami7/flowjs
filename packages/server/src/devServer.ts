
import { createServer as createViteServer } from "vite";
import { createServer as createHttpServer } from "node:http";
import { resolve, join } from "node:path";
import { parse } from "node:url";

// FlowJS imports
import { scanAppDir, matchRoute } from "@flowjs/router";
import { renderSSR } from "./ssr/render.js";
import { applyMiddleware, loadRootMiddleware } from "./middleware.js";

import react from "@vitejs/plugin-react";

export async function createDevServer(options: { root: string; port: number }) {
    const root = resolve(options.root);
    const appDir = join(root, "app");

    // 1. Create Vite server in middleware mode
    const vite = await createViteServer({
        root,
        server: { middlewareMode: true },
        appType: "custom", // Prevent Vite from answering HTML requests with its own index.html
        plugins: [react() as any],
    });

    // 2. Create Node HTTP server
    const server = createHttpServer(async (req, res) => {
        // Run Vite's middlewares (handles static files, Vite client, HMR scripts)
        vite.middlewares(req, res, async () => {
            try {
                const parsedUrl = parse(req.url!, true);
                const url = new URL(`http://${req.headers.host}${req.url}`);
                let pathname = url.pathname;

                // 0. Load and evaluate Root Middleware
                const middlewareFn = await loadRootMiddleware(vite, root);

                if (await applyMiddleware(req, res, middlewareFn)) {
                    return; // Early short-circuit response generated
                }

                // Check if this is a data request: `/__flow/data/blog/foo` -> data for `/blog/foo`
                const isDataRequest = pathname.startsWith("/__flow/data");
                if (isDataRequest) {
                    pathname =
                        pathname.replace("/__flow/data", "") || "/";
                }

                // Scan routes per-request in dev mode to pick up new files immediately
                const manifest = scanAppDir(appDir);
                const match = matchRoute(pathname, manifest);

                if (!match) {
                    res.statusCode = 404;
                    res.end("404 Not Found");
                    return;
                }

                // ─── API Routes ──────────────────────────────────────────────────
                if (pathname.startsWith("/api/")) {
                    const apiModule = await vite.ssrLoadModule(match.route.filePath);
                    const method = req.method?.toUpperCase() || "GET";

                    // FlowJS V1 convention: API handlers are in the default export
                    const handlers = apiModule.default || apiModule;

                    if (!handlers[method]) {
                        res.statusCode = 405;
                        res.end(`Method ${method} Not Allowed`);
                        return;
                    }

                    // Mock a brief context for the API
                    // In a real framework, we'd translate req/res into standard Request/Response objects (FlowContext)
                    const mockCtx: any = {
                        request: req,
                        params: match.params,
                        query: parsedUrl.query, // Pass URL query parameters
                        url: url,
                    };

                    const result = await handlers[method](mockCtx);

                    if (result instanceof Response) {
                        res.statusCode = result.status;
                        result.headers.forEach((v, k) => res.setHeader(k, v));
                        const text = await result.text();
                        res.end(text);
                    } else {
                        res.setHeader("Content-Type", "application/json");
                        res.end(JSON.stringify(result));
                    }
                    return;
                }

                // ─── Pages & Layouts ─────────────────────────────────────────────
                const pageModule = await vite.ssrLoadModule(match.route.filePath);

                // Load all wrapping layouts
                const layoutModules = [];
                for (const layoutEntry of match.route.layouts) {
                    const mod = await vite.ssrLoadModule(layoutEntry.filePath);
                    layoutModules.push(mod);
                }

                // Execute Loader (if any)
                const loader = pageModule.loader || pageModule.default?.loader;
                let data = {};
                if (loader) {
                    const mockCtx: any = {
                        request: req,
                        params: match.params,
                        url: new URL(`http://${req.headers.host}${req.url}`),
                    };
                    try {
                        data = await loader(mockCtx);
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

                // Data JSON Request
                if (isDataRequest) {
                    res.setHeader("Content-Type", "application/json");
                    res.end(
                        JSON.stringify({
                            routeId: match.route.routeId,
                            data,
                        })
                    );
                    return;
                }

                // SSR HTML Request
                const metaFn = pageModule.meta || pageModule.default?.meta;
                let meta = {};
                if (metaFn) {
                    meta = typeof metaFn === "function" ? await metaFn({ data, params: match.params }) : metaFn;
                }

                const html = renderSSR({
                    page: pageModule,
                    layouts: layoutModules,
                    data,
                    meta,
                    params: match.params,
                    url: new URL(`http://${req.headers.host}${req.url}`),
                    clientEntryUrl: "/@vite/client" // Injected by Vite automatically
                });
                // Transform HTML using Vite. This automatically injects:
                // 1. The `@vite/client` script for HMR.
                // 2. React Refresh preamble.
                const finalHtml = await vite.transformIndexHtml(req.url!, html);

                res.statusCode = 200;
                res.setHeader("Content-Type", "text/html; charset=utf-8");
                res.end(finalHtml);
            } catch (e: any) {
                // If an error occurs during SSR, let Vite fix the stacktrace
                // to point back to the actual source TypeScript files instead of compiled outputs.
                vite.ssrFixStacktrace(e);
                console.error(e);
                res.statusCode = 500;
                res.end(e.stack);
            }
        });
    });

    server.listen(options.port, () => {
        console.log(`🚀 FlowJS Dev Server running at http://localhost:${options.port}`);
    });
}
