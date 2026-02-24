import type { IncomingMessage } from "node:http";

export const middleware = (req: IncomingMessage) => {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    if (url.pathname === "/old") {
        return { redirect: "/", status: 301 };
    }
};
