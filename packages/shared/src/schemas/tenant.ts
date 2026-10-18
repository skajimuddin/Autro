import { z } from 'zod'
import { SALARY_BASIS_VALUES } from '../constants/payroll'
import { PdfTemplateSchema } from './pdf-template'

/** 0 = Sunday … 6 = Saturday, at least one day open. */
const WorkDaysSchema = z.array(z.number().int().min(0).max(6)).min(1).max(7)

/** 15-character GSTIN: 2-digit state, 10-char PAN, entity digit, 'Z', checksum. */
export const GSTIN_REGEX = /^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/

/**
 * POST /tenants — create garage (onboarding)
 * Matches columns in the `tenants` table.
 */
export const CreateTenantSchema = z.object({
  name: z.string().min(1, 'Garage name is required').max(100),
  phone: z
    .string()
    .min(10, 'Phone must be at least 10 digits')
    .max(15)
    .regex(/^\d+$/, 'Phone must contain only digits'),
  address: z.string().max(300).optional(),
  logo_url: z.string().url().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
})

/**
 * PATCH /tenants/:id — update garage (settings page)
 * All fields optional — only send what changed.
 */
export const UpdateTenantSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  phone: z.string().min(10).max(15).regex(/^\d+$/, 'Phone must contain only digits').optional(),
  address: z.string().max(300).optional(),
  logo_url: z.string().url().nullable().optional(),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  gps_radius_meters: z.number().int().min(10).max(5000).optional(),
  /** Weekly-off pattern used to compute a month's working-day count. */
  work_days: WorkDaysSchema.optional(),
  /** How present_days/monthly_salary turns into a payout — see constants/payroll.ts. */
  salary_basis: z.enum(SALARY_BASIS_VALUES).optional(),
  /** Only meaningful when salary_basis is FIXED_DIVISOR. Null clears it. */
  salary_fixed_divisor: z.number().int().min(1).max(31).nullable().optional(),
  /** Invoice/estimate PDF customisation — see schemas/pdf-template.ts. */
  pdf_template: PdfTemplateSchema.partial().optional(),
  /** Bill GST on invoices/estimates. Needs a GSTIN — enforced by the route. */
  gst_enabled: z.boolean().optional(),
  gstin: z.string().trim().toUpperCase().regex(GSTIN_REGEX, 'Enter a valid 15-character GSTIN').nullable().optional(),
  /** Default GST rate pre-filled on new bills. */
  gst_percent: z.number().min(0).max(100).optional(),
})
