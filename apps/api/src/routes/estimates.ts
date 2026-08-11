import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import { and, desc, eq } from 'drizzle-orm'
import { CreateEstimateSchema, UpdateEstimateSchema } from '@workshop/shared'
import type { Env, Variables } from '@/env'
import { estimates, estimate_items, service_visits, vehicles, customers } from '@/db/schema'

const estimatesRouter = new Hono<{ Bindings: Env; Variables: Variables }>()

// GET /estimates
estimatesRouter.get('/', async (c) => {
  const tenantId = c.get('tenantId')
  const status = c.req.query('status')
  const cursor = parseInt(c.req.query('cursor') || '0', 10)
  const limit = 20
  
  const db = drizzle(c.env.DB)
  
  let conditions = [eq(estimates.tenant_id, tenantId)]
  if (status && (status === 'DRAFT' || status === 'CONVERTED')) {
    conditions.push(eq(estimates.status, status))
  }
  
  const results = await db
    .select({
      id: estimates.id,
      visit_id: estimates.visit_id,
      status: estimates.status,
      created_at: estimates.created_at,
      registration_number: vehicles.registration_number,
      customer_name: customers.name,
      discount_type: estimates.discount_type,
      discount_value: estimates.discount_value,
      tax_enabled: estimates.tax_enabled,
      tax_percent: estimates.tax_percent,
    })
    .from(estimates)
    .innerJoin(service_visits, eq(estimates.visit_id, service_visits.id))
    .innerJoin(vehicles, eq(service_visits.vehicle_id, vehicles.id))
    .innerJoin(customers, eq(vehicles.customer_id, customers.id))
    .where(and(...conditions))
    .orderBy(desc(estimates.created_at))
    .limit(limit + 1)
    .offset(cursor)
    
  const hasNextPage = results.length > limit
  const data = results.slice(0, limit)
  
  // To calculate total, we need the items. Instead of N+1 query, we could do a join,
  // but for simplicity we will do N queries for now.
  const estimatesWithTotal = await Promise.all(data.map(async (est) => {
    const items = await db.select().from(estimate_items).where(eq(estimate_items.estimate_id, est.id)).all()
    let subtotal = 0
    for (const item of items) {
      subtotal += item.amount * item.quantity
    }
    
    let discount = 0
    if (est.discount_type === 'FLAT' && est.discount_value) {
      discount = est.discount_value
    } else if (est.discount_type === 'PERCENT' && est.discount_value) {
      discount = subtotal * (est.discount_value / 100)
    }
    
    let afterDiscount = Math.max(0, subtotal - discount)
    let tax = 0
    if (est.tax_enabled && est.tax_percent) {
      tax = afterDiscount * (est.tax_percent / 100)
    }
    
    return {
      id: est.id,
      visit_id: est.visit_id,
      registration_number: est.registration_number,
      customer_name: est.customer_name,
      status: est.status,
      created_at: est.created_at,
      total: afterDiscount + tax
    }
  }))
  
  return c.json({
    estimates: estimatesWithTotal,
    cursor: hasNextPage ? (cursor + limit).toString() : null
  })
})

// POST /estimates
estimatesRouter.post('/', async (c) => {
  const tenantId = c.get('tenantId')
  const body = await c.req.json().catch(() => null)
  const parsed = CreateEstimateSchema.safeParse(body)
  
  if (!parsed.success) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message } }, 400)
  }
  
  const db = drizzle(c.env.DB)
  const now = new Date().toISOString()
  const estimateId = crypto.randomUUID()
  const data = parsed.data
  
  await db.transaction(async (tx) => {
    await tx.insert(estimates).values({
      id: estimateId,
      tenant_id: tenantId,
      visit_id: data.visit_id,
      discount_type: data.discount_type,
      discount_value: data.discount_value,
      tax_enabled: data.tax_enabled ? 1 : 0,
      tax_percent: data.tax_percent,
      notes: data.notes,
      status: 'DRAFT',
      created_at: now,
      updated_at: now,
    })
    
    if (data.items.length > 0) {
      const itemsToInsert = data.items.map((item, index) => ({
        id: crypto.randomUUID(),
        estimate_id: estimateId,
        description: item.description,
        amount: item.amount,
        quantity: item.quantity,
        sort_order: index,
      }))
      await tx.insert(estimate_items).values(itemsToInsert)
    }
  })
  
  return c.json({ id: estimateId }, 201)
})

