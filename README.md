# FlowJS

> Full-stack React framework powered by Vite.
> File-system routing, SSR, SSG, and zero-config builds.

[![npm version](https://img.shields.io/npm/v/flowjs)](https://npmjs.com/package/flowjs)
[![license](https://img.shields.io/npm/l/flowjs)](./LICENSE)

## Quick Start

```bash
npx create-flowjs-app my-app
cd my-app
pnpm dev
```

## What FlowJS Does

| Feature | Status |
|---------|--------|
| App Router (`app/` directory) | ✅ |
| Nested Layouts | ✅ |
| Dynamic Routes (`[param]`, `[...slug]`) | ✅ |
| SSR (renderToString) | ✅ |
| SSG Export | ✅ |
| API Routes | ✅ |
| Middleware | ✅ |
| Client Hydration | ✅ |
| Structured DX Errors | ✅ |

## Project Structure

```
my-app/
├── app/
│   ├── layout.tsx       # Root Layout
│   ├── page.tsx         # / route
│   ├── blog/
│   │   ├── page.tsx     # /blog
│   │   └── [slug]/
│   │       └── page.tsx # /blog/:slug
│   └── api/
│       └── posts/
│           └── api.ts   # /api/posts
└── src/
    └── middleware.ts     # Global middleware
```

## Page Example

```tsx
// app/page.tsx
import { definePage } from "flowjs";

export default definePage({
    loader({ params }) {
        return { title: "Hello FlowJS" };
    },
    meta({ data }) {
        return { title: data.title };
    },
    default({ data }) {
        return <h1>{data.title}</h1>;
    },
});
```

## Layout Example

```tsx
// app/layout.tsx
import { defineLayout } from "flowjs";

export default defineLayout({
    default({ children }) {
        return (
            <html lang="en">
                <head><meta charSet="UTF-8" /></head>
                <body>
                    <nav>My Navbar</nav>
                    <main>{children}</main>
                </body>
            </html>
        );
    }
});
```

## CLI Commands

| Command | Description |
|---------|-------------|
| `flowjs dev` | Start dev server with HMR |
| `flowjs build` | Build for production |
| `flowjs start` | Start production server |
| `flowjs export` | Export static HTML (SSG) |

## Performance

Benchmarked against Next.js App Router (100 connections, 10s, same React SSR page):

| Metric | FlowJS | Next.js |
|--------|--------|---------|
| Throughput | 3,580 req/s | 560 req/s |
| p50 Latency | 27ms | 167ms |
| Build Time | 1.57s | 6.06s |
| Bundle Size | 0.21 MB | 5.33 MB |

## Prerequisites

- Node.js ≥ 18.0
- pnpm ≥ 8.0 (recommended), npm, or yarn

## Documentation

- [Routing](docs/routing.md)
- [Data Loading & SSG](docs/data-loading.md)
- [API Routes](docs/api-routes.md)
- [Middleware](docs/middleware.md)
- [Deployment & Build](docs/deployment.md)
- [Troubleshooting](docs/troubleshooting.md)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](./LICENSE) © FlowJS Contributors
