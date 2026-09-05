import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import { and, desc, eq, isNull, sql } from 'drizzle-orm'
import type { Env, Variables } from '@/env'
import { customers, vehicles, service_visits, invoices } from '@/db/schema'

const customersRouter = new Hono<{ Bindings: Env; Variables: Variables }>()

// GET /customers/:id — one customer: their vehicles and a lifetime summary.
//
// A customer only exists today as whoever is attached to a vehicle (there is
// no standalone "add customer" flow), so this is reached from a vehicle's
// detail screen, not a customer list. Every figure here is computed from the
// same source data the rest of the app already trusts (paid invoices,
// service visits) — nothing is a running total that could drift.
customersRouter.get('/:id', async (c) => {
  const tenantId = c.get('tenantId')
  const customerId = c.req.param('id')
  const db = drizzle(c.env.DB)

  const customer = await db
    .select()
    .from(customers)
    .where(and(eq(customers.tenant_id, tenantId), eq(customers.id, customerId), isNull(customers.deleted_at)))
    .get()

  if (!customer) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Customer not found' } }, 404)
  }

  const latestVisitIdQuery = sql`(SELECT id FROM ${service_visits} WHERE vehicle_id = ${vehicles.id} AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1)`

  const vehicleRows = await db
    .select({
      id: vehicles.id,
      registration_number: vehicles.registration_number,
      name: vehicles.name,
      status: service_visits.status,
      created_at: vehicles.created_at,
    })
    .from(vehicles)
    .leftJoin(service_visits, eq(service_visits.id, latestVisitIdQuery))
    .where(and(eq(vehicles.tenant_id, tenantId), eq(vehicles.customer_id, customerId), isNull(vehicles.deleted_at)))
    .orderBy(desc(vehicles.created_at))
    .all()

  // Lifetime totals across every visit this customer's vehicles have ever
  // had — a join through service_visits rather than per-vehicle loops, so
  // this stays one query regardless of how many vehicles they've brought in.
  const totals = await db
    .select({
      visit_count: sql<number>`count(distinct ${service_visits.id})`,
      total_spent: sql<number>`coalesce(sum(case when ${invoices.payment_status} = 'PAID' then ${invoices.frozen_total} else 0 end), 0)`,
      unpaid_count: sql<number>`count(distinct case when ${invoices.payment_status} = 'UNPAID' then ${invoices.id} end)`,
    })
    .from(service_visits)
    .innerJoin(vehicles, eq(vehicles.id, service_visits.vehicle_id))
    .leftJoin(invoices, eq(invoices.visit_id, service_visits.id))
    .where(
      and(
        eq(vehicles.tenant_id, tenantId),
        eq(vehicles.customer_id, customerId),
        isNull(service_visits.deleted_at),
      ),
    )
    .get()

  return c.json({
    id: customer.id,
    name: customer.name,
    phone: customer.phone,
    customer_since: customer.created_at,
    vehicle_count: vehicleRows.length,
    visit_count: totals?.visit_count ?? 0,
    total_spent: totals?.total_spent ?? 0,
    unpaid_count: totals?.unpaid_count ?? 0,
    vehicles: vehicleRows,
  })
})

export default customersRouter
