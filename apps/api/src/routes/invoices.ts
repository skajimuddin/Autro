import { Hono } from 'hono'
import { drizzle } from 'drizzle-orm/d1'
import { and, desc, eq, sql } from 'drizzle-orm'
import { 
  CreateInvoiceSchema, 
  UpdateInvoiceSchema, 
  MarkInvoicePaidSchema,
  AddInvoiceItemSchema,
  UpdateInvoiceItemSchema
} from '@workshop/shared'
import type { Env, Variables } from '@/env'
import { invoices, invoice_items, service_visits, vehicles, customers } from '@/db/schema'

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
    cursor: hasNextPage ? (cursor + limit).toString() : null
  })
})

// POST /invoices
invoicesRouter.post('/', async (c) => {
  const tenantId = c.get('tenantId')
  const body = await c.req.json().catch(() => null)
  const parsed = CreateInvoiceSchema.safeParse(body)
  
  if (!parsed.success) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message } }, 400)
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
  
  await db.transaction(async (tx) => {
    await tx.insert(invoices).values({
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
    })
    
    if (data.items.length > 0) {
      const itemsToInsert = data.items.map((item, index) => ({
        id: crypto.randomUUID(),
        invoice_id: invoiceId,
        description: item.description,
        amount: item.amount,
        quantity: item.quantity,
        sort_order: index,
      }))
      await tx.insert(invoice_items).values(itemsToInsert)
    }
  })
  
  return c.json({ id: invoiceId }, 201)
})

// GET /invoices/:id
invoicesRouter.get('/:id', async (c) => {
  const tenantId = c.get('tenantId')
  const invoiceId = c.req.param('id')
  
  const db = drizzle(c.env.DB)
  
  const invoice = await db.select().from(invoices)
    .where(and(eq(invoices.tenant_id, tenantId), eq(invoices.id, invoiceId)))
    .get()
    
  if (!invoice) {
    return c.json({ error: { code: 'NOT_FOUND', message: 'Invoice not found' } }, 404)
  }
  
  const items = await db.select().from(invoice_items)
    .where(eq(invoice_items.invoice_id, invoiceId))
    .orderBy(invoice_items.sort_order)
    .all()
    
  // Get vehicle details
  const visit = await db.select().from(service_visits).where(eq(service_visits.id, invoice.visit_id)).get()
  let vehicle = null
  let customer = null
  if (visit) {
    vehicle = await db.select().from(vehicles).where(eq(vehicles.id, visit.vehicle_id)).get()
    if (vehicle) {
      customer = await db.select().from(customers).where(eq(customers.id, vehicle.customer_id)).get()
    }
  }
  
  return c.json({ 
    ...invoice, 
    items, 
    registration_number: vehicle?.registration_number, 
    customer_name: customer?.name 
  })
})

// PATCH /invoices/:id
invoicesRouter.patch('/:id', async (c) => {
  const tenantId = c.get('tenantId')
  const invoiceId = c.req.param('id')
  const body = await c.req.json().catch(() => null)
  const parsed = UpdateInvoiceSchema.safeParse(body)
  
  if (!parsed.success) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message } }, 400)
  }
  
  const db = drizzle(c.env.DB)
  const now = new Date().toISOString()
  
  const currentInvoice = await db.select().from(invoices).where(and(eq(invoices.tenant_id, tenantId), eq(invoices.id, invoiceId))).get()
  if (!currentInvoice) return c.json({ error: { code: 'NOT_FOUND', message: 'Invoice not found' } }, 404)
  
  const items = await db.select().from(invoice_items).where(eq(invoice_items.invoice_id, invoiceId)).all()
  
  const dataToUpdate: any = { updated_at: now }
  if (parsed.data.discount_type !== undefined) dataToUpdate.discount_type = parsed.data.discount_type
  if (parsed.data.discount_value !== undefined) dataToUpdate.discount_value = parsed.data.discount_value
  if (parsed.data.tax_enabled !== undefined) dataToUpdate.tax_enabled = parsed.data.tax_enabled ? 1 : 0
  if (parsed.data.tax_percent !== undefined) dataToUpdate.tax_percent = parsed.data.tax_percent
  if (parsed.data.notes !== undefined) dataToUpdate.notes = parsed.data.notes
  
  // Recalculate frozen_total
  let subtotal = 0
  for (const item of items) {
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
  let afterDiscount = Math.max(0, subtotal - discount)
  
  const taxEnabled = dataToUpdate.tax_enabled ?? currentInvoice.tax_enabled
  const taxPercent = dataToUpdate.tax_percent ?? currentInvoice.tax_percent
  let tax = 0
  if (taxEnabled && taxPercent) {
    tax = afterDiscount * (taxPercent / 100)
  }
  dataToUpdate.frozen_total = afterDiscount + tax
  
  if (Object.keys(dataToUpdate).length > 1) { // more than just updated_at
    await db.update(invoices).set(dataToUpdate).where(eq(invoices.id, invoiceId))
  }
  
  const invoice = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).get()
  return c.json({ ...invoice, items })
})

