import * as React from "react";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <meta charSet="UTF-8" />
                <title>FlowJS Basic App</title>
            </head>
            <body>
                <nav>
                    <a href="/">Home</a> |
                    <a href="/about">About</a> |
                    <a href="/blog/hello-world">Blog</a>
                </nav>
                <main>{children}</main>
            </body>
            );
}
