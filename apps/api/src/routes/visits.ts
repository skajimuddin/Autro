import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import { and, eq, isNull } from 'drizzle-orm'
import { UpdateVisitStatusSchema } from '@autro/shared'
import type { Env, Variables } from '@/env'
import { service_visits } from '@/db/schema'

const visitsRouter = new Hono<{ Bindings: Env; Variables: Variables }>()

// PATCH /:id/status
visitsRouter.patch('/:id/status', async (c) => {
  const tenantId = c.get('tenantId')
  const visitId = c.req.param('id')
  const body = await c.req.json().catch(() => null)
  const parsed = UpdateVisitStatusSchema.safeParse(body)

  if (!parsed.success) {
    return c.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message } },
      400,
    )
  }

  const db = drizzle(c.env.DB)
  const now = new Date().toISOString()

  // Check ownership first. Previously the UPDATE was tenant-scoped but the
  // follow-up SELECT was not, so a visit id from another garage updated nothing
  // and then got returned to the caller — a cross-tenant read.
  const existing = await db
    .select({ id: service_visits.id })
    .from(service_visits)
    .where(
      and(
        eq(service_visits.tenant_id, tenantId),
        eq(service_visits.id, visitId),
        isNull(service_visits.deleted_at),
      ),
    )
    .get()

  if (!existing) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Visit not found' } }, 404)
  }

  const updateData: Partial<typeof service_visits.$inferInsert> = {
    status: parsed.data.status,
    updated_at: now,
  }

  if (parsed.data.status === 'DELIVERED') {
    updateData.delivered_at = now
  }

  await db
    .update(service_visits)
    .set(updateData)
    .where(and(eq(service_visits.tenant_id, tenantId), eq(service_visits.id, visitId)))

  const visit = await db
    .select()
    .from(service_visits)
    .where(and(eq(service_visits.tenant_id, tenantId), eq(service_visits.id, visitId)))
    .get()

  return c.json({ visit })
})

export default visitsRouter