// GET /estimates/:id
estimatesRouter.get('/:id', async (c) => {
  const tenantId = c.get('tenantId')
  const estimateId = c.req.param('id')
  
  const db = drizzle(c.env.DB)
  
  const estimate = await db.select().from(estimates)
    .where(and(eq(estimates.tenant_id, tenantId), eq(estimates.id, estimateId)))
    .get()
    
  if (!estimate) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Estimate not found' } }, 404)
  }
  
  const items = await db.select().from(estimate_items)
    .where(eq(estimate_items.estimate_id, estimateId))
    .orderBy(estimate_items.sort_order)
    .all()
    
  // Get vehicle details
  const visit = await db.select().from(service_visits).where(eq(service_visits.id, estimate.visit_id)).get()
  let vehicle = null
  let customer = null
  if (visit) {
    vehicle = await db.select().from(vehicles).where(eq(vehicles.id, visit.vehicle_id)).get()
    if (vehicle) {
      customer = await db.select().from(customers).where(eq(customers.id, vehicle.customer_id)).get()
    }
  }
  
  return c.json({ 
    ...estimate, 
    items, 
    registration_number: vehicle?.registration_number, 
    customer_name: customer?.name 
  })
})

// PATCH /estimates/:id
estimatesRouter.patch('/:id', async (c) => {
  const tenantId = c.get('tenantId')
  const estimateId = c.req.param('id')
  const body = await c.req.json().catch(() => null)
  const parsed = UpdateEstimateSchema.safeParse(body)
  
  if (!parsed.success) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message } }, 400)
  }
  
  const db = drizzle(c.env.DB)
  const now = new Date().toISOString()
  
  const dataToUpdate: any = { updated_at: now }
  if (parsed.data.discount_type !== undefined) dataToUpdate.discount_type = parsed.data.discount_type
  if (parsed.data.discount_value !== undefined) dataToUpdate.discount_value = parsed.data.discount_value
  if (parsed.data.tax_enabled !== undefined) dataToUpdate.tax_enabled = parsed.data.tax_enabled ? 1 : 0
  if (parsed.data.tax_percent !== undefined) dataToUpdate.tax_percent = parsed.data.tax_percent
  if (parsed.data.notes !== undefined) dataToUpdate.notes = parsed.data.notes
  if (parsed.data.status !== undefined) dataToUpdate.status = parsed.data.status
  
  await db.transaction(async (tx) => {
    if (Object.keys(dataToUpdate).length > 1) {
      await tx.update(estimates).set(dataToUpdate)
        .where(and(eq(estimates.tenant_id, tenantId), eq(estimates.id, estimateId)))
    }
    
    if (parsed.data.items !== undefined) {
      await tx.delete(estimate_items).where(eq(estimate_items.estimate_id, estimateId))
      if (parsed.data.items.length > 0) {
        const itemsToInsert = parsed.data.items.map((item, index) => ({
          id: crypto.randomUUID(),
          estimate_id: estimateId,
          description: item.description,
          amount: item.amount,
          quantity: item.quantity,
          sort_order: item.sort_order ?? index,
        }))
        await tx.insert(estimate_items).values(itemsToInsert)
      }
    }
  })
  
  const estimate = await db.select().from(estimates).where(eq(estimates.id, estimateId)).get()
  const items = await db.select().from(estimate_items).where(eq(estimate_items.estimate_id, estimateId)).all()
  
  return c.json({ 
    ...estimate, 
    items 
  })
})



export default estimatesRouter
