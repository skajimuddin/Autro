import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import { and, desc, eq, isNull } from 'drizzle-orm'
import { UpdateVisitStatusSchema } from '@workshop/shared'
import type { Env, Variables } from '@/env'
import { service_visits } from '@/db/schema'

const visitsRouter = new Hono<{ Bindings: Env; Variables: Variables }>()

// GET /?vehicle_id=X
visitsRouter.get('/', async (c) => {
  const tenantId = c.get('tenantId')
  const vehicleId = c.req.query('vehicle_id')
  
  if (!vehicleId) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: 'vehicle_id is required' } }, 400)
  }
  
  const db = drizzle(c.env.DB)
  
  const visits = await db.select().from(service_visits)
    .where(and(
      eq(service_visits.tenant_id, tenantId),
      eq(service_visits.vehicle_id, vehicleId),
      isNull(service_visits.deleted_at)
    ))
    .orderBy(desc(service_visits.created_at))
    
  return c.json({ visits })
})

// PATCH /:id/status
visitsRouter.patch('/:id/status', async (c) => {
  const tenantId = c.get('tenantId')
  const visitId = c.req.param('id')
  const body = await c.req.json().catch(() => null)
  const parsed = UpdateVisitStatusSchema.safeParse(body)
  
  if (!parsed.success) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message } }, 400)
  }
  
  const db = drizzle(c.env.DB)
  const now = new Date().toISOString()
  
  const updateData: any = {
    status: parsed.data.status,
    updated_at: now
  }
  
  if (parsed.data.status === 'DELIVERED') {
    updateData.delivered_at = now
  }
  
  await db.update(service_visits).set(updateData)
    .where(and(eq(service_visits.tenant_id, tenantId), eq(service_visits.id, visitId)))
    
  const visit = await db.select().from(service_visits).where(eq(service_visits.id, visitId)).get()
  
  if (!visit) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Visit not found' } }, 404)
  }
  
  return c.json({ visit })
})

export default visitsRouter
