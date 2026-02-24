# FlowJS v0.1.0 — Release Engineering Report

---

## 1) Risk Audit — ТОП-10 реальных рисков

### 🔴 CRITICAL (блокеры публикации)

**R1. `workspace:*` зависимости не разрешатся в npm**
Все internal deps (`@flowjs/router`, `@flowjs/server`, `@flowjs/build`) используют `workspace:*` или `workspace:^`. pnpm publish **должен** автоматически заменить их на реальные версии (`^0.1.0`), но **только если публиковать через pnpm**. Если использовать `npm publish` — сломается.

**Действие:** Публиковать только через `pnpm publish`. Проверить после `pnpm pack`, что в `package.json` внутри `.tgz` стоит `^0.1.0` вместо `workspace:*`.

---

**R2. Нет файла LICENSE в репозитории**
`package.json` указывает `"license": "MIT"`, но файла `LICENSE` нет нигде. npm покажет warning, GitHub не отобразит лицензию. Юридический риск для корпоративных пользователей.

**Действие:** Создать `LICENSE` в корне.

---

**R3. README содержит `create-novajs-app` (строка 21)**
Quickstart показывает `pnpm create-novajs-app my-app` — неправильное имя пакета.

**Действие:** Заменить на `npx create-flowjs-app my-app`.

---

### 🟡 HIGH (первые пользователи столкнутся)

**R4. React/Vite в dependencies вместо peerDependencies**
`flowjs` тянет `react@^19.2.4` в прямых `dependencies`. Пользователь, у которого `react@18.x`, получит **две версии React** и hydration-ошибки. `react`/`react-dom`/`vite` должны быть в `peerDependencies`.

**Действие:** Перенести в `peerDependencies` + добавить `peerDependenciesMeta` для `vite`.

---

**R5. Нет `engines` в package.json**
Ни один пакет не указывает `"engines": { "node": ">=18" }`. Пользователь на Node 16 получит криптованные ошибки вместо понятного сообщения.

**Действие:** Добавить `"engines"` во все 5 `package.json`.

---

**R6. Нет `repository` / `homepage` в package.json**
Pages на npmjs.com будут пустыми, без ссылок. Снижает доверие.

**Действие:** Добавить `repository`, `homepage`, `bugs` во все пакеты.

---

### 🟠 MEDIUM

**R7. `@types/react` в dependencies (не devDependencies)**
`flowjs/package.json` держит `@types/react` и `@types/react-dom` в `dependencies`. Это означает, что в `node_modules` пользователя установятся **конкретные** `@types/react@19.x`, конфликтуя с его версией.

**Действие:** Перенести `@types/react*` в `devDependencies`.

---

**R8. Отсутствует `.npmignore` / проверка размера пакета**
`"files": ["dist"]` правильно, но у `create-flowjs-app` шаблоны могут содержать `node_modules` или `.git`. Если шаблоны тянут мусор — пакет раздуется.

**Действие:** `pnpm pack` + проверить размер + содержимое `.tgz`.

---

**R9. Windows-специфичные проблемы в шаблонах**
CLI использует `execSync("pnpm install")` — на Windows без git bash `pnpm` может не найтись (PATH). Также `path.join` нормализует слэши, но hardcoded `/` в строках может ломаться.

**Действие:** Проверить CLI на чистой Windows-установке.

---

**R10. Нет CHANGELOG.md**
Стандартное ожидание для OSS пакета — CHANGELOG. Без него непонятно, что изменилось между версиями.

**Действие:** Создать `CHANGELOG.md` с записью для v0.1.0.

---

## 2) Чеклист проверки npm упаковки

### A. package.json полнота

```bash
# Проверить все пакеты на обязательные поля
node -e "
const pkgs = [
  'packages/flowjs/package.json',
  'packages/router/package.json',
  'packages/server/package.json',
  'packages/build/package.json',
  'packages/create-flowjs-app/package.json'
];
const required = ['name','version','description','license','repository','engines'];
for (const p of pkgs) {
  const pkg = require('./' + p);
  const missing = required.filter(f => !pkg[f]);
  console.log(p, missing.length ? '❌ Missing: ' + missing.join(', ') : '✅ OK');
}
"
```

Необходимые поля для КАЖДОГО пакета:
```json
{
  "repository": {
    "type": "git",
    "url": "https://github.com/akukami7/flowjs.git",
    "directory": "packages/flowjs"
  },
  "homepage": "https://github.com/akukami7/flowjs#readme",
  "bugs": "https://github.com/akukami7/flowjs/issues",
  "engines": { "node": ">=18.0.0" }
}
```

### B. Содержимое .tgz (что реально попадёт в npm)

```bash
# Для каждого пакета
cd packages/router && pnpm pack && tar -tf flowjs-router-0.1.0.tgz
cd packages/server && pnpm pack && tar -tf flowjs-server-0.1.0.tgz
cd packages/build  && pnpm pack && tar -tf flowjs-build-0.1.0.tgz
cd packages/flowjs && pnpm pack && tar -tf flowjs-0.1.0.tgz
cd packages/create-flowjs-app && pnpm pack && tar -tf create-flowjs-app-0.1.0.tgz
```

