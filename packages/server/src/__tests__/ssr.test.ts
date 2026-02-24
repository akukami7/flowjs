import { describe, it, expect } from "vitest";
import { renderSSR } from "../ssr/render.js";
import * as React from "react";

describe("FlowJS SSR Engine", () => {
    it("renders valid HTML payload and accurately injects metadata tags", () => {
        const MockPage = {
            default: ({ data }: any) => React.createElement("h1", null, `Hello ${data.name}`)
            // Cannot use JSX natively in pure .ts files executed outside Vite locally unless using tsx, but React.createElement works perfectly.
        };

        const MockLayout = {
            default: ({ children }: any) => React.createElement("main", { className: "layout-wrapper" }, children)
        };

        const html = renderSSR({
            page: MockPage,
            layouts: [MockLayout],
            data: { name: "Vitest SSR Engine" },
            meta: { title: "FlowJS Unit Test", description: "This is a testing description payload." },
            params: {},
            url: new URL("http://localhost:3000/test"),
            clientEntryUrl: "/@vite/client.js"
        });

        // Assert Base HTML Construct
        expect(html).toContain("<!DOCTYPE html>");
        expect(html).toContain('<div id="root">');

        // Assert Metadata
        expect(html).toContain("<title>FlowJS Unit Test</title>");
        expect(html).toContain('<meta name="description" content="This is a testing description payload.">');

        // Assert Script injections
        expect(html).toContain('<script type="module" src="/@vite/client.js"></script>');

        // Assert React Components Output (Layout nesting Page)
        expect(html).toContain('<main class="layout-wrapper"><h1>Hello Vitest SSR Engine</h1></main>');

        // Assert Serialized Initial Props Context
        expect(html).toContain('<script id="FLOW_DATA" type="application/json">');
        expect(html).toContain('{"name":"Vitest SSR Engine"}');
    });
});
