import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import { and, desc, eq, isNull, like, sql } from 'drizzle-orm'
import { CreateVehicleSchema, UpdateVehicleSchema, CreateVisitSchema, AddVehicleImageSchema } from '@autro/shared'
import type { Env, Variables } from '@/env'
import type { D1Write } from '@/db/batch'
import { runBatch } from '@/db/batch'
import { customers, vehicles, service_visits, vehicle_images, estimates, estimate_items, invoices } from '@/db/schema'

const vehiclesRouter = new Hono<{ Bindings: Env; Variables: Variables }>()

// GET /search (autocomplete)
vehiclesRouter.get('/search', async (c) => {
  const tenantId = c.get('tenantId')
  const plate = c.req.query('plate') || ''
  const db = drizzle(c.env.DB)

  const query = db
    .select({
      id: vehicles.id,
      registration_number: vehicles.registration_number,
      name: vehicles.name,
      customer_id: customers.id,
      customer_name: customers.name,
      customer_phone: customers.phone,
    })
    .from(vehicles)
    .innerJoin(customers, eq(vehicles.customer_id, customers.id))
    .where(
      and(
        eq(vehicles.tenant_id, tenantId),
        isNull(vehicles.deleted_at),
        like(vehicles.registration_number, `%${plate.toUpperCase()}%`)
      )
    )
    .limit(10)

  const results = await query.all()
  return c.json({ vehicles: results })
})

// GET / (paginated + status filter)
vehiclesRouter.get('/', async (c) => {
  const tenantId = c.get('tenantId')
  const status = c.req.query('status')
  const plate = c.req.query('plate')
  const cursor = parseInt(c.req.query('cursor') || '0', 10)
  const limit = 20
  
  const db = drizzle(c.env.DB)
  
  const latestVisitIdQuery = sql`(SELECT id FROM ${service_visits} WHERE vehicle_id = ${vehicles.id} AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1)`
  
  let conditions = [
    eq(vehicles.tenant_id, tenantId),
    isNull(vehicles.deleted_at)
  ];
  
  if (status && status !== 'All' && status !== 'ALL') {
    conditions.push(eq(service_visits.status, status))
  }

  if (plate) {
    conditions.push(like(vehicles.registration_number, `%${plate.toUpperCase()}%`))
  }
  
  const results = await db
    .select({
      id: vehicles.id,
      registration_number: vehicles.registration_number,
      name: vehicles.name,
      customer_name: customers.name,
      customer_phone: customers.phone,
      status: service_visits.status,
      created_at: vehicles.created_at,
    })
    .from(vehicles)
    .innerJoin(customers, eq(vehicles.customer_id, customers.id))
    .leftJoin(service_visits, eq(service_visits.id, latestVisitIdQuery))
    .where(and(...conditions))
    .orderBy(desc(vehicles.created_at))
    .limit(limit + 1)
    .offset(cursor)
    
  const hasNextPage = results.length > limit
  const data = results.slice(0, limit)
  
  return c.json({
    vehicles: data,
    cursor: hasNextPage ? (cursor + limit).toString() : null
  })
})

// POST /
vehiclesRouter.post('/', async (c) => {
  const tenantId = c.get('tenantId')
  const body = await c.req.json().catch(() => null)
  const parsed = CreateVehicleSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message } }, 400)
  }
  
  const db = drizzle(c.env.DB)
  const now = new Date().toISOString()
  const data = parsed.data

  // A D1 batch is a fixed list of statements — no branching mid-batch — so the
  // "does this customer/vehicle already exist?" lookups happen up front.
  const visitId = crypto.randomUUID()
  const writes: D1Write[] = []

  const existingCustomer = await db
    .select({ id: customers.id })
    .from(customers)
    .where(and(eq(customers.tenant_id, tenantId), eq(customers.phone, data.customer_phone)))
    .get()

  let customerId: string
  if (existingCustomer) {
    customerId = existingCustomer.id
  } else {
    customerId = crypto.randomUUID()
    writes.push(
      db.insert(customers).values({
        id: customerId,
        tenant_id: tenantId,
        name: data.customer_name,
        phone: data.customer_phone,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      }),
    )
  }

  const existingVehicle = await db
    .select({ id: vehicles.id })
    .from(vehicles)
    .where(
      and(
        eq(vehicles.tenant_id, tenantId),
        eq(vehicles.registration_number, data.registration_number),
      ),
    )
    .get()

  let vehicleId: string
  if (existingVehicle) {
    vehicleId = existingVehicle.id
  } else {
    vehicleId = crypto.randomUUID()
    writes.push(
      db.insert(vehicles).values({
        id: vehicleId,
        tenant_id: tenantId,
        customer_id: customerId,
        registration_number: data.registration_number,
        name: data.name,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      }),
    )
  }

  writes.push(
    db.insert(service_visits).values({
      id: visitId,
      tenant_id: tenantId,
      vehicle_id: vehicleId,
      complaint: data.complaint || null,
      status: 'NEW',
      created_at: now,
      updated_at: now,
      delivered_at: null,
      deleted_at: null,
    }),
  )

  if (data.image_urls.length > 0) {
    writes.push(
      db.insert(vehicle_images).values(
        data.image_urls.map((url) => ({
          id: crypto.randomUUID(),
          tenant_id: tenantId,
          vehicle_id: vehicleId,
          image_url: url,
          uploaded_at: now,
        })),
      ),
    )
  }

  await runBatch(db, writes)

  const vehicle = await db.select().from(vehicles).where(eq(vehicles.id, vehicleId)).get()
  return c.json({ vehicle, visit_id: visitId }, 201)
})

