/**
 * The one place a bill's arithmetic lives — the editors, the PDFs and the
 * API's frozen_total all call this, so the figure on screen, on paper and in
 * the database cannot disagree.
 *
 * Order is the Indian-invoice convention: discount comes off the subtotal,
 * GST applies to what is left (the taxable value), and the grand total is
 * rounded to the nearest rupee with the difference shown as "Round off".
 */
export interface BillInput {
  items: { amount: number; quantity: number }[]
  discountType: 'FLAT' | 'PERCENT' | null
  discountValue: number
  taxEnabled: boolean
  taxPercent: number
}

export interface BillTotals {
  subtotal: number
  discount: number
  /** Subtotal less discount — the value tax is charged on. */
  taxable: number
  tax: number
  /** Intra-state GST splits the tax evenly; cgst + sgst === tax exactly. */
  cgst: number
  sgst: number
  roundOff: number
  /** Whole rupees. */
  total: number
}

const round2 = (n: number): number => Math.round(n * 100) / 100

export function computeBill(input: BillInput): BillTotals {
  const subtotal = round2(input.items.reduce((sum, i) => sum + i.amount * i.quantity, 0))

  let discount = 0
  if (input.discountType === 'FLAT') discount = input.discountValue
  else if (input.discountType === 'PERCENT') discount = (subtotal * input.discountValue) / 100
  discount = round2(Math.min(discount, subtotal))

  const taxable = round2(subtotal - discount)
  const tax = input.taxEnabled ? round2((taxable * input.taxPercent) / 100) : 0
  const cgst = round2(tax / 2)
  const sgst = round2(tax - cgst)

  const exact = taxable + tax
  const total = Math.round(exact)

  return { subtotal, discount, taxable, tax, cgst, sgst, roundOff: round2(total - exact), total }
}
