/**
 * Salary basis — how a monthly figure turns into a day rate.
 *
 * This exists because "days in the month" is ambiguous and workshops don't
 * agree on it: some pay per actual working day (a 28-day February costs
 * less to staff than a 31-day month), some want every calendar day treated
 * as payable (the old, implicit behaviour here), and Indian payroll commonly
 * uses a fixed divisor (26 or 30) so a salary doesn't shrink just because a
 * month happens to be short. The owner picks which one matches how they
 * actually run payroll — the app does not decide this for them.
 */
export const SALARY_BASIS = {
  /** present_days / (days in the month that fall on a work_days weekday). */
  ACTUAL_WORKING_DAYS: 'ACTUAL_WORKING_DAYS',
  /** present_days / (every calendar day in the month). Ignores weekly offs. */
  CALENDAR_DAYS: 'CALENDAR_DAYS',
  /** present_days / salary_fixed_divisor, e.g. always ÷26 or ÷30. */
  FIXED_DIVISOR: 'FIXED_DIVISOR',
} as const

export type SalaryBasis = (typeof SALARY_BASIS)[keyof typeof SALARY_BASIS]

export const SALARY_BASIS_VALUES = Object.values(SALARY_BASIS) as [SalaryBasis, ...SalaryBasis[]]

/** Sunday = 0 … Saturday = 6 (JS `Date#getDay()` convention). */
export const WEEKDAY_LABEL: Record<number, string> = {
  0: 'Sunday',
  1: 'Monday',
  2: 'Tuesday',
  3: 'Wednesday',
  4: 'Thursday',
  5: 'Friday',
  6: 'Saturday',
}

/** Default weekly-off pattern: closed Sundays, open Mon–Sat — the common
 *  case for a small Indian garage, and what every tenant effectively had
 *  before this was configurable (attendance/staff routes counted every
 *  calendar day as a working day, which rounds to the same total only
 *  coincidentally). Owners with a different week change this in Settings. */
export const DEFAULT_WORK_DAYS: number[] = [1, 2, 3, 4, 5, 6]

/**
 * How many "working days" a given month counts as — the denominator in
 * `(present_days / workingDays) * monthly_salary`.
 *
 * Pure and deterministic so it can run identically on the API (source of
 * truth) and, if a settings screen wants to preview the number, on the
 * client.
 */
export function workingDaysInMonth(
  year: number,
  month1to12: number,
  workDays: number[],
  basis: SalaryBasis,
  fixedDivisor: number | null,
): number {
  const daysInMonth = new Date(year, month1to12, 0).getDate()

  if (basis === 'FIXED_DIVISOR') {
    return fixedDivisor && fixedDivisor > 0 ? fixedDivisor : 30
  }
  if (basis === 'CALENDAR_DAYS') {
    return daysInMonth
  }

  // ACTUAL_WORKING_DAYS
  const openWeekdays = new Set(workDays.length > 0 ? workDays : DEFAULT_WORK_DAYS)
  let count = 0
  for (let day = 1; day <= daysInMonth; day++) {
    if (openWeekdays.has(new Date(year, month1to12 - 1, day).getDay())) count++
  }
  // A month that is entirely off (misconfiguration) would divide by zero
  // downstream — fall back to the calendar-day count rather than produce an
  // infinite or NaN salary.
  return count > 0 ? count : daysInMonth
}
