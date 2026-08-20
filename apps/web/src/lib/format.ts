// Formatting every screen shares.
//
// These lived as private copies in the dashboard, the vehicle list and the
// vehicle detail page. Three copies of "how many days has this been in the
// shop" is three chances for the dashboard to say 5 days while the list says
// 6 — so they are written once here and imported everywhere.
import type { VisitStatus } from '@autro/shared'

/** Display order == the real repair progression. */
export const STAGE_ORDER: VisitStatus[] = ['NEW', 'REPAIRING', 'READY', 'DELIVERED']

/** How each stage is written wherever it appears. */
export const STAGE_LABEL: Record<VisitStatus, string> = {
  NEW: 'New',
  REPAIRING: 'Repairing',
  READY: 'Ready',
  DELIVERED: 'Delivered',
}

/** Rupees, grouped the Indian way (₹1,20,400) and never with paise. */
export function inr(amount: number): string {
  return `₹${Math.round(amount).toLocaleString('en-IN')}`
}

/** A job sitting this long without handover is worth surfacing. */
export const STALE_AFTER_DAYS = 5

/**
 * Whole days since a visit opened, counted in calendar days rather than 24h
 * blocks — a car dropped off at 6pm yesterday reads as "1 day", not "Today".
 * Null when there is no open visit or the timestamp is unreadable.
 */
export function daysInShop(visitStartedAt: string | null): number | null {
  if (!visitStartedAt) return null
  const started = new Date(visitStartedAt)
  if (Number.isNaN(started.getTime())) return null

  const midnight = (d: Date): number =>
    new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()

  return Math.max(0, Math.round((midnight(new Date()) - midnight(started)) / 86_400_000))
}

/** "Today" / "1 day" / "6 days" — the label for a daysInShop() count. */
export function durationLabel(days: number): string {
  if (days === 0) return 'Today'
  return days === 1 ? '1 day' : `${days} days`
}

/** "14 Aug" — for dates inside the current context, where the year is noise. */
export function formatDayMonth(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

/** "14 Aug 2026" — for dates far enough back that the year matters. */
export function formatFullDate(iso: string | null): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}