// PATCH /invoices/:id/pay (mark as paid)
invoicesRouter.patch('/:id/pay', async (c) => {
  const tenantId = c.get('tenantId')
  const invoiceId = c.req.param('id')
  const body = await c.req.json().catch(() => null)
  const parsed = MarkInvoicePaidSchema.safeParse(body)
  
  if (!parsed.success) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message } }, 400)
  }
  
  const db = drizzle(c.env.DB)
  const now = new Date().toISOString()
  
  const currentInvoice = await db.select().from(invoices).where(and(eq(invoices.tenant_id, tenantId), eq(invoices.id, invoiceId))).get()
  if (!currentInvoice) return c.json({ error: { code: 'NOT_FOUND', message: 'Invoice not found' } }, 404)
  
  await db.update(invoices).set({
    payment_status: 'PAID',
    payment_method: parsed.data.payment_method,
    paid_at: now,
    updated_at: now,
  }).where(eq(invoices.id, invoiceId))
  
  // Automatically mark the associated service visit as DELIVERED if it isn't already
  await db.update(service_visits).set({
    status: 'DELIVERED',
    delivered_at: now,
    updated_at: now,
  }).where(and(
    eq(service_visits.id, currentInvoice.visit_id),
    eq(service_visits.tenant_id, tenantId)
  ))
  
  const invoice = await db.select().from(invoices).where(eq(invoices.id, invoiceId)).get()
  return c.json({ invoice })
})

// POST /invoices/:id/items
invoicesRouter.post('/:id/items', async (c) => {
  const tenantId = c.get('tenantId')
  const invoiceId = c.req.param('id')
  const body = await c.req.json().catch(() => null)
  const parsed = AddInvoiceItemSchema.safeParse(body)
  
  if (!parsed.success) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message } }, 400)
  }
  
  const db = drizzle(c.env.DB)
  const now = new Date().toISOString()
  
  const currentInvoice = await db.select().from(invoices).where(and(eq(invoices.tenant_id, tenantId), eq(invoices.id, invoiceId))).get()
  if (!currentInvoice) return c.json({ error: { code: 'NOT_FOUND', message: 'Invoice not found' } }, 404)
  
  const itemId = crypto.randomUUID()
  const maxResult = await db.select({ max: sql<number>`max(${invoice_items.sort_order})` }).from(invoice_items).where(eq(invoice_items.invoice_id, invoiceId)).get()
  const nextOrder = (maxResult?.max ?? -1) + 1
  
  await db.transaction(async (tx) => {
    await tx.insert(invoice_items).values({
      id: itemId,
      invoice_id: invoiceId,
      description: parsed.data.description,
      amount: parsed.data.amount,
      quantity: parsed.data.quantity,
      sort_order: nextOrder,
    })
    
    // Recalculate total
    const allItems = await tx.select().from(invoice_items).where(eq(invoice_items.invoice_id, invoiceId)).all()
    let subtotal = 0
    for (const item of allItems) subtotal += item.amount * item.quantity
    
    const dt = currentInvoice.discount_type
    const dv = currentInvoice.discount_value
    let discount = 0
    if (dt === 'FLAT' && dv) discount = dv
    else if (dt === 'PERCENT' && dv) discount = subtotal * (dv / 100)
    
    let afterDiscount = Math.max(0, subtotal - discount)
    let tax = 0
    if (currentInvoice.tax_enabled && currentInvoice.tax_percent) tax = afterDiscount * (currentInvoice.tax_percent / 100)
    
    await tx.update(invoices).set({ frozen_total: afterDiscount + tax, updated_at: now }).where(eq(invoices.id, invoiceId))
  })
  
  const item = await db.select().from(invoice_items).where(eq(invoice_items.id, itemId)).get()
  return c.json({ item }, 201)
})

