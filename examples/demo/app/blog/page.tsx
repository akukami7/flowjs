import * as React from "react";

export const meta = {
    title: "Blog Index"
};

export default function BlogIndex() {
    return (
        <div>
            <h1>Our Blog</h1>
            <ul style={{ lineHeight: '1.8' }}>
                <li><a href="/blog/hello-world">Hello World (SSG Rendered)</a></li>
                <li><a href="/blog/learn-ssr">Learn SSR (SSG Rendered)</a></li>
            </ul>
        </div>
    );
}
