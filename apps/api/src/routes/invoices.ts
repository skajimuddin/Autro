import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import { and, desc, eq, isNull } from 'drizzle-orm'
import { CreateInvoiceSchema, UpdateInvoiceSchema, MarkInvoicePaidSchema } from '@autro/shared'
import type { Env, Variables } from '@/env'
import type { D1Write } from '@/db/batch'
import { runBatch } from '@/db/batch'
import {
  invoices,
  invoice_items,
  service_visits,
  vehicles,
  customers,
  estimates,
  estimate_items,
} from '@/db/schema'

const invoicesRouter = new Hono<{ Bindings: Env; Variables: Variables }>()

// GET /invoices
invoicesRouter.get('/', async (c) => {
  const tenantId = c.get('tenantId')
  const status = c.req.query('status')
  const cursor = parseInt(c.req.query('cursor') || '0', 10)
  const limit = 20

  const db = drizzle(c.env.DB)

  let conditions = [eq(invoices.tenant_id, tenantId)]
  if (status && (status === 'UNPAID' || status === 'PAID')) {
    conditions.push(eq(invoices.payment_status, status))
  }

  const results = await db
    .select({
      id: invoices.id,
      visit_id: invoices.visit_id,
      payment_status: invoices.payment_status,
      frozen_total: invoices.frozen_total,
      created_at: invoices.created_at,
      registration_number: vehicles.registration_number,
      customer_name: customers.name,
    })
    .from(invoices)
    .innerJoin(service_visits, eq(invoices.visit_id, service_visits.id))
    .innerJoin(vehicles, eq(service_visits.vehicle_id, vehicles.id))
    .innerJoin(customers, eq(vehicles.customer_id, customers.id))
    .where(and(...conditions))
    .orderBy(desc(invoices.created_at))
    .limit(limit + 1)
    .offset(cursor)

  const hasNextPage = results.length > limit
  const data = results.slice(0, limit)

  return c.json({
    invoices: data,
    cursor: hasNextPage ? (cursor + limit).toString() : null,
  })
})

// POST /invoices
invoicesRouter.post('/', async (c) => {
  const tenantId = c.get('tenantId')
  const body = await c.req.json().catch(() => null)
  const parsed = CreateInvoiceSchema.safeParse(body)

  if (!parsed.success) {
    return c.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message } },
      400,
    )
  }

  const db = drizzle(c.env.DB)
  const now = new Date().toISOString()
  const invoiceId = crypto.randomUUID()
  const data = parsed.data

  // Calculate frozen_total
  let subtotal = 0
  for (const item of data.items) {
    subtotal += item.amount * item.quantity
  }

  let discount = 0
  if (data.discount_type === 'FLAT' && data.discount_value) {
    discount = data.discount_value
  } else if (data.discount_type === 'PERCENT' && data.discount_value) {
    discount = subtotal * (data.discount_value / 100)
  }

  let afterDiscount = Math.max(0, subtotal - discount)
  let tax = 0
  if (data.tax_enabled && data.tax_percent) {
    tax = afterDiscount * (data.tax_percent / 100)
  }

  const frozen_total = afterDiscount + tax

  // Verify the visit belongs to this tenant — visit_id comes straight from the
  // request body, so without this an invoice can be attached to another
  // garage's visit.
  const visit = await db
    .select({ id: service_visits.id })
    .from(service_visits)
    .where(
      and(
        eq(service_visits.tenant_id, tenantId),
        eq(service_visits.id, data.visit_id),
        isNull(service_visits.deleted_at),
      ),
    )
    .get()

  if (!visit) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Service visit not found' } }, 404)
  }

  // D1 has no SQL transactions; runBatch() uses db.batch(), its atomic primitive.
  const writes: D1Write[] = [
    db.insert(invoices).values({
      id: invoiceId,
      tenant_id: tenantId,
      visit_id: data.visit_id,
      discount_type: data.discount_type,
      discount_value: data.discount_value,
      tax_enabled: data.tax_enabled ? 1 : 0,
      tax_percent: data.tax_percent,
      frozen_total: frozen_total,
      notes: data.notes,
      payment_status: 'UNPAID',
      created_at: now,
      updated_at: now,
    }),
  ]

  if (data.items.length > 0) {
    writes.push(
      db.insert(invoice_items).values(
        data.items.map((item, index) => ({
          id: crypto.randomUUID(),
          invoice_id: invoiceId,
          description: item.description,
          amount: item.amount,
          quantity: item.quantity,
          sort_order: index,
        })),
      ),
    )
  }

  await runBatch(db, writes)

  return c.json({ id: invoiceId }, 201)
})

