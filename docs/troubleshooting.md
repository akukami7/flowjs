# Troubleshooting

This section details common hurdles encountered transitioning existing Node/React apps rapidly into the FlowJS Monolithic Pipeline and robust fixes to secure functionality. 

## EADDRINUSE: address already in use :::3000

**Symptom:** The CLI throws `Error: listen EADDRINUSE: address already in use :::3000` precisely when you execute `pnpm dev` or `pnpm start`.

**Cause:** Another application (often a dangling node process running lingering `dev` servers) already has control clamped onto port 3000.

**Fix:** Kill the hanging Node instance blocking TCP listeners internally.

On Windows PowerShell:
```bash
netstat -ano | findstr :3000
# Look at the PID in the far right column (e.g. 14212)
taskkill /F /PID 14212 
```
On macOS/Linux:
```bash
lsof -i tcp:3000
kill -9 <PID>
```

## Element type is invalid (React Crash)

**Symptom:** `Element type is invalid: expected a string or function but got: object`.

**Cause:** You exported a generic configuration object or a bare functional closure inside your `page.tsx` directly as `export default {}` rather than safely wrapping it via `definePage({...})`. FlowJS's SSR compiler pipeline expects a React component or a strictly compiled definition object wrapper.

**Fix:** Ensure your pages utilize the framework wrapper bounds:
```tsx
import { definePage } from "flowjs";

export default definePage({
    default() { return <div>My Page</div>; }
});
```

## Middleware Not Found

**Symptom:** Global requests fail to respect redirects. You notice your `middleware.ts` functions are silently ignored during execution. 

**Cause:** FlowJS strict resolver expects the intercept mapping to explicitly live at `src/middleware.ts` or locally at `/middleware.ts` inside the root tree path.

**Fix:** Double check spelling and assure `middleware.ts` exports standard JS syntax strings rather than an uncalled closure. Verify its placement via absolute `root` mapping contexts. 

## Build Failures

**Symptom:** `pnpm build` stops forcefully with TS exit code 1.

**Cause:** FlowJS leverages strict mode TypeScript pipelines ensuring your SSR routing paths match strictly against inferred component types. A mismatch in `loader()` return definitions versus component `data` hooks triggers AST blockers.

**Fix:** Assure you are casting `data` manually via FlowJS `page.tsx` inputs or validating that your APIs aren't silently crashing over mismatched payload architectures. Verify dependencies inside `package.json` resolve seamlessly across NPM workspaces.

## Dev vs Prod Mismatch

**Symptom:** Dynamic endpoints crash natively in `pnpm start` but pass effortlessly locally under `pnpm dev`.

**Cause:** Production environments bundle your server entry `server-entry.js` compactly stripping node modules and dead path resolutions out of memory scope contexts natively. 

**Fix:** Verify you are exporting proper `NODE_ENV=production` variables. Always test the specific HTTP requests against `pnpm build && pnpm start` staging buffers before committing to CDN outputs.

## Hydration Mismatch {#hydration}

**Symptom:** React throws `Warning: Text content did not match` or `Hydration failed because the initial UI does not match what was rendered on the server` in the browser console.

**Cause:** The HTML rendered on the server differs from what React generates on the client during hydration. This makes React unable to attach event listeners correctly.

### Common Causes & Fixes

**1. Using `Date.now()`, `Math.random()`, or `crypto.randomUUID()` in render**
```tsx
// ❌ BAD — different value on server vs client
export default function Page() {
    return <p>Time: {Date.now()}</p>;
}

// ✅ GOOD — defer to client with useState/useEffect
import { useState, useEffect } from "react";
export default function Page() {
    const [time, setTime] = useState<number | null>(null);
    useEffect(() => setTime(Date.now()), []);
    return <p>Time: {time ?? "Loading..."}</p>;
}
```

**2. Conditional rendering based on `typeof window`**
```tsx
// ❌ BAD — different output on server vs client
export default function Page() {
    if (typeof window !== "undefined") {
        return <ClientOnlyWidget />;
    }
    return <div>Loading...</div>;
}

// ✅ GOOD — use useEffect for client-only content
import { useState, useEffect } from "react";
export default function Page() {
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    return mounted ? <ClientOnlyWidget /> : <div>Loading...</div>;
}
```

**3. Browser extensions injecting DOM nodes**

Extensions like ad blockers, Grammarly, or password managers can inject extra elements into the DOM, causing React hydration to fail.

**Fix:** Test in an incognito window with extensions disabled.

**4. Using browser-only APIs (`window`, `document`, `localStorage`) in render**
```tsx
// ❌ BAD — crashes on server
export default function Page() {
    const width = window.innerWidth; // 💥 ReferenceError on server
    return <p>Width: {width}</p>;
}

// ✅ GOOD — guard with useEffect
import { useState, useEffect } from "react";
export default function Page() {
    const [width, setWidth] = useState(0);
    useEffect(() => setWidth(window.innerWidth), []);
    return <p>Width: {width}</p>;
}
```

### FlowJS Error Codes

When FlowJS detects SSR-related issues, it throws structured errors with codes like:

| Code | Meaning |
|------|---------|
| `INVALID_PAGE_EXPORT` | `page.tsx` doesn't export a React component |
| `SSR_RENDER_CRASH` | `renderToString` threw during server render |
| `LOADER_THROW` | The `loader()` function threw an unhandled error |
| `ROUTE_CONFLICT` | Two pages map to the same URL path |
| `MISSING_ROOT_LAYOUT` | No `app/layout.tsx` found (warning) |
| `MISSING_APP_DIR` | The `app/` directory doesn't exist |

Each error includes a **💡 Hint** with a fix and a **📖 Docs** link.
