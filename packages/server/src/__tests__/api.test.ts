import { describe, it, expect } from "vitest";

describe("FlowJS API Edge Route Mappings", () => {
    it("dynamically triggers GET functions and correctly returns Response objects", async () => {
        // Mock defining an API route using defineApi style
        const apiModule = {
            GET: async ({ request, url }: any) => {
                return new Response(JSON.stringify({ method: "GET", path: url.pathname }), {
                    status: 200,
                    headers: {
                        "Content-Type": "application/json",
                        "X-Flow-Testing": "True"
                    }
                });
            }
        };

        const mockUrl = new URL("http://localhost:3000/api/users");
        // NextJS/Remix style Fetch Request Context mock
        const mockRequest = new Request(mockUrl.href, { method: "GET" });

        // Simulate FlowJS prodServer / devServer parsing
        const result = await apiModule.GET({ request: mockRequest, url: mockUrl });

        // Assert 
        expect(result).toBeInstanceOf(Response);
        expect(result.status).toBe(200);
        expect(result.headers.get("X-Flow-Testing")).toBe("True");

        const body = await result.json();
        expect(body.method).toBe("GET");
        expect(body.path).toBe("/api/users");
    });
});
