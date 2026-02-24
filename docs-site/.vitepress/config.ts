import { defineConfig } from 'vitepress';
import { sidebar } from './sidebar';

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "FlowJS",
    description: "Modern, universal full-stack JavaScript framework.",

    // Instruct VitePress to consume markdown from the root docs/ folder
    srcDir: '../docs',

    // Set the base path for GitHub Pages deployment. 
    // Change '/flowjs/' to your GitHub repository name if different!
    base: '/flowjs/',

    cleanUrls: true,

    themeConfig: {
        logo: 'https://vitejs.dev/logo.svg',
        siteTitle: 'FlowJS',

        search: {
            provider: 'local'
        },

        nav: [
            { text: 'Home', link: '/' },
            { text: 'Docs', link: '/routing' },
            { text: 'GitHub', link: 'https://github.com/your-org/flowjs' }
        ],

        sidebar,

        socialLinks: [
            { icon: 'github', link: 'https://github.com/your-org/flowjs' }
        ],

        editLink: {
            pattern: 'https://github.com/your-org/flowjs/edit/main/docs/:path',
            text: 'Edit this page on GitHub'
        },

        footer: {
            message: 'Released under the MIT License.',
            copyright: 'Copyright © 2026-present FlowJS Contributors'
        }
    }
});
