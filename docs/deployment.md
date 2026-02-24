# Deployment

FlowJS outputs a hyper-optimized distribution target optimized for raw Node.js execution constraints or CDNs using the built-in CLI compiler.

## Available CLI Commands
* `pnpm dev` – Starts the Vite dev server with Hot Module Replacement (HMR).
* `pnpm build` – Compiles your TypeScript, styles, API boundaries, and SSR wrappers recursively into `./dist`.
* `pnpm start` – Boots the optimized `./dist/server` React server over Node HTTP buffers natively.
* `pnpm export` – Scrapes `manifest.json` static outputs alongside route definitions emitting pure `html/js/css` bundles to `./out`.

## Output Structure

Running `pnpm build` processes everything into `/dist`:

```text
dist/
├── manifest.json       # Route map mapping
├── client/
│   ├── .vite/          # Dev compilation caching 
│   ├── assets/         # Hashes image + CSS bindings 
│   └── index.html      # CSR layout shell 
└── server/
    ├── assets/         # React SSR object models
    └── server-entry.js # Compressed monolith prod-router runtime
```

## Node Deployment (SSR)
If your app utilizes API routes or relies on `loader()` data payloads requesting dynamically authenticated server endpoints—you must deploy FlowJS onto a traditional server layer (Docker, EC2, Vercel Node Functions).

**Steps:**
1. Install dependencies on your VPS: `pnpm install --prod`
2. Build the server environment: `pnpm build`
3. Launch proxy listener blocks: `PM2 start "pnpm start"`
4. Expose `localhost:3000` behind NGINX.

## Static Hosting (SSG)
If you marked all pages using `config = { dynamic: "force-static" }`, you do not need an active Node HTTP listener running. You can statically deploy to GitHub Pages, Cloudflare Pages, S3, or Vercel Edge.

**Steps:**
1. Build the compilation targets: `pnpm build` 
2. Trigger the static stringifier generator: `pnpm export`
3. Upload the resulting `/out` folder output verbatim to any CDN provider securely.
