# Data Loading & SSG

FlowJS gives you granular control over when pages render. By default, pages are dynamically rendered on the server per request (SSR). FlowJS V1 provides powerful primitives to switch components into static compilation paths seamlessly.

## Default SSR Behavior
If you do not specify a routing mode, the file is compiled strictly per-request using Server-Side Rendering (SSR). A `loader` runs on the server for each hit.

```tsx
import { definePage } from "flowjs";

export default definePage({
    async loader({ params, request }) {
        const res = await fetch("https://api.example.com/data");
        const data = await res.json();
        return { data };
    },
    default({ data }) {
        return <pre>{JSON.stringify(data)}</pre>;
    }
});
```

## Force Static (SSG)
You can force a route to be statically generated at build time using the `config` export.

```tsx
import { definePage } from "flowjs";

export const config = { dynamic: "force-static" };

export default definePage({
    default() {
        return <h1>Rendered into static HTML at build!</h1>;
    }
});
```

When building, FlowJS captures the AST output of this page and resolves it entirely to pure `.html`.

## `generateStaticParams`
For Dynamic Segments (`[slug]`) paired with `force-static`, FlowJS needs to know which exact URLs to construct at build time. Use `generateStaticParams` to feed the SSG compiler.

```tsx
// app/blog/[slug]/page.tsx
import { definePage } from "flowjs";

export const config = { dynamic: "force-static" };

export default definePage({
    generateStaticParams() {
        return [
            { slug: "hello-world" },
            { slug: "flowjs-v1" }
        ];
    },
    async loader({ params }) {
        return { title: `Post: ${params.slug}` }; // Computes locally during build
    },
    default({ data }) {
        return <h1>{data.title}</h1>;
    }
});
```

## When Pages Are Pre-Rendered
1. When `config.dynamic = "force-static"` is explicitly exported.
2. When the `flowjs export` pipeline runs post-build. (Exports all supported routes to `/out`).
3. `loader` calls on static routes only execute during the Vite Node build-pass.

## Limitations in V1
- **No ISR:** Incremental Static Regeneration is not available. Static pages remain static until the next deployment.
- **Client Cache:** Data mutations currently necessitate hard browser reloads rather than soft hydration fetches.
