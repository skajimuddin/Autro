import { Hono } from 'hono'
import type { Env, Variables } from '@/env'
import { validateEnv } from '@/env'
import { corsMiddleware } from '@/middleware/cors'
import { authMiddleware } from '@/middleware/auth'
import { tenantMiddleware, requireOwner } from '@/middleware/tenant'
import authRoutes from '@/routes/auth'
import tenantsRouter from '@/routes/tenants'
import vehiclesRouter from '@/routes/vehicles'
import customersRouter from '@/routes/customers'
import visitsRouter from '@/routes/visits'
import uploadRouter from '@/routes/upload'
import dashboardRouter from '@/routes/dashboard'
import estimatesRouter from '@/routes/estimates'
import invoicesRouter from '@/routes/invoices'
import { publicStaffRouter, acceptInviteRouter, staffRouter } from '@/routes/staff'
import attendanceRouter from '@/routes/attendance'

const app = new Hono<{ Bindings: Env; Variables: Variables }>()

// ── Global middleware ─────────────────────────────────────────────────────────
app.use('*', corsMiddleware)

// ── Error handling ────────────────────────────────────────────────────────────
// Without this, any uncaught throw returns Hono's bare-text "Internal Server
// Error", which breaks the { error: { code, message } } contract every client
// parses. Internal messages are logged, never returned.
app.onError((err, c) => {
  console.error(`[${c.req.method} ${c.req.path}]`, err)
  return c.json(
    { error: { code: 'SERVER_ERROR', message: 'An unexpected error occurred' } },
    500,
  )
})

app.notFound((c) => {
  return c.json({ error: { code: 'NOT_FOUND', message: 'Route not found' } }, 404)
})

// ── Health check (public) ─────────────────────────────────────────────────────
// Registered before the env guard so liveness probes still answer on a
// half-configured deployment (that is exactly when you need them to).
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Fail fast and loudly on a misconfigured deployment rather than surfacing an
// opaque 500 from deep inside a handler (e.g. an unsigned R2 presign URL).
// Throws → caught by app.onError above.
app.use('*', async (c, next) => {
  validateEnv(c.env)
  await next()
})

// ── Auth routes (public — no JWT required) ────────────────────────────────────
app.route('/auth', authRoutes)
app.route('/staff', publicStaffRouter)

// ── Tenant routes ─────────────────────────────────────────────────────────────
// POST /tenants and GET /tenants/mine only need JWT (no X-Tenant-ID yet)
app.use('/tenants/*', authMiddleware)
// PATCH /tenants/:id additionally needs tenant membership verification.
// Scoped with app.on() so it stays off GET /tenants/mine — a plain
// app.use('/tenants/:id', …) also matches /tenants/mine and would reject the
// bootstrap request (the client has no tenant id to send yet) with a 400.
app.on('PATCH', '/tenants/:id', tenantMiddleware)
app.route('/tenants', tenantsRouter)

// ── Future protected routes (to be registered as features are built) ──────────
// Pattern:
//   app.use('/resource/*', authMiddleware)
//   app.use('/resource/*', tenantMiddleware)
//   app.route('/resource', resourceRouter)

app.use('/vehicles/*', authMiddleware)
app.use('/vehicles/*', tenantMiddleware)
app.route('/vehicles', vehiclesRouter)

app.use('/customers/*', authMiddleware)
app.use('/customers/*', tenantMiddleware)
app.route('/customers', customersRouter)

app.use('/staff/invite/*/accept', authMiddleware)
app.route('/staff', acceptInviteRouter)

app.use('/visits/*', authMiddleware)
app.use('/visits/*', tenantMiddleware)
app.route('/visits', visitsRouter)

app.use('/upload/*', authMiddleware)
app.use('/upload/*', tenantMiddleware)
app.route('/upload', uploadRouter)

app.use('/dashboard/*', authMiddleware)
app.use('/dashboard/*', tenantMiddleware)
app.route('/dashboard', dashboardRouter)

app.use('/estimates/*', authMiddleware)
app.use('/estimates/*', tenantMiddleware)
app.route('/estimates', estimatesRouter)

app.use('/invoices/*', authMiddleware)
app.use('/invoices/*', tenantMiddleware)
app.route('/invoices', invoicesRouter)

// Every route on staffRouter is Owner-only per 05-ui-screens.md (staff list,
// invite, profile/salary, remove, revoke) — STAFF's only access point is
// /checkin, served by attendanceRouter below, not this router. The public
// invite view and the accept endpoint are mounted separately above and never
// reach this chain (their own routes terminate the request first), so they
// stay reachable by an unauthenticated or not-yet-a-member caller.
app.use('/staff/*', authMiddleware)
app.use('/staff/*', tenantMiddleware)
app.use('/staff/*', requireOwner)
app.route('/staff', staffRouter)

app.use('/attendance/*', authMiddleware)
app.use('/attendance/*', tenantMiddleware)
app.route('/attendance', attendanceRouter)

export default app
