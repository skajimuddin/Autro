import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import { and, desc, eq, isNull, like, or, sql } from 'drizzle-orm'
import { CreateVehicleSchema, AddVehicleImageSchema } from '@autro/shared'
import type { Env, Variables } from '@/env'
import type { D1Write } from '@/db/batch'
import { runBatch } from '@/db/batch'
import {
  customers,
  vehicles,
  service_visits,
  vehicle_images,
  estimates,
  estimate_items,
  invoices,
} from '@/db/schema'

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
        like(vehicles.registration_number, `%${plate.toUpperCase()}%`),
      ),
    )
    .limit(10)

  const results = await query.all()
  return c.json({ vehicles: results })
})

// GET / (paginated + status filter)
vehiclesRouter.get('/', async (c) => {
  const tenantId = c.get('tenantId')
  const status = c.req.query('status')
  const search = c.req.query('q')?.trim()
  const cursor = parseInt(c.req.query('cursor') || '0', 10)
  const limit = 20

  const db = drizzle(c.env.DB)

  const latestVisitIdQuery = sql`(SELECT id FROM ${service_visits} WHERE vehicle_id = ${vehicles.id} AND deleted_at IS NULL ORDER BY created_at DESC LIMIT 1)`

  const conditions = [eq(vehicles.tenant_id, tenantId), isNull(vehicles.deleted_at)]

  if (status && status !== 'ALL') {
    conditions.push(eq(service_visits.status, status))
  }

  // One search box over both columns: an owner looking for a car thinks either
  // "MH12 AB 1234" or "Rakesh", and does not want to choose which field first.
  // Plates are stored upper-case, names in whatever case they were entered, so
  // the name side is compared case-insensitively.
  if (search) {
    conditions.push(
      or(
        like(vehicles.registration_number, `%${search.toUpperCase()}%`),
        like(sql`lower(${customers.name})`, `%${search.toLowerCase()}%`),
      )!,
    )
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
      // The list UI shows the job and how long the vehicle has been in the
      // shop. Both come from the latest visit, which is already joined above
      // for `status` — so this costs no extra query. `created_at` is the
      // *vehicle* record's date and is not the same thing: a returning
      // customer's vehicle is old while its current visit is new.
      complaint: service_visits.complaint,
      visit_started_at: service_visits.created_at,
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
    cursor: hasNextPage ? (cursor + limit).toString() : null,
  })
})

// POST /
vehiclesRouter.post('/', async (c) => {
  const tenantId = c.get('tenantId')
  const body = await c.req.json().catch(() => null)
  const parsed = CreateVehicleSchema.safeParse(body)
  if (!parsed.success) {
    return c.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message } },
      400,
    )
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

  const vehicle = await db
    .select()
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

  const customer = await db
    .select()
    .from(customers)
    .where(eq(customers.id, vehicle.customer_id))
    .get()
  const storedImages = await db
    .select()
    .from(vehicle_images)
    .where(eq(vehicle_images.vehicle_id, vehicle.id))
    .orderBy(desc(vehicle_images.uploaded_at))
    .all()

  // Rows written before uploads returned a public URL hold an `r2://` scheme
  // no browser can load. R2_PUBLIC_URL is only required by the upload route,
  // so a deployment without it still serves this endpoint — those legacy rows
  // just stay as they are, which is what they already were.
  const publicBase = c.env.R2_PUBLIC_URL?.replace(/\/$/, '')
  const images = storedImages.map((img) => ({
    ...img,
    image_url:
      publicBase && img.image_url.startsWith('r2://')
        ? `${publicBase}/${img.image_url.slice('r2://'.length)}`
        : img.image_url,
  }))

  const latest_visit = await db
    .select()
    .from(service_visits)
    .where(and(eq(service_visits.vehicle_id, vehicle.id), isNull(service_visits.deleted_at)))
    .orderBy(desc(service_visits.created_at))
    .limit(1)
    .get()

  // Totals are computed per record rather than stored: an estimate's total is
  // the sum of its items plus discount and tax, and only the invoice freezes a
  // total at the moment it is issued. The ids ride along so the detail screen
  // can open the document it is showing a figure for.
  let estimate_id: string | null = null
  let estimate_total: number | null = null
  let invoice_id: string | null = null
  let invoice_total: number | null = null

  if (latest_visit) {
    const latestEstimate = await db
      .select()
      .from(estimates)
      .where(eq(estimates.visit_id, latest_visit.id))
      .orderBy(desc(estimates.created_at))
      .get()

    if (latestEstimate) {
      estimate_id = latestEstimate.id
      const items = await db
        .select()
        .from(estimate_items)
        .where(eq(estimate_items.estimate_id, latestEstimate.id))
        .all()
      const subtotal = items.reduce((sum, item) => sum + item.amount * item.quantity, 0)

      let discount = 0
      if (latestEstimate.discount_value) {
        discount =
          latestEstimate.discount_type === 'PERCENT'
            ? subtotal * (latestEstimate.discount_value / 100)
            : latestEstimate.discount_type === 'FLAT'
              ? latestEstimate.discount_value
              : 0
      }

      const afterDiscount = Math.max(0, subtotal - discount)
      const tax =
        latestEstimate.tax_enabled && latestEstimate.tax_percent
          ? afterDiscount * (latestEstimate.tax_percent / 100)
          : 0

      estimate_total = afterDiscount + tax
    }

    const latestInvoice = await db
      .select()
      .from(invoices)
      .where(eq(invoices.visit_id, latest_visit.id))
      .orderBy(desc(invoices.created_at))
      .get()

    if (latestInvoice) {
      invoice_id = latestInvoice.id
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
    images,
    visit_id: latest_visit?.id || null,
    // When the current visit opened — not the same as the vehicle record's
    // date. A returning customer's vehicle is old while its visit is new, and
    // "6 days in shop" is a fact about the visit.
    visit_started_at: latest_visit?.created_at || null,
    estimate_id,
    estimate_total,
    invoice_id,
    invoice_total,
    created_at: vehicle.created_at,
  })
})

// POST /:id/images
vehiclesRouter.post('/:id/images', async (c) => {
  const tenantId = c.get('tenantId')
  const vehicleId = c.req.param('id')
  const body = await c.req.json().catch(() => null)
  const parsed = AddVehicleImageSchema.safeParse(body)
  if (!parsed.success) {
    return c.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message } },
      400,
    )
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

  const image = {
    id: imageId,
    tenant_id: tenantId,
    vehicle_id: vehicleId,
    image_url: parsed.data.image_url,
    uploaded_at: now,
  }

  await db.insert(vehicle_images).values(image)

  // Returned as inserted — no legacy `r2://` rewrite here. The client sends
  // the public URL POST /upload/presign handed it, so the scheme this route
  // stores is already loadable; only rows written before that was true need
  // rewriting, and GET /:id is where those are read.
  return c.json({ image }, 201)
})

export default vehiclesRouter
