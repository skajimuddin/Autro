import { z } from 'zod'

/**
 * What an owner can customise on their invoice/estimate PDFs.
 *
 * Every field is presentational, not structural — a document's numbers
 * always come from the estimate/invoice rows themselves and are never
 * affected by this. This is deliberately narrow: it toggles what appears
 * and a few strings/colours, not a layout engine. A garage that wants a
 * genuinely different document design is out of scope for a settings form.
 */
export const PdfTemplateSchema = z.object({
  /** Print the garage logo in the document header, when one is uploaded. */
  show_logo: z.boolean(),
  /** Print the garage's saved address under its name/phone. */
  show_address: z.boolean(),
  /** Number each line item (1, 2, 3…) in its own column. */
  show_item_numbers: z.boolean(),
  /** Short line printed under the totals — e.g. GSTIN, a UPI ID, a thank-you. */
  footer_note: z.string().max(200).optional(),
  /** Longer block printed at the very bottom — warranty/return terms etc. */
  terms_and_conditions: z.string().max(1000).optional(),
  /** Hex colour for the document title / totals accent. Empty = app brand colour. */
  accent_color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, 'Must be a hex colour like #3560c0')
    .optional(),
  /** Prefix before the short reference on invoices, e.g. "INV-4F2A9B1C". */
  invoice_prefix: z.string().trim().max(10).optional(),
  /** Same, for quotations generated from an estimate. */
  estimate_prefix: z.string().trim().max(10).optional(),
})

export type PdfTemplate = z.infer<typeof PdfTemplateSchema>

export const DEFAULT_PDF_TEMPLATE: PdfTemplate = {
  show_logo: true,
  show_address: true,
  show_item_numbers: false,
  footer_note: '',
  terms_and_conditions: '',
  accent_color: '',
  invoice_prefix: 'INV',
  estimate_prefix: 'EST',
}
