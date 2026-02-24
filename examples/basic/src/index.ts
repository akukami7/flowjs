/**
 * FlowJS — basic example application.
 */

import { createRouter, createServer, VERSION } from "flowjs";

console.log(`FlowJS v${VERSION}`);

const router = createRouter({
    routes: [
        { path: "/", component: "pages/index" },
        { path: "/about", component: "pages/about" },
    ],
});

console.log("Router created with routes:", router.options.routes);
console.log("Match '/':", router.match("/"));

const server = createServer({ port: 3000 });

server.listen().then(() => {
    console.log("Server is running! Press Ctrl+C to stop.");
});
