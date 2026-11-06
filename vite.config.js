import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// Runs the serverless functions in /api during `npm run dev`, so Roqqu features work locally
// exactly as they do on Vercel (no separate `vercel dev` needed).
function apiDevPlugin() {
  return {
    name: 'api-dev-bridge',
    configureServer(server) {
      // Make .env values (including server-only ones such as ROQQU_PRIVATE_KEY) visible to the handlers.
      Object.assign(process.env, loadEnv('development', process.cwd(), ''))

      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()
        const [pathname, query = ''] = req.url.split('?')
        const name = pathname.replace(/^\/api\//, '').replace(/\/$/, '')
        if (!/^[a-zA-Z0-9_-]+$/.test(name)) return next()

        try {
          const mod = await server.ssrLoadModule(`/api/${name}.js`)
          let raw = ''
          for await (const chunk of req) raw += chunk
          let body = {}
          try { body = raw ? JSON.parse(raw) : {} } catch { /* leave empty */ }

          const shim = {
            status(code) { res.statusCode = code; return shim },
            json(obj) { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(obj)) },
            end(...a) { res.end(...a) },
            setHeader(k, v) { res.setHeader(k, v) },
          }
          await mod.default(
            { method: req.method, headers: req.headers, body, query: Object.fromEntries(new URLSearchParams(query)) },
            shim,
          )
        } catch (e) {
          server.ssrFixStacktrace?.(e)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok: false, error: e.message }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), apiDevPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
