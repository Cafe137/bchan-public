import { serve } from '@hono/node-server'
import { Hono } from 'hono'

const app = new Hono()

app.get('/health', c => c.json({ status: 'ok' }))

export function runHealthServer() {
    const port = process.env.HEALTH_PORT ? parseInt(process.env.HEALTH_PORT) : 3000
    serve({ fetch: app.fetch, hostname: '127.0.0.1', port })
}
