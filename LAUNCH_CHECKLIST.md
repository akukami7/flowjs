# FlowJS v0.1.0 — Launch Checklist

## 1. Pre-Release Validation ✅

- [x] Run `pnpm -r build` — all 4 packages compile cleanly
- [x] Run `pnpm test` — all Vitest suites pass
- [x] Run `pnpm lint` (if configured) — no errors
- [x] Verify `tsconfig.base.json` strict mode is enabled
- [x] Confirm all `package.json` versions are `0.1.0`
- [x] Confirm `exports` and `bin` fields are correct in each package
  - ⚠️ Fixed: `create-flowjs-app` had `"create-novajs-app"` → `"create-flowjs-app"`

## 2. Smoke Test: `create-flowjs-app` ✅

- [x] `npx create-flowjs-app test-basic --template basic` → scaffolds cleanly
- [x] `npx create-flowjs-app test-blog --template blog` → scaffolds cleanly
- [x] `npx create-flowjs-app test-tw --template tailwind` → scaffolds cleanly
- [x] In each scaffolded project:
  - [x] `pnpm install` succeeds
  - [x] `pnpm dev` starts without errors, pages render at `localhost:3000`
  - [x] `pnpm build` completes, route table prints
  - [x] `pnpm start` serves production HTML

## 3. Smoke Test: `examples/demo` ✅

- [x] `cd examples/demo && pnpm build` — build succeeds, route table shows 5 routes
- [x] `pnpm start` — server boots at `localhost:3000`
- [x] `GET /` → 200, SSR HTML with layout
- [x] `GET /blog` → 200, blog listing
- [x] `GET /blog/hello-world` → 200, dynamic route with `[slug]` param
- [x] `GET /dashboard` → 200, nested layout
- [x] `GET /api/posts` → 200, JSON response
- [x] `GET /old` → 301 redirect (middleware)
  - ⚠️ Fixed: middleware used Web `Request` instead of Node `IncomingMessage`
- [x] `GET /nonexistent` → 404

## 4. Benchmark Validation ✅

- [x] `cd benchmarks && node run.mjs` completes for all 3 targets
- [x] FlowJS Req/Sec > 3000 (actual: 3580)
- [x] FlowJS p50 < 50ms (actual: 27ms)
- [x] Results table matches `benchmarks/README.md`

## 5. Documentation ✅

- [x] `docs/index.md` — getting started content present
- [x] `docs/routing.md` — file conventions, layouts, dynamic routes
- [x] `docs/data-loading.md` — loaders, actions
- [x] `docs/api-routes.md` — API handler conventions
- [x] `docs/middleware.md` — middleware setup
- [x] `docs/deployment.md` — production build + deploy
- [x] `docs/troubleshooting.md` — hydration mismatch section present
- [ ] VitePress docs site builds: `cd docs-site && pnpm build`
- [x] All code examples in docs are tested and runnable

## 6. npm Publish

```bash
# 1. Login
npm login

# 2. Dry run to verify package contents
pnpm --filter @flowjs/router publish --dry-run
pnpm --filter @flowjs/server publish --dry-run
pnpm --filter @flowjs/build publish --dry-run
pnpm --filter flowjs publish --dry-run
pnpm --filter create-flowjs-app publish --dry-run

# 3. Publish (order matters — dependencies first)
pnpm --filter @flowjs/router publish --access public
pnpm --filter @flowjs/server publish --access public
pnpm --filter @flowjs/build publish --access public
pnpm --filter flowjs publish --access public
pnpm --filter create-flowjs-app publish --access public
```

- [ ] `@flowjs/router@0.1.0` published
- [ ] `@flowjs/server@0.1.0` published
- [ ] `@flowjs/build@0.1.0` published
- [ ] `flowjs@0.1.0` published
- [ ] `create-flowjs-app@0.1.0` published
- [ ] Verify: `npx create-flowjs-app@latest my-app` works from npm

## 7. Post-Publish Verification

- [ ] `npm info flowjs` shows correct version and metadata
- [ ] `npx create-flowjs-app fresh-test --template basic` → works from registry
- [ ] `cd fresh-test && pnpm dev` → pages render
- [ ] `pnpm build && pnpm start` → production server works

## 8. GitHub Release

- [ ] Create git tag: `git tag v0.1.0 && git push --tags`
- [ ] Create GitHub Release `v0.1.0` with release notes below
- [ ] Attach benchmark results screenshot (optional)

### Release Notes Template

```markdown
# FlowJS v0.1.0 🚀

The initial release of FlowJS — a modern full-stack React framework
powered by Vite with file-system routing, SSR, and zero-config builds.

## ✨ Features
- File-system App Router (`app/` directory)
- Nested layouts with automatic tree construction
- Dynamic routes (`[param]`) and catch-all (`[...slug]`)
- Server-Side Rendering with React `renderToString`
- Client-side hydration and SPA navigation
- Data loading (`loader`, `action`, `meta`)
- API routes (`app/api/*/api.ts`)
- Global middleware (`src/middleware.ts`)
- SSG export (`flowjs export`)
- Production server with static file serving
- CLI: `flowjs dev`, `flowjs build`, `flowjs start`, `flowjs export`
- `create-flowjs-app` with 3 templates: basic, blog, tailwind
- Structured DX errors (RouterError, BuildError, SSRRenderError)
- Build route table diagnostic

## 📊 Performance
| Metric | FlowJS | Next.js |
|--------|--------|---------|
| Req/Sec | 3,580 | 560 |
| p50 Latency | 27ms | 167ms |
| Build Time | 1.57s | 6.06s |
| Bundle Size | 0.21 MB | 5.33 MB |

## 📦 Packages
- `flowjs@0.1.0`
- `@flowjs/router@0.1.0`
- `@flowjs/server@0.1.0`
- `@flowjs/build@0.1.0`
- `create-flowjs-app@0.1.0`
```

## 9. Announce

- [ ] Update `README.md` badges (npm version, CI status)
- [ ] Post on Twitter/X
- [ ] Post on Reddit (r/reactjs, r/javascript)
- [ ] Submit to Hacker News (Show HN)
