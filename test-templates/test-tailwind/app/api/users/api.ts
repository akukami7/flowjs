/**
 * Example: api.ts — Users API route
 * File convention: app/routes/api/users/api.ts
 *
 * Handles GET (list) and POST (create) for `/api/users`.
 */
import type { FlowContext, ApiModule } from "flowjs";
import { defineApi } from "flowjs";

// In-memory store for demo purposes
const users = [
    { id: "1", name: "Alice", email: "alice@example.com" },
    { id: "2", name: "Bob", email: "bob@example.com" },
];

export default defineApi({
    /** GET /api/users — list all users */
    GET(ctx: FlowContext) {
        const limit = ctx.query["limit"];
        const max = limit ? Number(Array.isArray(limit) ? limit[0] : limit) : 50;

        return {
            data: users.slice(0, max),
            total: users.length,
        };
    },

    /** POST /api/users — create a new user */
    async POST(ctx: FlowContext) {
        const body = (await ctx.request.json()) as {
            name?: string;
            email?: string;
        };

        if (!body.name || !body.email) {
            return new Response(
                JSON.stringify({ error: "name and email are required" }),
                { status: 400, headers: { "Content-Type": "application/json" } },
            );
        }

        const newUser = {
            id: String(users.length + 1),
            name: body.name,
            email: body.email,
        };

        users.push(newUser);

        return new Response(JSON.stringify(newUser), {
            status: 201,
            headers: { "Content-Type": "application/json" },
        });
    },

    config: {
        runtime: "node",
        maxBodySize: 1024 * 512, // 512 KB
    },
});

