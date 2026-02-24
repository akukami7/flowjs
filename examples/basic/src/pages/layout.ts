/**
 * Example: layout.ts — Root layout
 * File convention: app/routes/layout.ts
 *
 * Wraps all child pages. Provides shared data (e.g. current user)
 * to every page in the subtree.
 */
import type { FlowContext, LayoutModule } from "flowjs";
import { defineLayout } from "flowjs";

interface SharedData {
    appName: string;
    year: number;
    user: { id: string; name: string } | null;
}

export default defineLayout<Record<string, never>, SharedData>({
    async loader(ctx: FlowContext) {
        // Read auth token from cookies
        const token = ctx.cookies["session_token"];

        return {
            appName: "FlowJS Demo",
            year: new Date().getFullYear(),
            user: token ? { id: "1", name: "Alice" } : null,
        };
    },
});