// GET /invoices/:id
invoicesRouter.get('/:id', async (c) => {
  const tenantId = c.get('tenantId')
  const invoiceId = c.req.param('id')

  const db = drizzle(c.env.DB)

  const invoice = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.tenant_id, tenantId), eq(invoices.id, invoiceId)))
    .get()

  if (!invoice) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Invoice not found' } }, 404)
  }

  const items = await db
    .select()
    .from(invoice_items)
    .where(eq(invoice_items.invoice_id, invoiceId))
    .orderBy(invoice_items.sort_order)
    .all()

  // Get vehicle details
  const visit = await db
    .select()
    .from(service_visits)
    .where(eq(service_visits.id, invoice.visit_id))
    .get()
  let vehicle = null
  let customer = null
  if (visit) {
    vehicle = await db.select().from(vehicles).where(eq(vehicles.id, visit.vehicle_id)).get()
    if (vehicle) {
      customer = await db
        .select()
        .from(customers)
        .where(eq(customers.id, vehicle.customer_id))
        .get()
    }
  }

  return c.json({
    ...invoice,
    items,
    registration_number: vehicle?.registration_number,
    customer_name: customer?.name,
  })
})

// PATCH /invoices/:id
invoicesRouter.patch('/:id', async (c) => {
  const tenantId = c.get('tenantId')
  const invoiceId = c.req.param('id')
  const body = await c.req.json().catch(() => null)
  const parsed = UpdateInvoiceSchema.safeParse(body)

  if (!parsed.success) {
    return c.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message } },
      400,
    )
  }

  const db = drizzle(c.env.DB)
  const now = new Date().toISOString()

  const currentInvoice = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.tenant_id, tenantId), eq(invoices.id, invoiceId)))
    .get()
  if (!currentInvoice)
    return c.json({ error: { code: 'NOT_FOUND', message: 'Invoice not found' } }, 404)

  const dataToUpdate: Partial<typeof invoices.$inferInsert> = { updated_at: now }
  if (parsed.data.discount_type !== undefined)
    dataToUpdate.discount_type = parsed.data.discount_type
  if (parsed.data.discount_value !== undefined)
    dataToUpdate.discount_value = parsed.data.discount_value
  if (parsed.data.tax_enabled !== undefined)
    dataToUpdate.tax_enabled = parsed.data.tax_enabled ? 1 : 0
  if (parsed.data.tax_percent !== undefined) dataToUpdate.tax_percent = parsed.data.tax_percent
  if (parsed.data.notes !== undefined) dataToUpdate.notes = parsed.data.notes

  // A D1 batch is a fixed list of statements, so every read has to happen
  // first — including reading the current items when the request doesn't
  // replace them (frozen_total is recalculated from whichever set applies).
  const writes: D1Write[] = []
  let finalItems: { amount: number; quantity: number }[]

  if (parsed.data.items !== undefined) {
    writes.push(db.delete(invoice_items).where(eq(invoice_items.invoice_id, invoiceId)))
    const itemsToInsert = parsed.data.items.map((item, index) => ({
      id: crypto.randomUUID(),
      invoice_id: invoiceId,
      description: item.description,
      amount: item.amount,
      quantity: item.quantity,
      sort_order: item.sort_order ?? index,
    }))
    if (itemsToInsert.length > 0) {
      writes.push(db.insert(invoice_items).values(itemsToInsert))
    }
    finalItems = itemsToInsert
  } else {
    finalItems = await db
      .select({ amount: invoice_items.amount, quantity: invoice_items.quantity })
      .from(invoice_items)
      .where(eq(invoice_items.invoice_id, invoiceId))
      .all()
  }

  // Recalculate frozen_total
  let subtotal = 0
  for (const item of finalItems) {
    subtotal += item.amount * item.quantity
  }
  const discountType = dataToUpdate.discount_type ?? currentInvoice.discount_type
  const discountValue = dataToUpdate.discount_value ?? currentInvoice.discount_value
  let discount = 0
  if (discountType === 'FLAT' && discountValue) {
    discount = discountValue
  } else if (discountType === 'PERCENT' && discountValue) {
    discount = subtotal * (discountValue / 100)
  }
  const afterDiscount = Math.max(0, subtotal - discount)

  const taxEnabled = dataToUpdate.tax_enabled ?? currentInvoice.tax_enabled
  const taxPercent = dataToUpdate.tax_percent ?? currentInvoice.tax_percent
  let tax = 0
  if (taxEnabled && taxPercent) {
    tax = afterDiscount * (taxPercent / 100)
  }
  dataToUpdate.frozen_total = afterDiscount + tax

  writes.push(
    db
      .update(invoices)
      .set(dataToUpdate)
      .where(and(eq(invoices.tenant_id, tenantId), eq(invoices.id, invoiceId))),
  )

  await runBatch(db, writes)

  const invoice = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).get()
  const items = await db
    .select()
    .from(invoice_items)
    .where(eq(invoice_items.invoice_id, invoiceId))
    .all()
  return c.json({ ...invoice, items })
})

