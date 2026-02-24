import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { scanAppDir, matchRoute } from "../index.js";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";

describe("FlowJS Router System", () => {
    const tempDir = path.join(os.tmpdir(), "flowjs-test-router");

    beforeAll(() => {
        fs.mkdirSync(tempDir, { recursive: true });

        const files = [
            "page.tsx",                     // -> /
            "about/page.tsx",               // -> /about
            "blog/[slug]/page.tsx",         // -> /blog/[slug]
            "docs/[...path]/page.tsx",      // -> /docs/[...path]
            "(marketing)/promo/page.tsx",   // -> /promo (Group skipping)
            "api/hello/api.ts"              // -> /api/hello
        ];

        files.forEach(f => {
            const fullPath = path.join(tempDir, f);
            fs.mkdirSync(path.dirname(fullPath), { recursive: true });
            fs.writeFileSync(fullPath, "export default function() {}");
        });
    });

    afterAll(() => {
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it("scans and parses static, dynamic, catch-all, and grouped routes correctly", () => {
        const manifest = scanAppDir(tempDir);
        expect(manifest.routes.length).toBe(6);
        expect(manifest.routes.some((r: any) => r.pathnamePattern === "/")).toBe(true);
        expect(manifest.routes.some((r: any) => r.pathnamePattern === "/about")).toBe(true);
        expect(manifest.routes.some((r: any) => r.pathnamePattern === "/promo")).toBe(true);
        expect(manifest.routes.some((r: any) => r.pathnamePattern === "/docs/:path*")).toBe(true);
        expect(manifest.routes.some((r: any) => r.pathnamePattern === "/api/hello")).toBe(true);
    });

    it("matches specific static and group routes correctly via URL pathnames", () => {
        const manifest = scanAppDir(tempDir);

        const root = matchRoute("/", manifest);
        expect(root?.route.pathnamePattern).toBe("/");

        const about = matchRoute("/about", manifest);
        expect(about?.route.pathnamePattern).toBe("/about");

        const promo = matchRoute("/promo", manifest);
        expect(promo?.route.pathnamePattern).toBe("/promo"); // Group skipped transparently
    });

    it("matches dynamic segments and extracts valid parameters", () => {
        const manifest = scanAppDir(tempDir);

        const blog = matchRoute("/blog/hello-world", manifest);
        expect(blog?.route.pathnamePattern).toBe("/blog/:slug");
        expect(blog?.params.slug).toBe("hello-world");
    });

    it("matches catch-all segments properly", () => {
        const manifest = scanAppDir(tempDir);

        const docs = matchRoute("/docs/api/v1/auth", manifest);
        expect(docs?.route.pathnamePattern).toBe("/docs/:path*");
        expect(docs?.params.path).toBe("api/v1/auth"); // Single string extracted
    });
});
