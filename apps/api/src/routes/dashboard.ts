import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import { and, asc, eq, gte, isNotNull, isNull, lte, sql } from 'drizzle-orm'
import type { Env, Variables } from '@/env'
import { service_visits, invoices, vehicles, customers } from '@/db/schema'

const dashboardRouter = new Hono<{ Bindings: Env; Variables: Variables }>()

dashboardRouter.get('/stats', async (c) => {
  const tenantId = c.get('tenantId')
  const db = drizzle(c.env.DB)

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString()

  const vehiclesTodayResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(service_visits)
    .where(
      and(
        eq(service_visits.tenant_id, tenantId),
        gte(service_visits.created_at, todayStr),
        isNull(service_visits.deleted_at),
      ),
    )
    .get()

  const repairingResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(service_visits)
    .where(
      and(
        eq(service_visits.tenant_id, tenantId),
        eq(service_visits.status, 'REPAIRING'),
        isNull(service_visits.deleted_at),
      ),
    )
    .get()

  const readyResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(service_visits)
    .where(
      and(
        eq(service_visits.tenant_id, tenantId),
        eq(service_visits.status, 'READY'),
        isNull(service_visits.deleted_at),
      ),
    )
    .get()

  const unpaidResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(invoices)
    .where(and(eq(invoices.tenant_id, tenantId), eq(invoices.payment_status, 'UNPAID')))
    .get()

  const revenueResult = await db
    .select({ sum: sql<number>`sum(frozen_total)` })
    .from(invoices)
    .where(
      and(
        eq(invoices.tenant_id, tenantId),
        eq(invoices.payment_status, 'PAID'),
        gte(invoices.paid_at, todayStr), // Assuming paid_at is ISO8601
      ),
    )
    .get()

  const revenue_today = revenueResult?.sum || 0
  const unpaid_invoices = unpaidResult?.count || 0

  return c.json({
    vehicles_today: vehiclesTodayResult?.count || 0,
    repairing: repairingResult?.count || 0,
    ready: readyResult?.count || 0,
    revenue_today,
    unpaid_invoices,
  })
})

// GET /dashboard/service-reminders — vehicles due back within 14 days
// (including already-overdue ones), soonest first. A cheap, zero-dependency
// alternative to a full service-scheduling system: the owner sets a date
// from the vehicle screen when closing out a job, and this is where it
// resurfaces so it isn't just a field nobody looks at again.
dashboardRouter.get('/service-reminders', async (c) => {
  const tenantId = c.get('tenantId')
  const db = drizzle(c.env.DB)

  const horizon = new Date()
  horizon.setDate(horizon.getDate() + 14)
  const horizonStr = horizon.toISOString().slice(0, 10)

  const rows = await db
    .select({
      id: vehicles.id,
      registration_number: vehicles.registration_number,
      name: vehicles.name,
      next_service_due_at: vehicles.next_service_due_at,
      customer_name: customers.name,
      customer_phone: customers.phone,
    })
    .from(vehicles)
    .innerJoin(customers, eq(vehicles.customer_id, customers.id))
    .where(
      and(
        eq(vehicles.tenant_id, tenantId),
        isNull(vehicles.deleted_at),
        isNotNull(vehicles.next_service_due_at),
        lte(vehicles.next_service_due_at, horizonStr),
      ),
    )
    .orderBy(asc(vehicles.next_service_due_at))
    .limit(20)
    .all()

  return c.json({ reminders: rows })
})

export default dashboardRouter
