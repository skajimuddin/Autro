import { Hono } from 'hono'
import type { Env, Variables } from '@/env'
import { corsMiddleware } from '@/middleware/cors'
import { authMiddleware } from '@/middleware/auth'
import { tenantMiddleware } from '@/middleware/tenant'
import authRoutes from '@/routes/auth'
import tenantsRouter from '@/routes/tenants'

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

// ── Global middleware ─────────────────────────────────────────────────────────
app.use('*', corsMiddleware)

// ── Health check (public) ─────────────────────────────────────────────────────
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── Auth routes (public — no JWT required) ────────────────────────────────────
app.route('/auth', authRoutes)

// ── Tenant routes ─────────────────────────────────────────────────────────────
// POST /tenants and GET /tenants/mine only need JWT (no X-Tenant-ID yet)
app.use('/tenants/*', authMiddleware)
// PATCH /tenants/:id additionally needs tenant membership verification
app.use('/tenants/:id', tenantMiddleware)
app.route('/tenants', tenantsRouter)

// ── Future protected routes (to be registered as features are built) ──────────
// Pattern:
//   app.use('/resource/*', authMiddleware)
//   app.use('/resource/*', tenantMiddleware)
//   app.route('/resource', resourceRouter)

export default app
