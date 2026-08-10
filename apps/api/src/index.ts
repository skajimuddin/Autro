import { Hono } from 'hono'
import { cors } from 'hono/cors'
import type { Env, Variables } from '@/env'

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

// ── Global middleware ─────────────────────────────────────────────────────────
app.use('*', cors({ origin: '*' }))

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── Routes (to be registered as features are built) ───────────────────────────
// import authRoutes from '@/routes/auth';
// app.route('/auth', authRoutes);

export default app
