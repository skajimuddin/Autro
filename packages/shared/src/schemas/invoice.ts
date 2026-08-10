import { z } from 'zod'

/**
 * Single invoice line item.
 * Matches invoice_items table: description + amount + quantity + sort_order.
 * Copied from estimate_items when importing from estimate — then independent.
 */
export const InvoiceItemSchema = z.object({
  description: z.string().min(1, 'Description is required').max(200),
  amount: z.number().min(0, 'Amount must be non-negative'),
  quantity: z.number().int().min(1).default(1),
  sort_order: z.number().int().min(0).default(0),
})

/**
 * POST /invoices — create a fresh invoice (not from estimate).
 * Matches invoices table columns.
 */
export const CreateInvoiceSchema = z.object({
  visit_id: z.string().uuid('visit_id must be a UUID'),
  items: z.array(InvoiceItemSchema).min(1, 'At least one item is required'),
  discount_type: z.enum(['FLAT', 'PERCENT']).nullable().default(null),
  discount_value: z.number().min(0).default(0),
  tax_enabled: z.boolean().default(false),
  tax_percent: z.number().min(0).max(100).default(0),
  notes: z.string().max(500).default(''),
})

/**
 * PATCH /invoices/:id — update invoice details/items.
 * All fields optional.
 */
export const UpdateInvoiceSchema = z.object({
  discount_type: z.enum(['FLAT', 'PERCENT']).nullable().optional(),
  discount_value: z.number().min(0).optional(),
  tax_enabled: z.boolean().optional(),
  tax_percent: z.number().min(0).max(100).optional(),
  notes: z.string().max(500).optional(),
})

/**
 * PATCH /invoices/:id/pay — mark invoice as paid.
 * Freezes frozen_total, sets payment_method, sets paid_at.
 */
export const MarkInvoicePaidSchema = z.object({
  payment_method: z.enum(['CASH', 'UPI', 'CARD', 'OTHER']),
})

/**
 * POST /invoices/from-estimate/:estimateId — create invoice by importing estimate.
 * No body required — all data is copied from the estimate server-side.
 */
export const CreateInvoiceFromEstimateSchema = z.object({}).strict()

/**
 * POST /invoices/:id/items — add a single item to an invoice.
 */
export const AddInvoiceItemSchema = InvoiceItemSchema

/**
 * PATCH /invoices/:id/items/:itemId — update a single invoice item.
 * All fields optional.
 */
export const UpdateInvoiceItemSchema = z.object({
  description: z.string().min(1).max(200).optional(),
  amount: z.number().min(0).optional(),
  quantity: z.number().int().min(1).optional(),
  sort_order: z.number().int().min(0).optional(),
})
