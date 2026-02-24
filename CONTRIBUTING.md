# Contributing to FlowJS

Thank you for your interest in contributing to FlowJS! This guide will help you get started.

## Table of Contents

- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Code Style](#code-style)
- [Commit Convention](#commit-convention)
- [Pull Request Process](#pull-request-process)
- [Project Structure](#project-structure)
- [Running Tests](#running-tests)
- [Reporting Issues](#reporting-issues)

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18.0
- **pnpm** ≥ 8.0 (`npm install -g pnpm`)
- **Git**

### Setup

```bash
# 1. Fork and clone
git clone https://github.com/<your-username>/flowjs.git
cd flowjs

# 2. Install dependencies
pnpm install

# 3. Build all packages
pnpm -r build

# 4. Run tests
pnpm test

# 5. Start the example app in dev mode
cd examples/basic
pnpm dev
```

---

## Development Workflow

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feat/my-feature
   # or
   git checkout -b fix/my-bugfix
   ```

2. **Make your changes** — edit code in `packages/` or `docs/`.

3. **Build and test** before committing:
   ```bash
   pnpm -r build
   pnpm test
   ```

4. **Add a changeset** (if your change affects published packages):
   ```bash
   pnpm changeset
   ```

5. **Commit** using [Conventional Commits](#commit-convention).

6. **Push** and open a Pull Request.

---

## Code Style

### TypeScript

- **Strict mode** — all packages use `"strict": true`
- **No `any`** unless absolutely necessary (document why with a comment)
- **Prefer `const`** over `let`; never use `var`
- **Named exports** preferred over default exports (except for page/layout components)
- **Explicit return types** on public API functions
- Use **template literals** over string concatenation

### Formatting

- **Indentation**: 4 spaces
- **Semicolons**: always
- **Quotes**: double quotes `"`
- **Trailing commas**: ES5-style (objects, arrays, parameters)
- **Line length**: 120 characters soft limit

### File Naming

| Type | Convention | Example |
|------|-----------|---------|
| Source files | `camelCase.ts` | `devServer.ts`, `layoutTree.ts` |
| Test files | `*.test.ts` | `scanner.test.ts` |
| React components | `PascalCase.tsx` | `Link.tsx`, `App.tsx` |
| Config files | `lowercase` | `tsconfig.json`, `tsup.config.ts` |

### Imports

```typescript
// 1. Node built-ins
import { join } from "node:path";

// 2. External packages
import React from "react";

// 3. Internal packages (@flowjs/*)
import { scanAppDir } from "@flowjs/router";

// 4. Relative imports
import { renderSSR } from "./ssr/render.js";
```

---

## Commit Convention

We follow [Conventional Commits](https://www.conventionalcommits.org/). Every commit message must have the format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | When to use |
|------|------------|
| `feat` | New feature |
| `fix` | Bug fix |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |
| `refactor` | Code restructuring, no feature/fix |
| `perf` | Performance improvement |
| `test` | Adding or fixing tests |
| `chore` | Build, CI, tooling changes |

### Scopes

Use the package name without `@flowjs/` prefix:

- `router`, `server`, `build`, `flowjs`, `cli`, `docs`

### Examples

```
feat(router): add route conflict detection
fix(server): wrap loader errors with LOADER_THROW code
docs: add hydration mismatch troubleshooting section
test(router): add scanner conflict detection tests
chore(ci): add Node 22 to test matrix
```

### Breaking Changes

Add `BREAKING CHANGE:` in the footer or `!` after the type:

```
feat(router)!: rename scanAppDir to scanRoutes

BREAKING CHANGE: `scanAppDir` has been renamed to `scanRoutes`.
Update all imports accordingly.
```

---

## Pull Request Process

1. **One concern per PR** — don't mix features with refactors.
2. **Update tests** — any new feature or bugfix should include tests.
3. **Update docs** — if you're changing public API, update the relevant `docs/*.md`.
4. **Add a changeset** — run `pnpm changeset` and select the affected packages.
5. **Fill out the PR template** — include description, type of change, and testing steps.
6. **Keep PRs small** — under 400 lines changed when possible.
7. **Respond to reviews** — address feedback promptly or explain your reasoning.

### Review Criteria

- [ ] Code follows the style guide
- [ ] Tests pass and new tests are added
- [ ] No unnecessary dependencies introduced
- [ ] Error messages follow the [structured error pattern](packages/flowjs/src/errors.ts)
- [ ] Commit messages follow Conventional Commits

---

## Project Structure

```
flowjs/
├── packages/
│   ├── flowjs/          # Core package + CLI (bin: flowjs)
│   ├── router/          # File-system router (@flowjs/router)
│   ├── server/          # Dev & prod servers (@flowjs/server)
│   ├── build/           # Vite build pipeline (@flowjs/build)
│   └── create-flowjs-app/  # Project scaffolding CLI
├── examples/
│   ├── basic/           # Minimal example app
│   └── demo/            # Full-featured demo (blog, API, middleware)
├── docs/                # Documentation markdown files
├── docs-site/           # VitePress documentation site
├── benchmarks/          # Performance benchmarking suite
└── .github/             # CI, issue templates, PR template
```

---

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests for a specific package
pnpm --filter @flowjs/router test

# Run tests in watch mode
pnpm --filter @flowjs/router test -- --watch

# Run with coverage
pnpm test -- --coverage
```

### Writing Tests

- Place tests in `src/__tests__/` within the relevant package
- Use [Vitest](https://vitest.dev/) as the test runner
- Name test files as `*.test.ts`
- Use descriptive `describe` / `it` blocks

```typescript
import { describe, it, expect } from "vitest";
import { scanAppDir } from "../scanner.js";

describe("scanAppDir", () => {
    it("should detect page.tsx in root", () => {
        // ...
    });
});
```

---

## Reporting Issues

- Use the [Bug Report](https://github.com/flowjs/flowjs/issues/new?template=bug.yml) template for bugs
- Use the [Feature Request](https://github.com/flowjs/flowjs/issues/new?template=feature.yml) template for ideas
- Search existing issues before creating a new one
- Include the FlowJS version, Node version, and OS

---

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
