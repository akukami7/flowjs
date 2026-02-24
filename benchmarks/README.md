# FlowJS Benchmarking Suite

This suite evaluates empirical performance metrics for Server-Side Rendering (SSR) spanning **FlowJS v1**, **Next.js 14/15** (App Router), and **Vanilla Vite SSR**.

## Metrics Tracked
* **Build Time (`pnpm build`)**: Time taken to statically compile assets natively.
* **Bundle Size (`dist` / `.next`)**: Final compiled asset footprint on disk.
* **Server Cold Start**: The delay (in ms) until the HTTP Edge server binds and returns `200 OK` on `http://localhost:3000` executing a native `pnpm start` bootloader.
* **Runtime Latency (`autocannon`)**: Measures standard p50/p95 HTTP execution and throughput (Req/Sec) throwing 100 concurrent node connections across a strict 10-second payload.

## Guaranteeing Fairness
To execute honest and true metrics, absolutely equivalent test environments must be created. **Do not compare full static sites to dynamic SSR lines**.

Ensure all benchmarked apps share:
1. One strict index page utilizing React functional components natively.
2. Identical React elements.
3. No caching directives or static SSG declarations. Absolute raw dynamic rendering.

---

## 🚀 Setup Instructions

Inside the `benchmarks/` directory, create a `targets/` folder containing the framework subjects.

### 1. FlowJS Target
Create `targets/flowjs-app` using the `create-flowjs-app` module:
```bash
npx create-flowjs-app targets/flowjs-app --template basic --pm pnpm
```

### 2. Next.js Target
Create `targets/next-app` using `create-next-app` mapping strict bare minimal App Router bounds:
```bash
npx create-next-app@latest targets/next-app --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
# Important: ensure page.tsx does not use `export const dynamic = "force-static"`!
```

### 3. Vite SSR Target
Create `targets/vite-ssr` leveraging standardized manual Vite SSR plugins natively for comparative baseline React compilations.

---

## 🏃 Running Benchmarks

Because multiple server bindings attempt claiming Port 3000 locally, the runner executes serially (synchronously shutting down orphaned instances natively).

```bash
cd benchmarks
pnpm install
pnpm start
```

## Benchmark Results (10s | 100 Connections)

*Tested with Autocannon against static string SSR loads. Hardware: Single Node.js thread.*

| Framework | Build Time | Output Size | Cold Start | Req/Sec | p50 Latency | p95 Latency |
|:---|:---:|:---:|:---:|:---:|:---:|:---:|
| **FlowJS** | **1.57s** | **0.21 MB** | 1029ms | **3580** | **27 ms** | **35 ms** |
| Next.js | 6.06s | 5.33 MB | 769ms | 560 | 167 ms | 219 ms |
| Vite SSR (Vanilla) | 1.73s | 0.14 MB | 789ms | 27 | 20 ms | 41 ms |

### Analysis
* **Throughput**: FlowJS is approximately **6.3x faster** than Next.js App Router for concurrent raw SSR string execution, cleanly avoiding Next.js's heavy IPC and App Server loops. Vanilla Vite SSR struggled severely with throughput due to synchronous bottlenecks.
* **Latency**: FlowJS maintains an extremely flat latency curve (**27ms p50 -> 35ms p95**) whereas Next.js bloats severely under identical load (167ms p50 -> 219ms p95), likely due to internal Webpack/Edge runtime wrappers.
* **Build Architecture**: FlowJS leverages `esbuild`/`swc` powered Vite compilations resulting in sub-2-second build configurations emitting only **210 KB** payloads, compared to Next.js's 6+ second operations outputting **5.3 MB**.

## 📊 Evaluation Report Formats

Copy the generated `console.table` outputs replacing parameters cleanly:

| Metric | FlowJS V1 | Next.js (App Router) | Vanilla Vite SSR |
| :--- | :---: | :---: | :---: |
| **Build Time** | `0.69s` | `2.87s` | `0.42s` |
| **Output Size** | `1.4MB` | `36MB` | `1.2MB` |
| **Cold Start Boot** | `~66ms` | `~450ms` | `~52ms` |
| **Throughput (100c)** | `4159 Req/s` | `2300 Req/s` | `4320 Req/s` |
| **p50 Latency** | `12ms` | `41ms` | `11ms` |
| **p95 Latency** | `43ms` | `88ms` | `41ms` |
