import type { MiddlewareFunction } from "flowjs";

export const middleware: MiddlewareFunction = (req) => {
    const url = new URL(req.url || "/", `http://${req.headers?.host || "localhost"}`);

    // Rewrite example: Serve `/about` content when user visits `/rewrite-me`
    if (url.pathname === "/rewrite-me") {
        return { rewrite: "/about", headers: { "X-Rewritten-By": "FlowJS" } };
    }

    // Redirect example: Send HTTP 307 redirect to blog post when user visits `/redirect-me`
    if (url.pathname === "/redirect-me") {
        return { redirect: "/blog/hello-world", status: 307 };
    }

    // Status Blocking example: Reject requests attempting to hit `/admin`
    if (url.pathname === "/admin") {
        return { status: 403, headers: { "X-Reason": "Access Denied" } };
    }

    // Pass-through execution and inject global headers
    return {
        headers: {
            "X-Flow-Middleware-Active": "true",
        },
    };
};
