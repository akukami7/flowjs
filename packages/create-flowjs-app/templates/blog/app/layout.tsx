import * as React from "react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <title>Demo Mini-Blog</title>
            </head>
            <body style={{ margin: "2rem", fontFamily: "sans-serif" }}>
                <nav style={{ marginBottom: "2rem", display: "flex", gap: "1rem" }}>
                    <a href="/">Home</a>
                    <a href="/blog">Blog</a>
                    <a href="/dashboard">Dashboard</a>
                </nav>
                <main>
                    {children}
                </main>
            </body>
        </html>
    );
}
