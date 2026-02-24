import * as React from "react";
import { renderToString } from "react-dom/server";

// Using loosely-coupled interfaces to avoid circular dependency if needed.
// In reality, these match the FlowJS V1 Type Contracts.
export interface SSRPageModule {
    default: React.ComponentType<any>;
}

export interface SSRLayoutModule {
    default: React.ComponentType<{ children: React.ReactNode }>;
}

export interface SSRMeta {
    title?: string;
    description?: string;
    [key: string]: string | undefined;
}

export interface RenderSSRParams {
    /** The matched page component module */
    page: any;
    /** The layouts wrapping this page, from root to leaf */
    layouts: any[];
    /** The url instance */
    url?: URL;
    /** The route match params */
    params?: Record<string, string>;
    /** The data returned by loader/action to be serialized */
    data: any;
    /** Resolved meta object */
    meta: SSRMeta;
    /** The static URL to the Vite client entry chunk */
    clientEntryUrl?: string;
}

/**
 * Renders a FlowJS page and its layouts into a complete HTML string.
 *
 * It performs the following:
 * 1. Nests the Page inside the Layouts (root -> leaf -> page).
 * 2. Renders the React tree to an HTML string.
 * 3. Constructs the final HTML document shell.
 * 4. Injects <title> and <meta name="description">.
 * 5. Injects the bootstrap JSON payload into <script id="FLOW_DATA">.
 */

export function resolvePageComponent(mod: any): React.ComponentType<any> {
    if (!mod) {
        throw new Error(
            `[FlowJS INVALID_PAGE_EXPORT] Page module is undefined.\n\n` +
            `   💡 Hint: Ensure your page.tsx has a default export:\n` +
            `     export default function Page() { return <div>Hello</div>; }\n` +
            `   📖 Docs: https://flowjs.dev/docs/routing#pages`
        );
    }

    if (typeof mod.default === "function") return mod.default;
    if (typeof mod.default?.default === "function") return mod.default.default;
    if (mod.default?.component) return mod.default.component;
    if (mod.component) return mod.component;
    if (typeof mod === "function") return mod;

    let typeStr: string = typeof mod;
    if (typeStr === 'object' && mod !== null) {
        typeStr = `Object { keys: ${Object.keys(mod).join(', ')} }`;
    }

    throw new Error(
        `[FlowJS INVALID_PAGE_EXPORT] Expected React component but got: ${typeStr}\n\n` +
        `   💡 Hint: Your page.tsx must export a React function component as default.\n` +
        `     Got: ${typeStr}\n\n` +
        `     Correct format:\n` +
        `       export default function Page({ data }) { return <div>{data.title}</div>; }\n` +
        `   📖 Docs: https://flowjs.dev/docs/routing#pages`
    );
}

export function renderSSR({
    page,
    layouts,
    data,
    meta,
    params,
    url,
    clientEntryUrl,
}: RenderSSRParams): string {
    // 1. Build the React Component Tree
    // Start with the innermost page
    const PageComponent = resolvePageComponent(page);
    let tree: React.ReactNode = React.createElement(PageComponent, { data, params, url });

    // Wrap with layouts from leaf up to root
    for (let i = layouts.length - 1; i >= 0; i--) {
        const LayoutComponent = resolvePageComponent(layouts[i]);
        tree = React.createElement(LayoutComponent, null, tree);
    }

    // 2. Render to string (with structured error wrapping)
    let htmlOutput: string;
    try {
        htmlOutput = renderToString(tree);
    } catch (renderErr: any) {
        throw new Error(
            `[FlowJS SSR_RENDER_CRASH] React renderToString failed:\n` +
            `      ${renderErr.message}\n\n` +
            `   💡 Hint: Common causes:\n` +
            `      • Using browser-only APIs (window, document) during SSR\n` +
            `      • Hydration mismatch — server and client render different content\n` +
            `      • Missing or incorrect component props\n\n` +
            `      Wrap browser APIs in useEffect() or check typeof window !== "undefined".\n` +
            `   📖 Docs: https://flowjs.dev/docs/troubleshooting#hydration`
        );
    }

    // 3. Serialize data for client hydration
    const serializedData = JSON.stringify(data ?? {}).replace(
        /<\/script>/g,
        "<\\/script>"
    );

    // 4. Construct <head>
    const titleTag = meta.title ? `<title>${escapeHtml(meta.title)}</title>` : "";
    const descTag = meta.description
        ? `<meta name="description" content="${escapeHtml(meta.description)}">`
        : "";
    const scriptTag = clientEntryUrl ? `<script type="module" src="${clientEntryUrl}"></script>` : "";

    // 5. Build final HTML shell
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    ${titleTag}
    ${descTag}
    ${scriptTag}
    <script id="FLOW_DATA" type="application/json">
${serializedData}
    </script>
</head>
<body>
    <div id="root">${htmlOutput}</div>
</body>
</html>`;
}

/**
 * Basic HTML escaping for injects into the head
 */
function escapeHtml(str: string): string {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