**Проверить:**
- [ ] `dist/` есть и содержит `.js`, `.cjs`, `.d.ts` файлы
- [ ] `cli.js` есть (для flowjs + create-flowjs-app)
- [ ] `templates/` присутствует целиком (для create-flowjs-app)
- [ ] Нет лишнего: `src/`, `tsconfig.json`, `node_modules/`, `.turbo/`, `*.test.ts`
- [ ] Размер пакетов < 1MB (кроме create-flowjs-app с шаблонами)

### C. Exports работают

```bash
# После pnpm pack + распаковки
node -e "import('@flowjs/router').then(m => console.log('ESM ✅', Object.keys(m)))"
node -e "const m = require('@flowjs/router'); console.log('CJS ✅', Object.keys(m))"

# Проверка bin
node packages/flowjs/dist/cli.js --help
node packages/create-flowjs-app/index.js --help
```

### D. workspace:* → реальная версия

```bash
cd packages/flowjs
pnpm pack
tar -xf flowjs-0.1.0.tgz
cat package/package.json | grep "@flowjs"
# Должно быть "^0.1.0", НЕ "workspace:*"
```

### E. Shebang в bin

```bash
head -1 packages/flowjs/dist/cli.js
# Должно быть: #!/usr/bin/env node

head -1 packages/create-flowjs-app/index.js
# Должно быть: #!/usr/bin/env node
```

**Результат:** Оба имеют `#!/usr/bin/env node` ✅

---

## 3) UX ревью — путь нового пользователя

### Симуляция: Next.js разработчик пробует FlowJS

**Шаг 1: `npx create-flowjs-app my-app`**
- ✅ Шаблоны (basic/blog/tailwind) предлагаются
- ⚠️ **Проблема:** CLI спрашивает package manager, но hardcode `execSync("pnpm install")`. Если юзер выбрал npm — всё равно запустится pnpm
- ⚠️ **Проблема:** Нет `--help` вывода с описанием флагов
- 💡 **Fix:** Добавить `--help` обработку + уважать выбранный PM

**Шаг 2: Структура проекта**
- ✅ `app/` конвенция ясна для Next.js юзера
- ⚠️ **Проблема:** Next.js использует `layout.tsx`, FlowJS тоже, но API другой (`defineLayout` vs default export). Нет inline-комментариев в шаблоне, объясняющих разницу
- 💡 **Fix:** Добавить комментарии в шаблонных файлах

**Шаг 3: `pnpm dev`**
- ✅ Сервер стартует, HMR работает
- ⚠️ **Проблема:** Нет URL в выводе при старте (как у Vite: `Local: http://localhost:3000`)
- 💡 **Fix:** Стандартизировать CLI вывод

**Шаг 4: `pnpm build`**
- ✅ Route table выводится — отлично!
- ✅ Время сборки показывается

**Шаг 5: `pnpm start`**
- ✅ Production server стартует
- ⚠️ **Проблема:** При EADDRINUSE — стектрейс Node.js вместо красивого сообщения

### Топ-5 quick wins для DX:
1. `--help` в CLI (оба пакета)
2. URL в dev server output
3. Красивый EADDRINUSE с hint `npx kill-port 3000`
4. Комментарии в template файлах
5. `flowjs --version` (сейчас работает?)

---

## 4) README — предлагаемая структура

```markdown
# FlowJS

> Full-stack React framework powered by Vite.
> File-system routing, SSR, SSG, and zero-config builds.

[![npm version](https://img.shields.io/npm/v/flowjs)](https://npmjs.com/package/flowjs)
[![license](https://img.shields.io/npm/l/flowjs)](./LICENSE)

## Quick Start

\`\`\`bash
npx create-flowjs-app my-app
cd my-app
pnpm dev
\`\`\`

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

\`\`\`
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
\`\`\`

## Page Example

\`\`\`tsx
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
\`\`\`

## CLI Commands

| Command | Description |
|---------|-------------|
| `flowjs dev` | Start dev server with HMR |
| `flowjs build` | Build for production |
| `flowjs start` | Start production server |
| `flowjs export` | Export static HTML (SSG) |

## Performance

Benchmarked against Next.js App Router (100 connections, 10s):

| Metric | FlowJS | Next.js |
|--------|--------|---------|
| Throughput | 3,580 req/s | 560 req/s |
| p50 Latency | 27ms | 167ms |
| Build Time | 1.57s | 6.06s |
| Bundle Size | 0.21 MB | 5.33 MB |

## Documentation

- [Routing](docs/routing.md)
- [Data Loading](docs/data-loading.md)
- [API Routes](docs/api-routes.md)
- [Middleware](docs/middleware.md)
- [Deployment](docs/deployment.md)
- [Troubleshooting](docs/troubleshooting.md)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

MIT © FlowJS Contributors
```

