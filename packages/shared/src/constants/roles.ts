/**
 * User roles within a tenant (garage).
 * - OWNER: Full access — manages vehicles, estimates, invoices, staff
 * - STAFF: Attendance only — check-in/out via QR scan, no garage management
 */
export const ROLES = {
  OWNER: 'OWNER',
  STAFF: 'STAFF',
} as const

export type Role = (typeof ROLES)[keyof typeof ROLES]
