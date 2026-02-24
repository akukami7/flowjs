/**
 * FlowJS — Structured DX Error Classes
 *
 * Every FlowJS error carries:
 *  - `code`    — a unique, grep-able identifier (e.g. "ROUTE_CONFLICT")
 *  - `hint`    — a human-readable suggestion on how to fix the issue
 *  - `docsUrl` — an optional link to the relevant docs section
 */

// ─── Base ───────────────────────────────────────────────────────────────────

export class FlowError extends Error {
    readonly code: string;
    readonly hint: string;
    readonly docsUrl?: string;

    constructor(
        code: string,
        message: string,
        hint: string,
        docsUrl?: string,
    ) {
        super(`[FlowJS ${code}] ${message}`);
        this.name = "FlowError";
        this.code = code;
        this.hint = hint;
        this.docsUrl = docsUrl;
    }

    /** Pretty-print for terminal output */
    format(): string {
        const lines = [
            `\n❌ FlowJS Error: ${this.code}`,
            `   ${this.message}`,
            ``,
            `   💡 Hint: ${this.hint}`,
        ];
        if (this.docsUrl) {
            lines.push(`   📖 Docs: ${this.docsUrl}`);
        }
        lines.push("");
        return lines.join("\n");
    }
}

// ─── Router Errors ──────────────────────────────────────────────────────────

export class RouterError extends FlowError {
    constructor(code: string, message: string, hint: string, docsUrl?: string) {
        super(code, message, hint, docsUrl);
        this.name = "RouterError";
    }
}

/** Predefined router error factories */
export const RouterErrors = {
    routeConflict(routeId: string, fileA: string, fileB: string) {
        return new RouterError(
            "ROUTE_CONFLICT",
            `Multiple pages resolve to the same route "${routeId}":\n      → ${fileA}\n      → ${fileB}`,
            `Remove or rename one of the conflicting page files. Only one page.tsx can exist per route path.`,
            "https://flowjs.dev/docs/routing#conflicts",
        );
    },
    noRoutes(appDir: string) {
        return new RouterError(
            "NO_ROUTES",
            `No page files found in "${appDir}".`,
            `Create at least one page file: app/page.tsx`,
            "https://flowjs.dev/docs/routing",
        );
    },
};

// ─── Build Errors ───────────────────────────────────────────────────────────

export class BuildError extends FlowError {
    constructor(code: string, message: string, hint: string, docsUrl?: string) {
        super(code, message, hint, docsUrl);
        this.name = "BuildError";
    }
}

/** Predefined build error factories */
export const BuildErrors = {
    missingRootLayout(appDir: string) {
        return new BuildError(
            "MISSING_ROOT_LAYOUT",
            `No root layout found at "${appDir}/layout.tsx" (or .ts, .jsx, .js).`,
            `Create app/layout.tsx exporting a default component that wraps {children}.\n\n   Example:\n     export default function RootLayout({ children }: { children: React.ReactNode }) {\n       return <html><body>{children}</body></html>;\n     }`,
            "https://flowjs.dev/docs/routing#layouts",
        );
    },
    missingAppDir(root: string) {
        return new BuildError(
            "MISSING_APP_DIR",
            `The "app/" directory does not exist at "${root}/app".`,
            `Create an app/ directory in your project root with at least one page.tsx.`,
            "https://flowjs.dev/docs/routing",
        );
    },
    viteBuildFailed(phase: "client" | "server", detail: string) {
        return new BuildError(
            "VITE_BUILD_FAILED",
            `Vite ${phase} build failed: ${detail}`,
            `Check the error above for syntax or import issues. Run "pnpm build" with --debug for verbose output.`,
        );
    },
};

// ─── SSR / Render Errors ────────────────────────────────────────────────────

export class SSRRenderError extends FlowError {
    constructor(code: string, message: string, hint: string, docsUrl?: string) {
        super(code, message, hint, docsUrl);
        this.name = "SSRRenderError";
    }
}

/** Predefined SSR error factories */
export const SSRErrors = {
    invalidPageExport(filePath: string, receivedType: string) {
        return new SSRRenderError(
            "INVALID_PAGE_EXPORT",
            `Page "${filePath}" does not export a valid React component.\n      Received: ${receivedType}`,
            `Ensure your page.tsx has a default export that is a React function component:\n\n   export default function Page() { return <div>Hello</div>; }`,
            "https://flowjs.dev/docs/routing#pages",
        );
    },
    loaderThrow(routeId: string, originalError: Error) {
        return new SSRRenderError(
            "LOADER_THROW",
            `Loader for route "${routeId}" threw an error:\n      ${originalError.message}`,
            `Check your loader function for unhandled exceptions. Wrap async calls in try/catch.\n      Original stack: ${originalError.stack?.split("\n").slice(0, 3).join("\n      ")}`,
            "https://flowjs.dev/docs/data-loading",
        );
    },
    renderCrash(routeId: string, originalError: Error) {
        return new SSRRenderError(
            "SSR_RENDER_CRASH",
            `SSR rendering failed for route "${routeId}":\n      ${originalError.message}`,
            `Common causes:\n      • Using browser-only APIs (window, document) during SSR\n      • Hydration mismatch — server and client render different content\n      • Missing or incorrect component props\n\n      Wrap browser APIs in useEffect() or check typeof window !== "undefined".`,
            "https://flowjs.dev/docs/troubleshooting#hydration",
        );
    },
    hydrationMismatch(routeId: string) {
        return new SSRRenderError(
            "HYDRATION_MISMATCH",
            `Hydration mismatch detected for route "${routeId}".`,
            `The server-rendered HTML doesn't match what React expects on the client.\n\n      Common causes:\n      1. Using Date.now(), Math.random() during render\n      2. Browser extensions injecting extra DOM nodes\n      3. Conditional rendering based on typeof window\n\n      Fix: Move dynamic values into useEffect() or useState().`,
            "https://flowjs.dev/docs/troubleshooting#hydration",
        );
    },
};
