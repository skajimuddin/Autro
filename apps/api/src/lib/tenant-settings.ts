// Deserialisation for the tenant columns stored as JSON text — work_days and
// pdf_template. Both are optional at the DB layer (NULL until an owner opens
// the relevant settings page) and default at the application layer instead,
// so every reader agrees on what "not configured yet" means rather than each
// route inventing its own fallback.
import { DEFAULT_WORK_DAYS, DEFAULT_PDF_TEMPLATE, type PdfTemplate, type SalaryBasis } from '@autro/shared'

export function parseWorkDays(raw: string | null): number[] {
  if (!raw) return DEFAULT_WORK_DAYS
  try {
    const parsed: unknown = JSON.parse(raw)
    if (
      Array.isArray(parsed) &&
      parsed.length > 0 &&
      parsed.every((n) => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n <= 6)
    ) {
      return parsed as number[]
    }
  } catch {
    // Malformed JSON — fall through to the default below.
  }
  return DEFAULT_WORK_DAYS
}

export function parseSalaryBasis(raw: string | null): SalaryBasis {
  return raw === 'CALENDAR_DAYS' || raw === 'FIXED_DIVISOR' ? raw : 'ACTUAL_WORKING_DAYS'
}

export function parsePdfTemplate(raw: string | null): PdfTemplate {
  if (!raw) return DEFAULT_PDF_TEMPLATE
  try {
    const parsed = JSON.parse(raw) as Partial<PdfTemplate>
    return { ...DEFAULT_PDF_TEMPLATE, ...parsed }
  } catch {
    return DEFAULT_PDF_TEMPLATE
  }
}

/**
 * A tenant row straight off `db.select().from(tenants)`, with the JSON
 * columns decoded and defaulted — what every route that returns a tenant to
 * the frontend should send instead of the raw row.
 */
export function serializeTenant<T extends { work_days: string | null; salary_basis: string | null; salary_fixed_divisor: number | null; pdf_template: string | null }>(
  row: T,
): Omit<T, 'work_days' | 'salary_basis' | 'pdf_template'> & {
  work_days: number[]
  salary_basis: SalaryBasis
  pdf_template: PdfTemplate
} {
  return {
    ...row,
    work_days: parseWorkDays(row.work_days),
    salary_basis: parseSalaryBasis(row.salary_basis),
    pdf_template: parsePdfTemplate(row.pdf_template),
  }
}
