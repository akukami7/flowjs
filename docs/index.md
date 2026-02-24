---
layout: home

hero:
  name: "FlowJS"
  text: "FlowJS V1"
  tagline: "Universal App Router framework. Production-grade speed, SSR/SSG fetching, and Edge API primitives aligned securely."
  actions:
    - theme: brand
      text: Quickstart
      link: /routing
    - theme: alt
      text: View on GitHub
      link: https://github.com/your-org/flowjs

features:
  - title: File-System Routing
    details: Automatically discover and parse routes, catch-all paths, and route groups directly from the `app/` directory mimicking standard Next.js-like capabilities.
  - title: First-Class SSR & SSG
    details: Effortlessly pre-render Server-Side payloads or swap caching states using static tree generation primitives securely.
  - title: Edge APIs
    details: Build robust API microservices with native backend Route execution layers intercepting Request instances uniformly.
---

## ⚡ Quickstart

Get your new universal FlowJS App up and running in 3 easy steps:

### 1. Installation
Install and scaffold your generic full-stack environment globally using our native CLI:
```bash
npx create-flowjs-app@latest my-app --template blog
cd my-app
```

> **Pro Tip:** Try passing `--template tailwind` or `--template basic` to customize your starter workspace natively, or omit the flag entirely to choose interactively!

### 2. Development
Boot the fast Vite-based execution engine with live HMR:
```bash
pnpm install
pnpm dev
```

### 3. Build & Deploy
Compile React payloads accurately for Edge execution and statically ship `dist`:
```bash
pnpm build
pnpm start
```

---

## Architecture Overview

### SSR vs SSG Execution Types
FlowJS performs strict dynamic rendering (SSR) if data requires real-time hydration upon initial generic HTTP Requests. Sub-trees may seamlessly switch to Static Generation securely via standard string hooks enabling monumental Edge cache distributions:
```typescript
export const dynamic = 'force-static';
```

### Root Middleware Boundaries
Observe that Edge computing arrays globally fire before logical tree segments unpack their layouts natively:
::: warning Middleware Execution Order
`middleware.ts` runs strictly **before** React layouts and standard pages dynamically match! Ideal for validating token cookies before data-loading runs securely.
:::

---

## V1 Scope
FlowJS V1 natively supports file-based routing methodologies alongside:
* Universal SSR rendering primitives
* Central Layout mapping constructs 
* Edge Middleware topologies
* API Response integrations

## Roadmap V2
Subsequent distributions plan on integrating:
* React Server Components (RSC) standardizations 
* Streaming hydration buffers
* Image Optimization algorithms
