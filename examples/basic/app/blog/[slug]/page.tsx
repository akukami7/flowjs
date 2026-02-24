import { definePage } from "flowjs";

export default definePage({
    config: { dynamic: "force-static" },
    generateStaticParams() {
        return [
            { slug: "hello-world" },
            { slug: "flowjs-v1" }
        ];
    },
    loader({ params }) {
        return { title: `Blog Post: ${params.slug}`, content: "Dynamically loaded content during SSG execution!" };
    },
    default({ data, params }) {
        return (
            <div>
                <h1>{data.title}</h1>
                <p>{data.content}</p>
                <p>Slug param: <code>{params.slug}</code></p>
            </div>
        );
    }
});
