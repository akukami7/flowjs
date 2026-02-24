import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { join, dirname } from "node:path";
import { buildLayoutTree } from "../layoutTree.js";
import fs from "node:fs";
import os from "node:os";

describe("FlowJS Layout Tree Builder", () => {
    const tempDir = join(os.tmpdir(), "flowjs-test-layout");

    beforeAll(() => {
        fs.mkdirSync(tempDir, { recursive: true });
        const files = [
            "layout.tsx",
            "page.tsx",
            "(marketing)/layout.tsx",
            "(marketing)/promo/page.tsx",
            "blog/layout.tsx",
            "blog/[slug]/page.tsx"
        ];

        files.forEach(f => {
            const fullPath = join(tempDir, f);
            fs.mkdirSync(dirname(fullPath), { recursive: true });
            fs.writeFileSync(fullPath, "export default function() {}");
        });
    });

    afterAll(() => {
        fs.rmSync(tempDir, { recursive: true, force: true });
    });

    it("resolves only the root layout for the base index page", () => {
        const pagePath = join(tempDir, "page.tsx");
        const layouts = buildLayoutTree(tempDir, pagePath);

        expect(layouts.length).toBe(1);
        expect(layouts[0].routeIdScope).toBe("/");
    });

    it("resolves root and group layouts recursively for nested route groups", () => {
        const pagePath = join(tempDir, "(marketing)/promo/page.tsx");
        const layouts = buildLayoutTree(tempDir, pagePath);

        expect(layouts.length).toBe(2);
        expect(layouts[0].routeIdScope).toBe("/");
        expect(layouts[1].routeIdScope).toBe("/"); // Route groups do not shift logical scopes
        expect(layouts[1].filePath.includes("(marketing)")).toBe(true);
    });

    it("resolves root and localized layouts smoothly for dynamic segments", () => {
        const pagePath = join(tempDir, "blog/[slug]/page.tsx");
        const layouts = buildLayoutTree(tempDir, pagePath);

        expect(layouts.length).toBe(2);
        expect(layouts[0].routeIdScope).toBe("/");
        expect(layouts[1].routeIdScope).toBe("/blog");
    });
});
