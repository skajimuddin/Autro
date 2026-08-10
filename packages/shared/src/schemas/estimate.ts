import { z } from 'zod'

/**
 * Single estimate line item.
 * Matches estimate_items table: description + amount + quantity + sort_order.
 */
export const EstimateItemSchema = z.object({
  description: z.string().min(1, 'Description is required').max(200),
  amount: z.number().min(0, 'Amount must be non-negative'),
  quantity: z.number().int().min(1).default(1),
  sort_order: z.number().int().min(0).default(0),
})

/**
 * POST /estimates — create estimate with items.
 * Matches estimates table columns.
 */
export const CreateEstimateSchema = z.object({
  visit_id: z.string().uuid('visit_id must be a UUID'),
  items: z.array(EstimateItemSchema).min(1, 'At least one item is required'),
  discount_type: z.enum(['FLAT', 'PERCENT']).nullable().default(null),
  discount_value: z.number().min(0).default(0),
  tax_enabled: z.boolean().default(false),
  tax_percent: z.number().min(0).max(100).default(0),
  notes: z.string().max(500).default(''),
})

/**
 * PATCH /estimates/:id — update estimate metadata (discount, tax, notes).
 * Items are managed via separate endpoints.
 * All fields optional.
 */
export const UpdateEstimateSchema = z.object({
  discount_type: z.enum(['FLAT', 'PERCENT']).nullable().optional(),
  discount_value: z.number().min(0).optional(),
  tax_enabled: z.boolean().optional(),
  tax_percent: z.number().min(0).max(100).optional(),
  notes: z.string().max(500).optional(),
  status: z.enum(['DRAFT', 'SENT', 'CONVERTED']).optional(),
})

/**
 * POST /estimates/:id/items — add a single item to an estimate.
 */
export const AddEstimateItemSchema = EstimateItemSchema

/**
 * PATCH /estimates/:id/items/:itemId — update a single estimate item.
 * All fields optional.
 */
export const UpdateEstimateItemSchema = z.object({
  description: z.string().min(1).max(200).optional(),
  amount: z.number().min(0).optional(),
  quantity: z.number().int().min(1).optional(),
  sort_order: z.number().int().min(0).optional(),
})
