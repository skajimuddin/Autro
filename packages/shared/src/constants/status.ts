/**
 * Service visit statuses — represents a vehicle's current state in the garage.
 * Progression: NEW → REPAIRING → READY → DELIVERED
 */
export const VISIT_STATUS = {
  NEW: 'NEW',
  REPAIRING: 'REPAIRING',
  READY: 'READY',
  DELIVERED: 'DELIVERED',
} as const

export type VisitStatus = (typeof VISIT_STATUS)[keyof typeof VISIT_STATUS]

/**
 * Estimate statuses.
 * - DRAFT: Being edited
 * - SENT: Shared with customer
 * - CONVERTED: Turned into an invoice
 */
export const ESTIMATE_STATUS = {
  DRAFT: 'DRAFT',
  SENT: 'SENT',
  CONVERTED: 'CONVERTED',
} as const

export type EstimateStatus = (typeof ESTIMATE_STATUS)[keyof typeof ESTIMATE_STATUS]

/**
 * Invoice payment statuses.
 */
export const PAYMENT_STATUS = {
  UNPAID: 'UNPAID',
  PAID: 'PAID',
} as const

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS]

/**
 * Payment methods accepted at the garage.
 */
export const PAYMENT_METHOD = {
  CASH: 'CASH',
  UPI: 'UPI',
  CARD: 'CARD',
  OTHER: 'OTHER',
} as const

export type PaymentMethod = (typeof PAYMENT_METHOD)[keyof typeof PAYMENT_METHOD]

/**
 * Discount types for estimates and invoices.
 */
export const DISCOUNT_TYPE = {
  FLAT: 'FLAT',
  PERCENT: 'PERCENT',
} as const

export type DiscountType = (typeof DISCOUNT_TYPE)[keyof typeof DISCOUNT_TYPE]

/**
 * Staff invite statuses.
 */
export const INVITE_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REVOKED: 'REVOKED',
} as const

export type InviteStatus = (typeof INVITE_STATUS)[keyof typeof INVITE_STATUS]

/**
 * Attendance log statuses.
 */
export const ATTENDANCE_STATUS = {
  PRESENT: 'PRESENT',
  ABSENT: 'ABSENT',
} as const

export type AttendanceStatus = (typeof ATTENDANCE_STATUS)[keyof typeof ATTENDANCE_STATUS]