// GET /:id
vehiclesRouter.get('/:id', async (c) => {
  const tenantId = c.get('tenantId')
  const vehicleId = c.req.param('id')
  const db = drizzle(c.env.DB)
  
  const vehicle = await db.select().from(vehicles)
    .where(and(eq(vehicles.tenant_id, tenantId), eq(vehicles.id, vehicleId), isNull(vehicles.deleted_at)))
    .get()
    
  if (!vehicle) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Vehicle not found' } }, 404)
  }
  
  const customer = await db.select().from(customers).where(eq(customers.id, vehicle.customer_id)).get()
  let images = await db.select().from(vehicle_images).where(eq(vehicle_images.vehicle_id, vehicle.id)).all()
  
  // Transform legacy r2:// URLs to public HTTP URLs
  images = images.map(img => ({
    ...img,
    image_url: img.image_url.startsWith('r2://')
      ? img.image_url.replace('r2://', 'https://pub-3f013ceda72a4355bda7a9dde43b4a84.r2.dev/')
      : img.image_url
  }))
  
  const latest_visit = await db.select().from(service_visits)
    .where(and(eq(service_visits.vehicle_id, vehicle.id), isNull(service_visits.deleted_at)))
    .orderBy(desc(service_visits.created_at))
    .limit(1)
    .get()
    
  let estimate_total: number | null = null
  let invoice_total: number | null = null

  if (latest_visit) {
    // We get the frozen_total for invoices, but for estimates we calculate it or just skip if no estimates.
    // wait, the estimate total is NOT stored in `estimates` table natively in our schema unless we join estimate_items.
    // We can do a quick sum or just grab the first estimate and invoice.
    
    // For estimate_total, we can fetch all items of the latest estimate for this visit
    const latestEstimate = await db.select().from(estimates)
      .where(eq(estimates.visit_id, latest_visit.id))
      .orderBy(desc(estimates.created_at)).get()
      
    if (latestEstimate) {
      const items = await db.select().from(estimate_items).where(eq(estimate_items.estimate_id, latestEstimate.id)).all()
      let subtotal = 0
      for (const item of items) subtotal += item.amount * item.quantity
      let discount = 0
      if (latestEstimate.discount_type === 'FLAT' && latestEstimate.discount_value) discount = latestEstimate.discount_value
      else if (latestEstimate.discount_type === 'PERCENT' && latestEstimate.discount_value) discount = subtotal * (latestEstimate.discount_value / 100)
      let afterDiscount = Math.max(0, subtotal - discount)
      let tax = 0
      if (latestEstimate.tax_enabled && latestEstimate.tax_percent) tax = afterDiscount * (latestEstimate.tax_percent / 100)
      estimate_total = afterDiscount + tax
    }
    
    const latestInvoice = await db.select().from(invoices)
      .where(eq(invoices.visit_id, latest_visit.id))
      .orderBy(desc(invoices.created_at)).get()
      
    if (latestInvoice) {
      invoice_total = latestInvoice.frozen_total
    }
  }
    
  return c.json({
    id: vehicle.id,
    registration_number: vehicle.registration_number,
    name: vehicle.name,
    customer_id: customer?.id || '',
    customer_name: customer?.name || '',
    customer_phone: customer?.phone || '',
    status: latest_visit?.status || 'NEW',
    complaint: latest_visit?.complaint || null,
    images: images || [],
    visit_id: latest_visit?.id || null,
    estimate_total,
    invoice_total,
    created_at: vehicle.created_at
  })
})

