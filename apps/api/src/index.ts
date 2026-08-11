import { Hono } from 'hono'
import type { Env, Variables } from '@/env'
import { corsMiddleware } from '@/middleware/cors'
import { authMiddleware } from '@/middleware/auth'
import { tenantMiddleware } from '@/middleware/tenant'
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

// ── Health check (public) ─────────────────────────────────────────────────────
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// ── Auth routes (public — no JWT required) ────────────────────────────────────
app.route('/auth', authRoutes)
app.route('/staff', publicStaffRouter)

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

app.use('/staff/*', authMiddleware)
app.use('/staff/*', tenantMiddleware)
app.route('/staff', staffRouter)

app.use('/attendance/*', authMiddleware)
app.use('/attendance/*', tenantMiddleware)
app.route('/attendance', attendanceRouter)

export default app
