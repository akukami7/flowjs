// @ts-nocheck
import { parseArgs } from "node:util";

const args = process.argv.slice(2);

const options = {
    port: {
        type: "string" as const,
        short: "p",
        default: "3000",
    },
};

const COMMANDS = {
    async dev() {
        console.log("▶️  flowjs dev — starting development server...");
        // @ts-ignore
        const { createDevServer } = await import("@flowjs/server");
        await createDevServer({ root: process.cwd(), port: 3000 });
    },

    async build() {
        console.log("▶️  flowjs build — compiling for production...");
        // @ts-ignore
        const { build } = await import("@flowjs/build");
        await build({ root: process.cwd() });
    },

    async start() {
        console.log("▶️  flowjs start — booting production environment...");
        // @ts-ignore
        const { createProdServer } = await import("@flowjs/server");
        await createProdServer({ root: process.cwd(), port: 3000 });
    },

    async export() {
        console.log("▶️  flowjs export — initializing builder module...");
        // @ts-ignore
        const { exportApp } = await import("@flowjs/build");
        await exportApp({ root: process.cwd() });
    },
};

async function main() {
    const { positionals } = parseArgs({ args, options, allowPositionals: true });
    const command = positionals[0] as keyof typeof COMMANDS;

    if (!command || !COMMANDS[command]) {
        console.error(`Unknown command: ${command || "none"}`);
        console.log("Available commands: dev, build, start, export");
        process.exit(1);
    }

    try {
        await COMMANDS[command]();
    } catch (err) {
        console.error("❌ Command failed:", err);
        process.exit(1);
    }
}

main();
