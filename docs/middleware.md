# Middleware

FlowJS features a singular global intercept system defined at the root of your application. Middleware gives you precise control over incoming server requests before they reach your `app/` routing logic.

## Location
The middleware configuration *must* be localized precisely as `src/middleware.ts` or `middleware.ts` in your root workspace. FlowJS Vite compilation hooks automatically bundle this script to sit in front of the HTTP listener pipeline.

## Execution Order
**Middleware runs BEFORE routing.**
Requests follow this lifecycle string:
1. Client HTTP request hits the Node Process.
2. `applyMiddleware` evaluates your intercept hooks.
3. If middleware returns early (e.g. Redirect, Status Block), the pipeline halts and responds immediately.
4. If middleware alters paths (e.g. Rewrite), URL bindings are shifted transparently.
5. FlowJS routes matching kicks in (Page/API discovery).

## Middleware Contract
Your `middleware.ts` file exports a function named `middleware`. 

It has the signature:
`(req) => MiddlewareResult | void | Promise<MiddlewareResult | void>`

### Rewrite Example
Rewrites modify the internally matched URL path, serving alternative content without changing the string visible in the user's browser URL bar.

```ts
import type { MiddlewareFunction } from "flowjs";

export const middleware: MiddlewareFunction = (req) => {
    const url = new URL(req.url || "/", `http://${req.headers?.host}`);

    if (url.pathname === "/old-dashboard") {
        return { rewrite: "/new-dashboard" }; // The user's bar still shows /old-dashboard
    }
};
```

### Auth Redirect Example
Redirects forcefully instruct the client to jump to a completely new URL, shifting browser histories natively.

```ts
import type { MiddlewareFunction } from "flowjs";

export const middleware: MiddlewareFunction = (req) => {
    const url = new URL(req.url || "/", `http://${req.headers?.host}`);

    if (url.pathname.startsWith("/admin")) {
        // Evaluate auth cookies natively here
        const isAuth = req.headers.cookie?.includes("auth=valid");
        
        if (!isAuth) {
            return { redirect: "/login", status: 302 }; 
        }
    }
};
```

### Header Injection Example
You can transparently modify internal routing properties. To pass execution passively, simply export specific `headers`:

```ts
import type { MiddlewareFunction } from "flowjs";

export const middleware: MiddlewareFunction = (req) => {
    return {
        headers: {
            "X-Middleware-Active": "true",
            "Cache-Control": "no-store"
        }
    };
};
```