**Ключевые отличия от текущего README:**
- Убран `create-novajs-app`
- Добавлены бейджи
- Feature table вместо bullet list
- Benchmark table — для доверия
- CLI commands table
- Убран раздел "V1 Scope" (выглядит как оправдание)
- Roadmap V2 отдельным файлом

---

## 5) Тексты для запуска

### Twitter/X

```
Released FlowJS v0.1.0 — a full-stack React framework built on Vite.

- App Router with file-system routing
- SSR + SSG + API routes
- ~6x throughput vs Next.js in benchmarks (3,580 vs 560 req/s)
- 1.57s builds, 0.21 MB bundles

Probably not ready for production yet, but the architecture is interesting.

npx create-flowjs-app my-app

https://github.com/akukami7/flowjs
```

### Reddit (r/reactjs)

```
Title: FlowJS v0.1.0 — full-stack React framework powered by Vite (SSR, App Router, SSG)

Hey r/reactjs. I've been building FlowJS — an open-source full-stack React
framework that uses Vite for both dev and production builds.

What it does:
- File-system routing with app/ directory (similar to Next.js)
- Nested layouts
- SSR via renderToString, SSG via `flowjs export`
- Data loading (loaders, actions, meta)
- API routes and global middleware
- Zero-config CLI: `flowjs dev`, `flowjs build`, `flowjs start`

Where it's different from Next.js:
- Vite-powered (esbuild/swc) — builds in ~1.5s vs Next's ~6s
- Much smaller output (0.2 MB vs 5 MB)
- Simple architecture — no React Server Components, no streaming,
  just straightforward SSR + hydration
- Everything is explicit, no magic

The architecture is intentionally simple. SSR uses renderToString,
client hydration is standard React. No RSC, no partial hydration.
This is a trade-off: simpler mental model, but less granular.

Benchmark (100 concurrent connections, 10s, same React page):
- FlowJS: 3,580 req/s, 27ms p50
- Next.js App Router: 560 req/s, 167ms p50

Quick start:
npx create-flowjs-app my-app

Feedback welcome — especially on API design and what you'd want in a v0.2.

GitHub: https://github.com/akukami7/flowjs
```

### Show HN

```
Title: Show HN: FlowJS – Full-stack React framework on Vite (SSR, file routing, SSG)

FlowJS is a full-stack React framework I built to understand what a
simpler alternative to Next.js could look like.

Key decisions:
- Vite for everything (dev server, production builds)
- File-system routing with app/ directory
- SSR via renderToString (no streaming, no RSC — intentionally)
- Standard client hydration
- loaders/actions/meta for data flow
- Global middleware for auth/redirects

The result is a framework where the entire request lifecycle is explicit.
No server components, no automatic code splitting boundaries — you get
React SSR with file-based routing and that's it.

Build time is ~1.5s (vs ~6s Next.js), bundles are ~200KB (vs ~5MB Next.js),
throughput is ~6x higher in our benchmarks. This is partly because we do
less (no RSC, no ISR) but partly because Vite's esbuild pipeline is fast.

What's missing for production:
- Streaming SSR (planned for v0.2)
- React Server Components (evaluating)
- Edge deployment adapters
- Error overlay in dev mode

Try it: npx create-flowjs-app my-app

Source: https://github.com/akukami7/flowjs
```

---

## 6) V1 → V2 Roadmap (8 приоритизированных фич)

| # | Фича | Почему важно | Сложность |
|---|------|-------------|-----------|
| 1 | **Streaming SSR** (`renderToPipeableStream`) | Текущий `renderToString` блокирует event loop. Это "технический долг #1". Стриминг = лучший TTFB + поддержка `<Suspense>` | Medium |
| 2 | **Полноценный SPA-роутер** (client-side `<Link>`) | Сейчас каждый переход = полная перезагрузка. После добавления — FlowJS станет полноценным SPA | Medium |
| 3 | **Error Overlay в dev** (Vite-style) | Красный оверлей с трассировкой ошибки прямо в браузере. Без него debug = терминал | Low |
| 4 | **Hot Module Replacement для серверного кода** | Сейчас при изменении loader/middleware нужен рестарт. Vite SSR HMR решает это | Low |
| 5 | **Edge Adapters** (Vercel, Cloudflare Workers, Netlify) | Без deployment adapters — только Node.js. Один adapter = огромный рост аудитории | Medium |
| 6 | **React Server Components** (basic support) | RSC = меньше JS на клиенте. Не обязательно полный RSC, но basic `"use server"` для actions | High |
| 7 | **Incremental Static Regeneration (ISR)** | SSG с автоматическим ребилдом по таймеру. Очень востребовано для контент-сайтов | Medium |
| 8 | **Prefetching + Route-level Code Splitting** | `<Link>` с prefetch + автоматический код-сплиттинг по маршрутам = быстрые переходы | Medium |

**Рекомендуемый порядок для v0.2:**
1. Streaming SSR (убирает главный bottleneck)
2. Client-side `<Link>` (убирает главный UX-недостаток)
3. Error overlay (DX)

Остальное — v0.3+.
