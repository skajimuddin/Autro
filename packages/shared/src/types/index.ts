import type { z } from 'zod';

// ── Auth ─────────────────────────────────────────────────────────────────────
import type { AuthResponseSchema, RefreshTokenSchema } from '../schemas/auth.ts';

export type AuthResponse = z.infer<typeof AuthResponseSchema>;
export type RefreshToken = z.infer<typeof RefreshTokenSchema>;

// ── Tenant ───────────────────────────────────────────────────────────────────
import type { CreateTenantSchema, UpdateTenantSchema } from '../schemas/tenant.ts';

export type CreateTenant = z.infer<typeof CreateTenantSchema>;
export type UpdateTenant = z.infer<typeof UpdateTenantSchema>;

// ── Vehicle ──────────────────────────────────────────────────────────────────
import type {
  CreateVehicleSchema,
  UpdateVehicleSchema,
  CreateVisitSchema,
  UpdateVisitStatusSchema,
  AddVehicleImageSchema,
} from '../schemas/vehicle.ts';

export type CreateVehicle = z.infer<typeof CreateVehicleSchema>;
export type UpdateVehicle = z.infer<typeof UpdateVehicleSchema>;
export type CreateVisit = z.infer<typeof CreateVisitSchema>;
export type UpdateVisitStatus = z.infer<typeof UpdateVisitStatusSchema>;
export type AddVehicleImage = z.infer<typeof AddVehicleImageSchema>;

// ── Customer ─────────────────────────────────────────────────────────────────
import type { CustomerSearchSchema } from '../schemas/customer.ts';

export type CustomerSearch = z.infer<typeof CustomerSearchSchema>;

// ── Estimate ─────────────────────────────────────────────────────────────────
import type {
  EstimateItemSchema,
  CreateEstimateSchema,
  UpdateEstimateSchema,
  AddEstimateItemSchema,
  UpdateEstimateItemSchema,
} from '../schemas/estimate.ts';

export type EstimateItem = z.infer<typeof EstimateItemSchema>;
export type CreateEstimate = z.infer<typeof CreateEstimateSchema>;
export type UpdateEstimate = z.infer<typeof UpdateEstimateSchema>;
export type AddEstimateItem = z.infer<typeof AddEstimateItemSchema>;
export type UpdateEstimateItem = z.infer<typeof UpdateEstimateItemSchema>;

// ── Invoice ──────────────────────────────────────────────────────────────────
import type {
  InvoiceItemSchema,
  CreateInvoiceSchema,
  UpdateInvoiceSchema,
  MarkInvoicePaidSchema,
  AddInvoiceItemSchema,
  UpdateInvoiceItemSchema,
} from '../schemas/invoice.ts';

export type InvoiceItem = z.infer<typeof InvoiceItemSchema>;
export type CreateInvoice = z.infer<typeof CreateInvoiceSchema>;
export type UpdateInvoice = z.infer<typeof UpdateInvoiceSchema>;
export type MarkInvoicePaid = z.infer<typeof MarkInvoicePaidSchema>;
export type AddInvoiceItem = z.infer<typeof AddInvoiceItemSchema>;
export type UpdateInvoiceItem = z.infer<typeof UpdateInvoiceItemSchema>;

// ── Staff ────────────────────────────────────────────────────────────────────
import type { CreateStaffInviteSchema, UpdateStaffSchema } from '../schemas/staff.ts';

export type CreateStaffInvite = z.infer<typeof CreateStaffInviteSchema>;
export type UpdateStaff = z.infer<typeof UpdateStaffSchema>;

// ── Attendance ───────────────────────────────────────────────────────────────
import type {
  CheckInSchema,
  CheckOutSchema,
  MonthlyAttendanceQuerySchema,
} from '../schemas/attendance.ts';

export type CheckIn = z.infer<typeof CheckInSchema>;
export type CheckOut = z.infer<typeof CheckOutSchema>;
export type MonthlyAttendanceQuery = z.infer<typeof MonthlyAttendanceQuerySchema>;

// ── Constants re-exports ─────────────────────────────────────────────────────
export type { Role } from '../constants/roles.ts';
export type {
  VisitStatus,
  EstimateStatus,
  PaymentStatus,
  PaymentMethod,
  DiscountType,
  InviteStatus,
  AttendanceStatus,
} from '../constants/status.ts';
