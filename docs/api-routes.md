# API Routes

FlowJS allows you to build a public GraphQL or RESTful API directly inside the `app/` directory alongside your React pages using `route.ts`. 

## `route.ts` Handlers
API routes are defined by creating a `route.ts` file inside an `api/` directory segment. This explicitly opts the router out of React SSR and processes the request as a backend endpoint.

```text
app/
├── [slug]/
│   └── page.tsx        # React Route
└── api/
    └── users/
        └── route.ts    # JSON API Node endpoint
```

## Supported HTTP Methods
FlowJS API Routes map generic Node HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`, etc.) as named exports. 

```ts
import { defineApi } from "flowjs";

export default defineApi({
    GET({ request, url }) {
        return { method: "GET", path: url.pathname }; // Automatically serialized as JSON
    },
    async POST({ request }) {
        const body = await request.json();
        return { status: "received", data: body };
    }
});
```

## Returning `Response` Objects
By default, returning a primitive JavaScript object or array automatically encodes the payload with `Content-Type: application/json` headers into a 200 HTTP response. 

If you need fine-grained control over status codes, headers, or streaming payloads, you can explicitly construct standard Edge/Node `Response` objects.

```ts
import { defineApi } from "flowjs";

export default defineApi({
    GET() {
        return new Response("Not Authorized", {
            status: 401,
            headers: {
                "X-Rate-Limit": "100"
            }
        });
    }
});
```

## Error Handling
Exceptions thrown unhandled from deep within `route.ts` handlers will be caught globally by the FlowJS Node instance. The server gracefully responds with `500 Internal Server Error`. 

It is highly recommended that you catch custom business logic exceptions manually and return graceful `Response` payload errors whenever interacting with databases.
