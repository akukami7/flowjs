/**
 * FlowJS V1 — Core Type Contracts
 *
 * Defines the file conventions for a FlowJS application:
 * - Page       — renders a route (page.ts / page.tsx)
 * - Layout     — wraps child pages (layout.ts / layout.tsx)
 * - API Route  — server-side HTTP handler (api.ts)
 * - Middleware  — request interceptor (middleware.ts)
 */

// ─── Utility types ──────────────────────────────────────────────────────────

/** HTTP methods supported by FlowJS API routes. */
export type HttpMethod =
    | "GET"
    | "POST"
    | "PUT"
    | "PATCH"
    | "DELETE"
    | "HEAD"
    | "OPTIONS";

/** Parsed cookie jar (read-only). */
export type CookieJar = Readonly<Record<string, string>>;

/** Parsed query-string parameters. */
export type QueryParams = Readonly<Record<string, string | string[]>>;

/** Dynamic route params, e.g. `/users/[id]` → `{ id: "42" }` */
export type RouteParams = Readonly<Record<string, string>>;

/** Arbitrary environment variables / runtime config. */
export type EnvRecord = Readonly<Record<string, string | undefined>>;

// ─── FlowContext ────────────────────────────────────────────────────────────

/**
 * The universal request context passed to every page, layout, api, and
 * middleware handler. Immutable snapshot of the current request.
 *
 * @typeParam P — Route params shape (defaults to `RouteParams`)
 */
export interface FlowContext<P extends RouteParams = RouteParams> {
    /** The raw incoming `Request` object (Web Fetch API). */
    readonly request: Request;

    /** Parsed `URL` instance for the current request. */
    readonly url: URL;

    /** Dynamic route parameters extracted from the path pattern. */
    readonly params: P;

    /** Parsed query-string parameters (`?foo=bar&arr=1&arr=2`). */
    readonly query: QueryParams;

    /** Incoming request headers (read-only `Headers`). */
    readonly headers: Headers;

    /** Parsed cookie key-value pairs. */
    readonly cookies: CookieJar;

    /** Runtime environment / config values. */
    readonly env: EnvRecord;
}

// ─── Response helpers ───────────────────────────────────────────────────────

/**
 * Base constraint for loader return types.
 * Use concrete interfaces when defining your data shape.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type LoaderData = object;

/**
 * Base constraint for action return types.
 * Use concrete interfaces when defining your mutation response shape.
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type ActionData = object;

/**
 * A response object returned from API routes and middleware.
 * Can be a Web `Response` or a plain object (auto-serialised as JSON).
 */
export type FlowResponse = Response | Record<string, unknown>;

// ─── Page ───────────────────────────────────────────────────────────────────

/**
 * `page.ts` / `page.tsx` contract.
 *
 * A page module can export:
 * - `loader`   — runs on every GET to fetch data
 * - `action`   — runs on POST/PUT/PATCH/DELETE mutations
 * - `meta`     — returns `<head>` metadata (title, description, og-tags…)
 * - `default`  — the page component (framework-agnostic render function)
 * - `config`   — static page-level configuration
 */
export interface PageModule<
    P extends RouteParams = RouteParams,
    L extends LoaderData = LoaderData,
    A extends ActionData = ActionData,
> {
    /** Fetch data for this page (runs server-side on GET). */
    loader?(ctx: FlowContext<P>): L | Promise<L>;

    /** Handle mutations (runs server-side on POST / PUT / PATCH / DELETE). */
    action?(ctx: FlowContext<P>): A | Promise<A>;

    /** Return `<head>` metadata for this page. */
    meta?(ctx: FlowContext<P>): PageMeta | Promise<PageMeta>;

    /** The page render function / component. */
    default?(props: PageProps<L, A>): unknown;

    /** Static config for this page. */
    config?: PageConfig;

    /** Generate static params for dynamic paths during SSG export. */
    generateStaticParams?(): ReadonlyArray<P> | Promise<ReadonlyArray<P>>;
}

/** SEO / `<head>` metadata for a page. */
export interface PageMeta {
    title?: string;
    description?: string;
    keywords?: string[];
    og?: Record<string, string>;
    [key: string]: unknown;
}

/** Props passed to the default page component. */
export interface PageProps<
    L extends LoaderData = LoaderData,
    A extends ActionData = ActionData,
