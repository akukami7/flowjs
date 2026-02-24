# Changelog

All notable changes to FlowJS will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/).

## [0.1.0] — 2026-02-24

### Added
- File-system App Router (`app/` directory) with nested layouts
- Dynamic routes (`[param]`) and catch-all (`[...slug]`)
- Server-Side Rendering via React `renderToString`
- Client-side hydration and SPA navigation
- Data loading: `loader`, `action`, `meta` per page
- API routes (`app/api/*/api.ts`)
- Global middleware (`src/middleware.ts`) with redirect/rewrite/headers
- SSG export via `flowjs export`
- Production server with static file serving
- CLI commands: `flowjs dev`, `flowjs build`, `flowjs start`, `flowjs export`
- `create-flowjs-app` scaffolding with 3 templates: basic, blog, tailwind
- Structured DX errors: `RouterError`, `BuildError`, `SSRRenderError`
- Build-time route table diagnostic
- Route conflict detection
- Missing layout validation with hints
- Hydration mismatch troubleshooting docs
- VitePress documentation site
- Performance benchmarking suite
- Community files: issue templates, PR template, CONTRIBUTING.md
