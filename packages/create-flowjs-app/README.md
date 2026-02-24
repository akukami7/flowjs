# create-flowjs-app

The official CLI tool for scaffolding FlowJS applications. It initializes a fully configured monorepo-compatible setup, preparing the environment for rapid React development using SSR, SSG, and file-based routing.

## Usage

You can create a new project interactively:

```bash
npx create-flowjs-app my-app
```

Or pass arguments to skip prompts:

```bash
npx create-flowjs-app my-app --pm pnpm --template blog
```

### Options

- `--pm`: Specify the package manager to use (`npm`, `yarn`, `pnpm`).
- `--ts`: Initialize a TypeScript project (default: `true`). Pass `--no-ts` to disable.
- `--template`, `-t`: Choose a template to scaffold automatically. Available templates:
  - `basic`: Standard React application architecture with generic CSS.
  - `tailwind`: A React setup pre-configured with Tailwind CSS, PostCSS, and Autoprefixer.
  - `blog`: A complete Mini-Blog showcasing `[slug]` SSG generation, API Route databases, and Edge Middleware.

### Templates

Every template is carefully tailored to mirror Next.js App Router patterns cleanly natively built with FlowJS V1. All templates run successfully out-of-the-box leveraging `flowjs dev` or `flowjs build` pipelines natively.
