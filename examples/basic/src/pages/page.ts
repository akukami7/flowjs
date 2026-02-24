/**
 * Example: page.ts — Home page
 * File convention: app/routes/page.ts
 */
import type { FlowContext, PageModule } from "flowjs";
import { definePage } from "flowjs";

// Typed route params (this page has none, so empty)
type Params = Record<string, never>;

// Loader data shape
interface HomeData {
    greeting: string;
    timestamp: number;
}

export default definePage<Params, HomeData>({
    async loader(ctx: FlowContext<Params>) {
        const name = ctx.query["name"] ?? "World";

        return {
            greeting: `Hello, ${Array.isArray(name) ? name[0] : name}!`,
            timestamp: Date.now(),
        };
    },

    meta() {
        return {
            title: "Home — FlowJS App",
            description: "Welcome to a FlowJS application",
            og: { "og:title": "FlowJS App" },
        };
    },

    config: {
        revalidate: 60, // ISR — revalidate every 60s
    },
});