// PATCH /invoices/:id/pay (mark as paid)
invoicesRouter.patch('/:id/pay', async (c) => {
  const tenantId = c.get('tenantId')
  const invoiceId = c.req.param('id')
  const body = await c.req.json().catch(() => null)
  const parsed = MarkInvoicePaidSchema.safeParse(body)

  if (!parsed.success) {
    return c.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message } },
      400,
    )
  }

  const db = drizzle(c.env.DB)
  const now = new Date().toISOString()

  const currentInvoice = await db
    .select()
    .from(invoices)
    .where(and(eq(invoices.tenant_id, tenantId), eq(invoices.id, invoiceId)))
    .get()
  if (!currentInvoice)
    return c.json({ error: { code: 'NOT_FOUND', message: 'Invoice not found' } }, 404)

  await db
    .update(invoices)
    .set({
      payment_status: 'PAID',
      payment_method: parsed.data.payment_method,
      paid_at: now,
      updated_at: now,
    })
    .where(eq(invoices.id, invoiceId))

  // Automatically mark the associated service visit as DELIVERED if it isn't already
  await db
    .update(service_visits)
    .set({
      status: 'DELIVERED',
      delivered_at: now,
      updated_at: now,
    })
    .where(
      and(eq(service_visits.id, currentInvoice.visit_id), eq(service_visits.tenant_id, tenantId)),
    )

  const invoice = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).get()
  return c.json({ invoice })
})

// POST /invoices/from-estimate/:estimateId
invoicesRouter.post('/from-estimate/:estimateId', async (c) => {
  const tenantId = c.get('tenantId')
  const estimateId = c.req.param('estimateId')

  const db = drizzle(c.env.DB)
  const now = new Date().toISOString()

  const estimate = await db
    .select()
    .from(estimates)
    .where(and(eq(estimates.tenant_id, tenantId), eq(estimates.id, estimateId)))
    .get()
  if (!estimate) return c.json({ error: { code: 'NOT_FOUND', message: 'Estimate not found' } }, 404)

  // Without this guard, re-posting (double tap, retry, back-and-forward) mints
  // a second invoice for the same estimate — and the garage bills twice.
  if (estimate.status === 'CONVERTED') {
    const already = await db
      .select({ id: invoices.id })
      .from(invoices)
      .where(and(eq(invoices.tenant_id, tenantId), eq(invoices.estimate_id, estimateId)))
      .get()

    if (already) {
      return c.json({ invoice_id: already.id })
    }
  }

  const items = await db
    .select()
    .from(estimate_items)
    .where(eq(estimate_items.estimate_id, estimateId))
    .all()

  // Calculate total
  let subtotal = 0
  for (const item of items) {
    subtotal += item.amount * item.quantity
  }

  let discount = 0
  if (estimate.discount_type === 'FLAT' && estimate.discount_value) {
    discount = estimate.discount_value
  } else if (estimate.discount_type === 'PERCENT' && estimate.discount_value) {
    discount = subtotal * (estimate.discount_value / 100)
  }

  let afterDiscount = Math.max(0, subtotal - discount)
  let tax = 0
  if (estimate.tax_enabled && estimate.tax_percent) {
    tax = afterDiscount * (estimate.tax_percent / 100)
  }

  const frozen_total = afterDiscount + tax
  const invoiceId = crypto.randomUUID()

  // D1 has no SQL transactions; runBatch() uses db.batch(), its atomic primitive.
  const writes: D1Write[] = [
    // 1. Mark estimate as CONVERTED
    db
      .update(estimates)
      .set({ status: 'CONVERTED', updated_at: now })
      .where(and(eq(estimates.tenant_id, tenantId), eq(estimates.id, estimateId))),

    // 2. Create invoice
    db.insert(invoices).values({
      id: invoiceId,
      tenant_id: tenantId,
      visit_id: estimate.visit_id,
      estimate_id: estimateId,
      discount_type: estimate.discount_type,
      discount_value: estimate.discount_value,
      tax_enabled: estimate.tax_enabled,
      tax_percent: estimate.tax_percent,
      frozen_total: frozen_total,
      payment_method: null,
      payment_status: 'UNPAID',
      notes: estimate.notes,
      created_at: now,
      updated_at: now,
      paid_at: null,
    }),
  ]

  // 3. Create invoice items
  if (items.length > 0) {
    writes.push(
      db.insert(invoice_items).values(
        items.map((item) => ({
          id: crypto.randomUUID(),
          invoice_id: invoiceId,
          description: item.description,
          amount: item.amount,
          quantity: item.quantity,
          sort_order: item.sort_order,
        })),
      ),
    )
  }

  await runBatch(db, writes)

  return c.json({ invoice_id: invoiceId }, 201)
})

export default invoicesRouter