// PATCH /invoices/:id/items/:itemId
invoicesRouter.patch('/:id/items/:itemId', async (c) => {
  const tenantId = c.get('tenantId')
  const invoiceId = c.req.param('id')
  const itemId = c.req.param('itemId')
  const body = await c.req.json().catch(() => null)
  const parsed = UpdateInvoiceItemSchema.safeParse(body)
  
  if (!parsed.success) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message } }, 400)
  }
  
  const db = drizzle(c.env.DB)
  const now = new Date().toISOString()
  
  const currentInvoice = await db.select().from(invoices).where(and(eq(invoices.tenant_id, tenantId), eq(invoices.id, invoiceId))).get()
  if (!currentInvoice) return c.json({ error: { code: 'NOT_FOUND', message: 'Invoice not found' } }, 404)
  
  if (Object.keys(parsed.data).length > 0) {
    await db.transaction(async (tx) => {
      await tx.update(invoice_items).set(parsed.data).where(and(eq(invoice_items.invoice_id, invoiceId), eq(invoice_items.id, itemId)))
      
      const allItems = await tx.select().from(invoice_items).where(eq(invoice_items.invoice_id, invoiceId)).all()
      let subtotal = 0
      for (const item of allItems) subtotal += item.amount * item.quantity
      
      const dt = currentInvoice.discount_type
      const dv = currentInvoice.discount_value
      let discount = 0
      if (dt === 'FLAT' && dv) discount = dv
      else if (dt === 'PERCENT' && dv) discount = subtotal * (dv / 100)
      
      let afterDiscount = Math.max(0, subtotal - discount)
      let tax = 0
      if (currentInvoice.tax_enabled && currentInvoice.tax_percent) tax = afterDiscount * (currentInvoice.tax_percent / 100)
      
      await tx.update(invoices).set({ frozen_total: afterDiscount + tax, updated_at: now }).where(eq(invoices.id, invoiceId))
    })
  }
  
  const item = await db.select().from(invoice_items).where(eq(invoice_items.id, itemId)).get()
  return c.json({ item })
})

// DELETE /invoices/:id/items/:itemId
invoicesRouter.delete('/:id/items/:itemId', async (c) => {
  const tenantId = c.get('tenantId')
  const invoiceId = c.req.param('id')
  const itemId = c.req.param('itemId')
  
  const db = drizzle(c.env.DB)
  const now = new Date().toISOString()
  
  const currentInvoice = await db.select().from(invoices).where(and(eq(invoices.tenant_id, tenantId), eq(invoices.id, invoiceId))).get()
  if (!currentInvoice) return c.json({ error: { code: 'NOT_FOUND', message: 'Invoice not found' } }, 404)
  
  await db.transaction(async (tx) => {
    await tx.delete(invoice_items).where(and(eq(invoice_items.invoice_id, invoiceId), eq(invoice_items.id, itemId)))
    
    const allItems = await tx.select().from(invoice_items).where(eq(invoice_items.invoice_id, invoiceId)).all()
    let subtotal = 0
    for (const item of allItems) subtotal += item.amount * item.quantity
    
    const dt = currentInvoice.discount_type
    const dv = currentInvoice.discount_value
    let discount = 0
    if (dt === 'FLAT' && dv) discount = dv
    else if (dt === 'PERCENT' && dv) discount = subtotal * (dv / 100)
    
    let afterDiscount = Math.max(0, subtotal - discount)
    let tax = 0
    if (currentInvoice.tax_enabled && currentInvoice.tax_percent) tax = afterDiscount * (currentInvoice.tax_percent / 100)
    
    await tx.update(invoices).set({ frozen_total: afterDiscount + tax, updated_at: now }).where(eq(invoices.id, invoiceId))
  })
    
  return c.json({ success: true })
})

export default invoicesRouter
