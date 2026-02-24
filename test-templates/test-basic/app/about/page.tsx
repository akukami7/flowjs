import { definePage } from "flowjs";

export const config = { dynamic: "force-static" };

export default definePage({
    meta() {
        return { title: "About | FlowJS" };
    },
    default({ url }) {
        return (
            <div>
                <h1>About Us</h1>
                <p>This page is statically generated (SSG) using FlowJS.</p>
                <p>Rendered Path: <code>{url.pathname}</code></p>
            </div>
        );
    }
});
