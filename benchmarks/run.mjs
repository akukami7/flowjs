import { execSync, spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { performance } from "node:perf_hooks";
import chalk from "chalk";
import WaitOn from "wait-on";
import autocannon from "autocannon";

const TARGETS = [
    { name: "FlowJS", dir: "targets/flowjs-app", buildCmd: "pnpm build", startCmd: "pnpm start", outDir: "dist" },
    { name: "Next.js", dir: "targets/next-app", buildCmd: "pnpm build", startCmd: "pnpm start", outDir: ".next" },
    { name: "Vite SSR", dir: "targets/vite-ssr", buildCmd: "pnpm build", startCmd: "node server.js", outDir: "dist" },
];

function getFolderSize(folderPath) {
    let size = 0;
    if (!fs.existsSync(folderPath)) return 0;
    const files = fs.readdirSync(folderPath);
    for (const file of files) {
        const filePath = path.join(folderPath, file);
        const stats = fs.statSync(filePath);
        if (stats.isDirectory()) size += getFolderSize(filePath);
        else size += stats.size;
    }
    return size;
}

const formatSize = (bytes) => `${(bytes / 1024 / 1024).toFixed(2)} MB`;

async function killPort(port) {
    try {
        execSync(`npx -y kill-port ${port}`, { stdio: "ignore", timeout: 5000 });
    } catch (e) { /* ignore */ }
    await new Promise(r => setTimeout(r, 500));
}

async function runBenchmark(target) {
    console.log(`\n${chalk.cyan.bold("=====================================")}`);
    console.log(`${chalk.green.bold("Starting Benchmark:")} ${target.name}`);
    console.log(`${chalk.cyan.bold("=====================================")}`);

    const targetPath = path.resolve(target.dir);
    if (!fs.existsSync(targetPath)) {
        console.log(chalk.red(`⚠️ Skipping: Folder ${target.dir} not found.`));
        return null;
    }

    try {
        // 1. Install Deps (Skipped - handled by Workspace root)
        console.log(chalk.gray(`\nDependencies resolved via Workspace...`));

        // 2. Measure Build Time
        console.log(chalk.gray(`Building project...`));
        const buildStart = performance.now();
        execSync(target.buildCmd, { cwd: targetPath, stdio: "pipe" });
        const buildTime = performance.now() - buildStart;
        console.log(`✅ Build Time: ${chalk.yellow((buildTime / 1000).toFixed(2))}s`);

        // 3. Measure Bundle Size
        const outDirPath = path.join(targetPath, target.outDir);
        const folderSize = getFolderSize(outDirPath);
        console.log(`📦 Output Size: ${chalk.yellow(formatSize(folderSize))} (${target.outDir}/)`);

        // 4. Kill any leftover process on port 3000
        await killPort(3000);

        // 5. Measure Cold Start
        console.log(chalk.gray(`Booting Production Server...`));
        const server = spawn(target.startCmd, {
            cwd: targetPath,
            env: { ...process.env, PORT: "3000", NODE_ENV: "production" },
            shell: true,
            stdio: ["ignore", "pipe", "pipe"],
        });

        // Log server errors for debugging
        let serverStderr = "";
        server.stderr.on("data", (d) => { serverStderr += d.toString(); });

        const coldStartStart = performance.now();
        await WaitOn({ resources: ["tcp:3000"], timeout: 20000 });
        const coldStartTime = performance.now() - coldStartStart;
        console.log(`🔥 Cold Start Latency: ${chalk.yellow(coldStartTime.toFixed(0))}ms`);

        // 6. Measure Autocannon Load (programmatic API)
        console.log(chalk.gray(`\nRunning Autocannon (10s | 100 connections)...`));
        const result = await autocannon({
            url: "http://localhost:3000",
            connections: 100,
            duration: 10,
        });

        const p50 = result.latency.p50 + " ms";
        const p95 = (result.latency.p97_5 || result.latency.p99 || result.latency.p90 || "N/A") + " ms";
        const reqSec = result.requests.average.toFixed(0);

        console.log(`🚀 Req/Sec: ${chalk.yellow(reqSec)}`);
        console.log(`⏱️  p50 Latency: ${chalk.yellow(p50)}`);
        console.log(`⏱️  p95 Latency: ${chalk.yellow(p95)}`);

        if (serverStderr.trim()) {
            console.log(chalk.gray(`Server stderr: ${serverStderr.trim().slice(0, 200)}`));
        }

        // Cleanup
        server.kill("SIGINT");
        await killPort(3000);

        return {
            name: target.name,
            buildTime: (buildTime / 1000).toFixed(2) + "s",
            size: formatSize(folderSize),
            coldStart: coldStartTime.toFixed(0) + "ms",
            p50,
            p95,
            reqSec,
        };

    } catch (e) {
        console.error(chalk.red(`❌ Benchmark failed for ${target.name}:`));
        console.error(e.message);
        if (e.stdout) console.error("STDOUT:", e.stdout.toString().slice(0, 500));
        if (e.stderr) console.error("STDERR:", e.stderr.toString().slice(0, 500));
        // Ensure port is free for the next target
        await killPort(3000);
        return null;
    }
}

async function main() {
    const results = [];
    for (const target of TARGETS) {
        const res = await runBenchmark(target);
        if (res) results.push(res);
    }

    if (results.length > 0) {
        console.log(`\n\n${chalk.magenta.bold("=============================================")}`);
        console.log(`${chalk.magenta.bold("              FINAL RESULTS                   ")}`);
        console.log(`${chalk.magenta.bold("=============================================")}\n`);

        console.table(results.reduce((acc, curr) => {
            acc[curr.name] = {
                "Build Time": curr.buildTime,
                "Output Size": curr.size,
                "Cold Start": curr.coldStart,
                "Req/Sec": curr.reqSec,
                "p50 Latency": curr.p50,
                "p95 Latency": curr.p95
            };
            return acc;
        }, {}));

        console.log(`\nCopy the table above into your markdown report!`);
    } else {
        console.log(chalk.red("\n❌ No targets were evaluated. Make sure folders exist in targets/"));
    }
}

main();