// PATCH /:id
vehiclesRouter.patch('/:id', async (c) => {
  const tenantId = c.get('tenantId')
  const vehicleId = c.req.param('id')
  const body = await c.req.json().catch(() => null)
  const parsed = UpdateVehicleSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message } }, 400)
  }
  
  const db = drizzle(c.env.DB)
  const now = new Date().toISOString()
  
  if (Object.keys(parsed.data).length > 0) {
    await db.update(vehicles).set({ ...parsed.data, updated_at: now })
      .where(and(eq(vehicles.tenant_id, tenantId), eq(vehicles.id, vehicleId)))
  }
  
  const vehicle = await db.select().from(vehicles).where(eq(vehicles.id, vehicleId)).get()
  return c.json({ vehicle })
})

// POST /:id/visits
vehiclesRouter.post('/:id/visits', async (c) => {
  const tenantId = c.get('tenantId')
  const vehicleId = c.req.param('id')
  const body = await c.req.json().catch(() => null)
  const parsed = CreateVisitSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message } }, 400)
  }
  
  const db = drizzle(c.env.DB)
  const now = new Date().toISOString()
  const visitId = crypto.randomUUID()

  // The vehicle id comes from the URL. Without confirming it belongs to this
  // tenant, a caller could open a visit against another garage's vehicle.
  const vehicle = await db
    .select({ id: vehicles.id })
    .from(vehicles)
    .where(
      and(
        eq(vehicles.tenant_id, tenantId),
        eq(vehicles.id, vehicleId),
        isNull(vehicles.deleted_at),
      ),
    )
    .get()

  if (!vehicle) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Vehicle not found' } }, 404)
  }

  // D1 has no SQL transactions; runBatch() uses db.batch(), its atomic primitive.
  const writes: D1Write[] = [
    db.insert(service_visits).values({
      id: visitId,
      tenant_id: tenantId,
      vehicle_id: vehicleId,
      complaint: parsed.data.complaint || null,
      status: 'NEW',
      created_at: now,
      updated_at: now,
      deleted_at: null,
    }),
  ]

  if (parsed.data.image_urls.length > 0) {
    writes.push(
      db.insert(vehicle_images).values(
        parsed.data.image_urls.map((url) => ({
          id: crypto.randomUUID(),
          tenant_id: tenantId,
          vehicle_id: vehicleId,
          image_url: url,
          uploaded_at: now,
        })),
      ),
    )
  }

  await runBatch(db, writes)

  const visit = await db.select().from(service_visits).where(eq(service_visits.id, visitId)).get()
  return c.json({ visit }, 201)
})

// POST /:id/images
vehiclesRouter.post('/:id/images', async (c) => {
  const tenantId = c.get('tenantId')
  const vehicleId = c.req.param('id')
  const body = await c.req.json().catch(() => null)
  const parsed = AddVehicleImageSchema.safeParse(body)
  if (!parsed.success) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message } }, 400)
  }
  
  const db = drizzle(c.env.DB)
  const now = new Date().toISOString()
  const imageId = crypto.randomUUID()

  // Same reason as POST /:id/visits — verify tenant ownership of the vehicle.
  const vehicle = await db
    .select({ id: vehicles.id })
    .from(vehicles)
    .where(
      and(
        eq(vehicles.tenant_id, tenantId),
        eq(vehicles.id, vehicleId),
        isNull(vehicles.deleted_at),
      ),
    )
    .get()

  if (!vehicle) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Vehicle not found' } }, 404)
  }

  await db.insert(vehicle_images).values({
    id: imageId,
    tenant_id: tenantId,
    vehicle_id: vehicleId,
    image_url: parsed.data.image_url,
    uploaded_at: now
  })
  
  const image = await db.select().from(vehicle_images).where(eq(vehicle_images.id, imageId)).get()
  
  if (image && image.image_url.startsWith('r2://')) {
    image.image_url = image.image_url.replace('r2://', 'https://pub-3f013ceda72a4355bda7a9dde43b4a84.r2.dev/')
  }
  
  return c.json({ image }, 201)
})

export default vehiclesRouter
