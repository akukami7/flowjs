import fs from 'node:fs/promises'
import express from 'express'

const isTest = process.env.VITEST
process.env.MY_CUSTOM_SECRET = 'API_KEY_qwertyuiop'

export async function createServer(
    root = process.cwd(),
    isProd = process.env.NODE_ENV === 'production',
    hmrPort,
) {
    const resolve = (p) => new URL(p, import.meta.url).pathname
    const app = express()

    /**
     * @type {import('vite').ViteDevServer}
     */
    let vite
    if (!isProd) {
        vite = await (
            await import('vite')
        ).createServer({
            root,
            server: { middlewareMode: true },
            appType: 'custom',
        })
        app.use(vite.middlewares)
    } else {
        app.use((await import('compression')).default())
        app.use(
            (await import('express')).static(resolve('./dist/client'), { index: false })
        )
    }

    app.use('*', async (req, res) => {
        try {
            const url = req.originalUrl
            let template, render

            if (!isProd) {
                template = await fs.readFile(resolve('./index.html'), 'utf-8')
                template = await vite.transformIndexHtml(url, template)
                render = (await vite.ssrLoadModule('/src/entry-server.jsx')).render
            } else {
                template = await fs.readFile(resolve('./dist/client/index.html'), 'utf-8')
                render = (await import('./dist/server/entry-server.js')).render
            }

            const appHtml = render(url)
            const html = template.replace('<!--app-html-->', appHtml)
            res.status(200).set({ 'Content-Type': 'text/html' }).end(html)
        } catch (e) {
            vite?.ssrFixStacktrace(e)
            console.log(e.stack)
            res.status(500).end(e.stack)
        }
    })

    return { app, vite }
}

createServer().then(({ app }) =>
    app.listen(3000, () => {
        console.log('http://localhost:3000')
    }),
)
