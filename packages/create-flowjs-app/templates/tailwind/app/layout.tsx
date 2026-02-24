import * as React from "react";
import "./globals.css";

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <head>
                <meta charSet="UTF-8" />
                <title>FlowJS Tailwind App</title>
            </head>
            <body>
                <nav className="p-4 border-b">
                    <a href="/" className="text-blue-500 hover:text-blue-700 mr-4">Home</a>
                    <a href="/about" className="text-blue-500 hover:text-blue-700 mr-4">About</a>
                    <a href="/blog/hello-world" className="text-blue-500 hover:text-blue-700">Blog</a>
                </nav>
                <main className="container mx-auto p-4">{children}</main>
            </body>
        </html>
    );
}
