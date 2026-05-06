import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { isConnectedToBee } from './server'

const app = new Hono()

app.get('/health', c => {
    if (!isConnectedToBee()) {
        return c.json({ status: 'error' }, 503)
    }
    return c.json({ status: 'ok' })
})

export function runHealthServer() {
    const port = process.env.HEALTH_PORT ? parseInt(process.env.HEALTH_PORT) : 3000
    serve({ fetch: app.fetch, hostname: '127.0.0.1', port })
}
