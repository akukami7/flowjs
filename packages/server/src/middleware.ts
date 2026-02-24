import type { IncomingMessage, ServerResponse } from "node:http";
import { join } from "node:path";
import { existsSync } from "node:fs";

export interface MiddlewareResult {
    rewrite?: string;
    redirect?: string;
    status?: number;
    headers?: Record<string, string>;
}

export type MiddlewareFunction = (
    req: IncomingMessage
) => MiddlewareResult | void | Promise<MiddlewareResult | void>;

/**
 * Evaluates the global root middleware for the current request.
 * Applies internal state rewrites, short-circuit response headers, redirects, or statuses.
 * @returns true if the response was forcefully finalized by the middleware, false to continue pipeline
 */
export async function applyMiddleware(
    req: IncomingMessage,
    res: ServerResponse,
    middleware?: MiddlewareFunction | null
): Promise<boolean> {
    if (!middleware) return false;

    try {
        const result = await middleware(req);
        if (!result) return false;

        // Apply headers
        if (result.headers) {
            for (const [key, val] of Object.entries(result.headers)) {
                res.setHeader(key, val);
            }
        }

        // Apply redirect
        if (result.redirect) {
            res.statusCode = result.status || 307;
            res.setHeader("Location", result.redirect);
            res.end();
            return true;
        }

        // Apply early status
        if (result.status) {
            res.statusCode = result.status;
            res.end();
            return true;
        }

        // Apply rewrite internally
        if (result.rewrite) {
            req.url = result.rewrite;
        }

        return false;
    } catch (err) {
        console.error("Middleware unhandled exception:", err);
        res.statusCode = 500;
        res.end("Internal Server Error in Middleware");
        return true;
    }
}

/**
 * Safely resolves and loads the root middleware for both DEV and PROD environments.
 */
export async function loadRootMiddleware(vite?: any, rootDir: string = process.cwd()) {
    if (vite) {
        // DEV behavior
        const mwPathSrc = join(rootDir, "src", "middleware.ts");
        const mwPathRoot = join(rootDir, "middleware.ts");

        let targetPath = null;
        if (existsSync(mwPathSrc)) targetPath = mwPathSrc;
        else if (existsSync(mwPathRoot)) targetPath = mwPathRoot;

        if (targetPath) {
            try {
                // Absolute filesystem path for vite.ssrLoadModule per spec
                const mwMod = await vite.ssrLoadModule(targetPath);
                return mwMod.middleware || mwMod.default;
            } catch (e) {
                console.error("[FlowJS] Failed to load DEV middleware:", e);
                return null;
            }
        }
        return null;
    } else {
        // PROD behavior
        const serverEntryPath = join(rootDir, "dist", "server", "server-entry.js");
        if (existsSync(serverEntryPath)) {
            try {
                const { middleware } = await import("file://" + serverEntryPath);
                return middleware;
            } catch (e) {
                console.error("[FlowJS] Failed to load PROD middleware:", e);
                return null;
            }
        }
        return null;
    }
}
