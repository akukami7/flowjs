/**
 * FlowJS — modern full-stack JavaScript framework.
 *
 * This is the core public API surface.
 * Re-exports key utilities from sub-packages and framework types.
 */

// ── Sub-package re-exports ──────────────────────────────────────────────────
export { createRouter } from "@flowjs/router";

// ── Type contracts (V1) ─────────────────────────────────────────────────────
export type {
    HttpMethod,
    CookieJar,
    QueryParams,
    RouteParams,
    EnvRecord,
    FlowContext,
    LoaderData,
    ActionData,
    FlowResponse,
    PageModule,
    PageMeta,
    PageProps,
    PageConfig,
    LayoutModule,
    LayoutProps,
    ApiModule,
    ApiConfig,
    MiddlewareFunction,
    MiddlewareResult,
} from "./types.js";

// ── DX helpers ──────────────────────────────────────────────────────────────
export {
    definePage,
    defineLayout,
    defineApi,
} from "./types.js";

// ── Structured Errors ───────────────────────────────────────────────────────
export {
    FlowError,
    RouterError,
    RouterErrors,
    BuildError,
    BuildErrors,
    SSRRenderError,
    SSRErrors,
} from "./errors.js";

// ── Version ─────────────────────────────────────────────────────────────────
export const VERSION = "0.1.0";
