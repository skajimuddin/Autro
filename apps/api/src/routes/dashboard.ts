import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import { and, eq, gte, isNull, lt, sql } from 'drizzle-orm'
import type { Env, Variables } from '@/env'
import { service_visits, invoices } from '@/db/schema'

const dashboardRouter = new Hono<{ Bindings: Env; Variables: Variables }>()

dashboardRouter.get('/stats', async (c) => {
  const tenantId = c.get('tenantId')
  const db = drizzle(c.env.DB)
  
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayStr = today.toISOString()
  
  const vehiclesTodayResult = await db.select({ count: sql<number>`count(*)` })
    .from(service_visits)
    .where(and(
      eq(service_visits.tenant_id, tenantId),
      gte(service_visits.created_at, todayStr),
      isNull(service_visits.deleted_at)
    ))
    .get()
    
  const repairingResult = await db.select({ count: sql<number>`count(*)` })
    .from(service_visits)
    .where(and(
      eq(service_visits.tenant_id, tenantId),
      eq(service_visits.status, 'REPAIRING'),
      isNull(service_visits.deleted_at)
    ))
    .get()
    
  const readyResult = await db.select({ count: sql<number>`count(*)` })
    .from(service_visits)
    .where(and(
      eq(service_visits.tenant_id, tenantId),
      eq(service_visits.status, 'READY'),
      isNull(service_visits.deleted_at)
    ))
    .get()
    
  const unpaidResult = await db.select({ count: sql<number>`count(*)` })
    .from(invoices)
    .where(and(
      eq(invoices.tenant_id, tenantId),
      eq(invoices.payment_status, 'UNPAID')
    ))
    .get()
    
  const revenueResult = await db.select({ sum: sql<number>`sum(frozen_total)` })
    .from(invoices)
    .where(and(
      eq(invoices.tenant_id, tenantId),
      eq(invoices.payment_status, 'PAID'),
      gte(invoices.paid_at, todayStr) // Assuming paid_at is ISO8601
    ))
    .get()
    
  // Yesterday's paid total, so the dashboard can show a real change figure
  // instead of a decorative one. Mirrors the query above, bounded to
  // [yesterday 00:00, today 00:00).
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  const yesterdayStr = yesterday.toISOString()

  const revenueYesterdayResult = await db.select({ sum: sql<number>`sum(frozen_total)` })
    .from(invoices)
    .where(and(
      eq(invoices.tenant_id, tenantId),
      eq(invoices.payment_status, 'PAID'),
      gte(invoices.paid_at, yesterdayStr),
      lt(invoices.paid_at, todayStr)
    ))
    .get()

  const revenue_today = revenueResult?.sum || 0
  const revenue_yesterday = revenueYesterdayResult?.sum || 0
  const unpaid_invoices = unpaidResult?.count || 0
  
  return c.json({
    vehicles_today: vehiclesTodayResult?.count || 0,
    repairing: repairingResult?.count || 0,
    ready: readyResult?.count || 0,
    revenue_today,
    revenue_yesterday,
    unpaid_invoices
  })
})

export default dashboardRouter
