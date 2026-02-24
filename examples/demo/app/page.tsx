import * as React from "react";

export const meta = {
    title: "Home - Next Gen Framework"
};

export default function HomePage() {
    return (
        <div style={{ maxWidth: '600px' }}>
            <h1>Welcome to FlowJS Mini-Blog</h1>
            <p>This page is dynamically Server-Side Rendered (SSR).</p>
            <div style={{ padding: '1rem', background: '#ffebee', borderRadius: '4px', marginTop: '1rem' }}>
                <strong>Middleware Test:</strong> Try visiting <a href="/old">/old</a> to see the edge redirect in action!
            </div>
        </div>
    );
}
