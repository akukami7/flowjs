#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";
import prompts from "prompts";
import kleur from "kleur";
import mri from "mri";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function main() {
    const args = mri(process.argv.slice(2), {
        alias: { pm: "pm", ts: "ts", template: "t" },
        default: { ts: true }
    });

    let targetDir = args._[0];

    const response = await prompts([
        {
            type: targetDir ? null : "text",
            name: "projectName",
            message: "Project name:",
            initial: "my-flowjs-app",
            onState: (state) => {
                targetDir = state.value.trim() || "my-flowjs-app";
            }
        },
        {
            type: args.pm ? null : "select",
            name: "packageManager",
            message: "Select package manager:",
            choices: [
                { title: "pnpm", value: "pnpm" },
                { title: "npm", value: "npm" },
                { title: "yarn", value: "yarn" }
            ],
            initial: 0
        },
        {
            type: args.template ? null : "select",
            name: "template",
            message: "Select a framework template:",
            choices: [
                { title: "Basic (React + Vanilla CSS)", value: "basic" },
                { title: "Tailwind (React + Tailwind CSS)", value: "tailwind" },
                { title: "Blog (MDX + SSG Configured)", value: "blog" }
            ],
            initial: 0
        }
    ]);

    const pm = args.pm || response.packageManager || "pnpm";
    const selectedTemplate = args.template || response.template || "basic";
    const useTs = args.ts !== false;

    if (!targetDir) {
        console.log(kleur.red("❌ Initialization aborted."));
        process.exit(1);
    }

    const root = path.resolve(process.cwd(), targetDir);
    const templateDir = path.resolve(__dirname, "templates", selectedTemplate);

    console.log(`\n🚀 Creating FlowJS app in ${kleur.green(root)} using template: ${kleur.cyan(selectedTemplate)}...`);

    if (!fs.existsSync(root)) {
        fs.mkdirSync(root, { recursive: true });
    } else {
        console.log(kleur.yellow(`⚠️  Directory ${targetDir} already exists. Continuing...`));
    }

    // Recursive copy function
    function copyDir(src, dest) {
        const entries = fs.readdirSync(src, { withFileTypes: true });
        for (const entry of entries) {
            const srcPath = path.join(src, entry.name);
            const destPath = path.join(dest, entry.name);
            if (entry.isDirectory()) {
                fs.mkdirSync(destPath, { recursive: true });
                copyDir(srcPath, destPath);
            } else {
                fs.copyFileSync(srcPath, destPath);
            }
        }
    }

    copyDir(templateDir, root);

    // Update package.json
    const pkgPath = path.join(root, "package.json");
    if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));
        pkg.name = path.basename(root);
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2));
    }

    console.log(kleur.blue(`\n📦 Installing dependencies using ${pm}...`));
    try {
        execSync(`${pm} install`, {
            cwd: root,
            stdio: "inherit"
        });
        console.log(kleur.green("\n✅ Installation complete!"));
    } catch (e) {
        console.log(kleur.red(`\n❌ Failed to install dependencies.`));
    }

    console.log("\nNext steps:");
    console.log(kleur.cyan(`  cd ${targetDir}`));
    console.log(kleur.cyan(`  ${pm} run dev`));
    console.log("\nEnjoy building with FlowJS!\n");
}

main().catch(e => {
    console.error(e);
    process.exit(1);
});
