import { defineApi } from "flowjs";

export default defineApi({
    GET({ url }) {
        return {
            message: "Hello from FlowJS API Route!",
            path: url.pathname,
            timestamp: new Date().toISOString()
        };
    }
});
