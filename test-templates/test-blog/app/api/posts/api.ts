const posts = [
    { slug: "hello-world", title: "Hello World", content: "Welcome to FlowJS" },
    { slug: "learn-ssr", title: "Learn SSR", content: "Server-side rendering is fast" }
];

export async function GET(req: Request) {
    return new Response(JSON.stringify(posts), {
        headers: { "Content-Type": "application/json" }
    });
}
