import type { z } from 'zod'

// ── Auth ─────────────────────────────────────────────────────────────────────
import type { AuthResponseSchema, RefreshTokenSchema } from '../schemas/auth'

export type AuthResponse = z.infer<typeof AuthResponseSchema>
export type RefreshToken = z.infer<typeof RefreshTokenSchema>

// ── Tenant ───────────────────────────────────────────────────────────────────
import type { CreateTenantSchema, UpdateTenantSchema } from '../schemas/tenant'

export type CreateTenant = z.infer<typeof CreateTenantSchema>
export type UpdateTenant = z.infer<typeof UpdateTenantSchema>

// ── Vehicle ──────────────────────────────────────────────────────────────────
import type {
  CreateVehicleSchema,
  UpdateVisitStatusSchema,
  AddVehicleImageSchema,
} from '../schemas/vehicle'

/** Post-parse shape: `registration_number` is upper-cased and `image_urls`
 *  defaulted, so this is what a handler receives, not what a client sends. */
export type CreateVehicle = z.infer<typeof CreateVehicleSchema>
export type CreateVehicleInput = z.input<typeof CreateVehicleSchema>
export type UpdateVisitStatus = z.infer<typeof UpdateVisitStatusSchema>
export type AddVehicleImage = z.infer<typeof AddVehicleImageSchema>

// ── Estimate ─────────────────────────────────────────────────────────────────
import type {
  EstimateItemSchema,
  CreateEstimateSchema,
  UpdateEstimateSchema,
  AddEstimateItemSchema,
  UpdateEstimateItemSchema,
} from '../schemas/estimate'

export type EstimateItem = z.infer<typeof EstimateItemSchema>
export type CreateEstimate = z.infer<typeof CreateEstimateSchema>
export type UpdateEstimate = z.infer<typeof UpdateEstimateSchema>
export type AddEstimateItem = z.infer<typeof AddEstimateItemSchema>
export type UpdateEstimateItem = z.infer<typeof UpdateEstimateItemSchema>

// ── Invoice ──────────────────────────────────────────────────────────────────
import type {
  InvoiceItemSchema,
  CreateInvoiceSchema,
  UpdateInvoiceSchema,
  MarkInvoicePaidSchema,
  AddInvoiceItemSchema,
  UpdateInvoiceItemSchema,
} from '../schemas/invoice'

export type InvoiceItem = z.infer<typeof InvoiceItemSchema>
export type CreateInvoice = z.infer<typeof CreateInvoiceSchema>
export type UpdateInvoice = z.infer<typeof UpdateInvoiceSchema>
export type MarkInvoicePaid = z.infer<typeof MarkInvoicePaidSchema>
export type AddInvoiceItem = z.infer<typeof AddInvoiceItemSchema>
export type UpdateInvoiceItem = z.infer<typeof UpdateInvoiceItemSchema>

// ── Staff ────────────────────────────────────────────────────────────────────
import type { CreateStaffInviteSchema, UpdateStaffSchema } from '../schemas/staff'

export type CreateStaffInvite = z.infer<typeof CreateStaffInviteSchema>
export type UpdateStaff = z.infer<typeof UpdateStaffSchema>

// ── Attendance ───────────────────────────────────────────────────────────────
import type {
  CheckInSchema,
  CheckOutSchema,
  MonthlyAttendanceQuerySchema,
} from '../schemas/attendance'

export type CheckIn = z.infer<typeof CheckInSchema>
export type CheckOut = z.infer<typeof CheckOutSchema>
export type MonthlyAttendanceQuery = z.infer<typeof MonthlyAttendanceQuerySchema>

// ── Constants re-exports ─────────────────────────────────────────────────────
export type { Role } from '../constants/roles'
export type {
  VisitStatus,
  EstimateStatus,
  PaymentStatus,
  PaymentMethod,
  DiscountType,
  InviteStatus,
  AttendanceStatus,
} from '../constants/status'