> {
    data: L;
    actionData?: A;
    params: RouteParams;
    url: URL;
}

/** Static page-level configuration. */
export interface PageConfig {
    /** Override the HTTP methods this page handles. Default: ["GET"]. */
    methods?: HttpMethod[];
    /** Runtime: "edge" | "node". Default: "node". */
    runtime?: "edge" | "node";
    /** Revalidation interval in seconds (ISR). 0 = no cache. */
    revalidate?: number;
    /** SSG Export behavior */
    dynamic?: "auto" | "force-dynamic" | "error" | "force-static";
}

// ─── Layout ─────────────────────────────────────────────────────────────────

/**
 * `layout.ts` / `layout.tsx` contract.
 *
 * Wraps all child pages in the same directory subtree.
 * Can export a `loader` for shared data and a `default` wrapper component.
 */
export interface LayoutModule<
    P extends RouteParams = RouteParams,
    L extends LoaderData = LoaderData,
> {
    /** Fetch shared data available to this layout and all children. */
    loader?(ctx: FlowContext<P>): L | Promise<L>;

    /** The layout component / render function. */
    default?(props: LayoutProps<L>): unknown;
}

/** Props passed to the default layout component. */
export interface LayoutProps<L extends LoaderData = LoaderData> {
    /** Data returned by the layout `loader`. */
    data: L;
    /** Render-slot for the child page / nested layout. */
    children: unknown;
}

// ─── API Route ──────────────────────────────────────────────────────────────

/**
 * `api.ts` contract — pure server-side HTTP handler.
 *
 * Export named functions matching HTTP methods:
 * `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`.
 */
export interface ApiModule<P extends RouteParams = RouteParams> {
    GET?(ctx: FlowContext<P>): FlowResponse | Promise<FlowResponse>;
    POST?(ctx: FlowContext<P>): FlowResponse | Promise<FlowResponse>;
    PUT?(ctx: FlowContext<P>): FlowResponse | Promise<FlowResponse>;
    PATCH?(ctx: FlowContext<P>): FlowResponse | Promise<FlowResponse>;
    DELETE?(ctx: FlowContext<P>): FlowResponse | Promise<FlowResponse>;
    HEAD?(ctx: FlowContext<P>): FlowResponse | Promise<FlowResponse>;
    OPTIONS?(ctx: FlowContext<P>): FlowResponse | Promise<FlowResponse>;

    /** Optional static config for this API route. */
    config?: ApiConfig;
}

/** Static API route configuration. */
export interface ApiConfig {
    runtime?: "edge" | "node";
    /** Maximum request body size in bytes. Default: 1MB. */
    maxBodySize?: number;
}

// ─── Middleware ──────────────────────────────────────────────────────────────

/**
 * `middleware.ts` contract — request interceptor.
 *
 * Runs before layout/page loaders, API handlers, and SSR matching.
 * Returns instructions on how the edge router should handle the request.
 */
import type { IncomingMessage } from "node:http";

export interface MiddlewareResult {
    rewrite?: string;
    redirect?: string;
    status?: number;
    headers?: Record<string, string>;
}

export type MiddlewareFunction = (
    req: IncomingMessage
) => MiddlewareResult | void | Promise<MiddlewareResult | void>;

// ─── Helper: defineXxx() wrappers (DX sugar) ────────────────────────────────

/**
 * Identity helper — provides type-checking and autocomplete for page modules.
 *
 * @example
 * ```ts
 * export default definePage({
 *   loader(ctx) { return { user: "Alice" }; },
 *   meta()     { return { title: "Home" }; },
 * });
 * ```
 */
export function definePage<
    P extends RouteParams = RouteParams,
    L extends LoaderData = LoaderData,
    A extends ActionData = ActionData,
>(page: PageModule<P, L, A>): PageModule<P, L, A> {
    return page;
}

/** Identity helper for layout modules. */
export function defineLayout<
    P extends RouteParams = RouteParams,
    L extends LoaderData = LoaderData,
>(layout: LayoutModule<P, L>): LayoutModule<P, L> {
    return layout;
}

/** Identity helper for API route modules. */
export function defineApi<P extends RouteParams = RouteParams>(
    api: ApiModule<P>,
): ApiModule<P> {
    return api;
}


