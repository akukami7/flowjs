import * as React from "react";

const fakeDb = {
    "hello-world": "Welcome to FlowJS V1 Blog. This post was seamlessly statically generated during the build step.",
    "learn-ssr": "Server-side rendering is fast and great for SEO, but SSG yields the absolute maximum Edge caching limits!"
};

export const dynamic = "force-static";

export function meta({ params }: { params: { slug: string } }) {
    return {
        title: `Post: ${params.slug}`
    };
}

export default function BlogPost({ params }: { params: { slug: string } }) {
    const content = fakeDb[params.slug as keyof typeof fakeDb] || "Post not found";
    return (
        <div>
            <h1 style={{ textTransform: 'capitalize' }}>slug: {params.slug.replace("-", " ")}</h1>
            <article style={{ marginTop: "1rem", padding: "1.5rem", border: "1px solid #eaeaea", borderRadius: '8px', lineHeight: '1.6' }}>
                {content}
            </article>
        </div>
    );
}
