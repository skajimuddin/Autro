// Task 4.6 — PDF templates + generation
//
// Client-side invoice PDF, per 01-tech-stack.md (no server-side rendering cost).
//
// Two deliberate choices:
//
// 1. `@react-pdf/renderer` is ~1 MB, so it is behind a dynamic `import()`. Vite
//    emits it as a separate chunk that only downloads when a user actually taps
//    PDF. A static import would roughly double the initial bundle.
//
// 2. Amounts are prefixed "Rs." rather than "₹". @react-pdf's built-in Helvetica
//    has no glyph for U+20B9, so a literal ₹ renders as a blank box in the
//    output. Fixing that properly means Font.register()-ing a .ttf that covers
//    the rupee sign (the app's Inter is served as woff2, which @react-pdf cannot
//    read) and fetching it at runtime. "Rs." is unambiguous, offline-safe, and
//    standard on Indian invoices. The ₹ glyph is still used everywhere in the UI.
//
// This file uses createElement rather than JSX because 02-folder-structure.md
// specifies `lib/pdf.ts`, and a .ts file cannot contain JSX.
import { createElement as el } from 'react'

// ── Public data shape ─────────────────────────────────────────────────────────

export interface InvoicePdfItem {
  description: string
  amount: number
  quantity: number
}

export interface InvoicePdfData {
  /** Short human-facing reference, e.g. first 8 chars of the invoice id */
  reference: string
  /** ISO date string for the invoice date */
  date: string
  garage: {
    name: string
    phone: string
    address: string | null
  }
  customer: {
    name: string
    phone: string
    registration: string
  }
  items: InvoicePdfItem[]
  subtotal: number
  taxEnabled: boolean
  taxPercent: number
  taxAmount: number
  discountAmount: number
  total: number
  paymentStatus: 'PAID' | 'UNPAID'
  notes: string | null
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function money(value: number): string {
  return `Rs. ${value.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

// ── Generation ────────────────────────────────────────────────────────────────

/**
 * Build the invoice PDF and hand it to the browser as a download.
 *
 * Throws if PDF generation fails so the caller can surface a toast.
 */
export async function downloadInvoicePdf(data: InvoicePdfData): Promise<void> {
  const { pdf, Document, Page, Text, View, StyleSheet } = await import('@react-pdf/renderer')

  const s = StyleSheet.create({
    page: {
      paddingTop: 36,
      paddingBottom: 48,
      paddingHorizontal: 36,
      fontSize: 10,
      color: '#0f172a',
      fontFamily: 'Helvetica',
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      borderBottomWidth: 1,
      borderBottomColor: '#cbd5e1',
      paddingBottom: 12,
      marginBottom: 16,
    },
    garageName: { fontSize: 18, fontFamily: 'Helvetica-Bold' },
    muted: { color: '#64748b', marginTop: 2 },
    docTitle: {
      fontSize: 14,
      fontFamily: 'Helvetica-Bold',
      textAlign: 'right',
    },
    statusPaid: {
      color: '#059669',
      fontFamily: 'Helvetica-Bold',
      marginTop: 4,
      textAlign: 'right',
    },
    statusUnpaid: {
      color: '#dc2626',
      fontFamily: 'Helvetica-Bold',
      marginTop: 4,
      textAlign: 'right',
    },
    section: { marginBottom: 16 },
    sectionLabel: {
      fontSize: 8,
      color: '#64748b',
      fontFamily: 'Helvetica-Bold',
      letterSpacing: 1,
      marginBottom: 4,
    },
    tableHead: {
      flexDirection: 'row',
      backgroundColor: '#f1f5f9',
      paddingVertical: 6,
      paddingHorizontal: 8,
      fontFamily: 'Helvetica-Bold',
      fontSize: 9,
    },
    row: {
      flexDirection: 'row',
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderBottomWidth: 1,
      borderBottomColor: '#e2e8f0',
    },
    cDesc: { flex: 1 },
    cQty: { width: 40, textAlign: 'right' },
    cRate: { width: 80, textAlign: 'right' },
    cAmt: { width: 90, textAlign: 'right' },
    totalsBlock: { marginTop: 12, marginLeft: 'auto', width: 230 },
    totalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: 3,
    },
    grandRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: 6,
      marginTop: 4,
      borderTopWidth: 1,
      borderTopColor: '#cbd5e1',
      fontFamily: 'Helvetica-Bold',
      fontSize: 12,
    },
    footer: {
      position: 'absolute',
      bottom: 24,
      left: 36,
      right: 36,
      textAlign: 'center',
      color: '#94a3b8',
      fontSize: 8,
    },
  })

  const doc = el(
    Document,
    { title: `Invoice ${data.reference}`, author: data.garage.name },
    el(
      Page,
      { size: 'A4', style: s.page },

      // ── Header: garage on the left, document meta on the right ──
      el(
        View,
        { style: s.headerRow },
        el(
          View,
          {},
          el(Text, { style: s.garageName }, data.garage.name),
          el(Text, { style: s.muted }, data.garage.phone),
          data.garage.address ? el(Text, { style: s.muted }, data.garage.address) : null,
        ),
        el(
          View,
          {},
          el(Text, { style: s.docTitle }, 'INVOICE'),
          el(Text, { style: s.muted }, `#${data.reference}`),
          el(Text, { style: s.muted }, formatDate(data.date)),
          el(
            Text,
            {
              style: data.paymentStatus === 'PAID' ? s.statusPaid : s.statusUnpaid,
            },
            data.paymentStatus,
          ),
        ),
      ),

      // ── Customer ──
      el(
        View,
        { style: s.section },
        el(Text, { style: s.sectionLabel }, 'BILLED TO'),
        el(Text, {}, data.customer.name),
        el(Text, { style: s.muted }, data.customer.phone),
        el(Text, { style: s.muted }, `Vehicle: ${data.customer.registration}`),
      ),

      // ── Items table ──
      el(
        View,
        { style: s.section },
        el(
          View,
          { style: s.tableHead },
          el(Text, { style: s.cDesc }, 'Description'),
          el(Text, { style: s.cQty }, 'Qty'),
          el(Text, { style: s.cRate }, 'Rate'),
          el(Text, { style: s.cAmt }, 'Amount'),
        ),
        ...data.items.map((item, i) =>
          el(
            View,
            { style: s.row, key: String(i) },
            el(Text, { style: s.cDesc }, item.description || '—'),
            el(Text, { style: s.cQty }, String(item.quantity)),
            el(Text, { style: s.cRate }, money(item.amount)),
            el(Text, { style: s.cAmt }, money(item.amount * item.quantity)),
          ),
        ),

        // ── Totals ──
        el(
          View,
          { style: s.totalsBlock },
          el(
            View,
            { style: s.totalRow },
            el(Text, {}, 'Subtotal'),
            el(Text, {}, money(data.subtotal)),
          ),
          data.taxEnabled
            ? el(
                View,
                { style: s.totalRow },
                el(Text, {}, `Tax (${data.taxPercent}%)`),
                el(Text, {}, money(data.taxAmount)),
              )
            : null,
          data.discountAmount > 0
            ? el(
                View,
                { style: s.totalRow },
                el(Text, {}, 'Discount'),
                el(Text, {}, `- ${money(data.discountAmount)}`),
              )
            : null,
          el(View, { style: s.grandRow }, el(Text, {}, 'Total'), el(Text, {}, money(data.total))),
        ),
      ),

      // ── Notes ──
      data.notes
        ? el(
            View,
            { style: s.section },
            el(Text, { style: s.sectionLabel }, 'NOTES'),
            el(Text, { style: s.muted }, data.notes),
          )
        : null,

      el(Text, { style: s.footer, fixed: true }, `${data.garage.name} · ${data.garage.phone}`),
    ),
  )

  const blob = await pdf(doc).toBlob()
  triggerDownload(blob, `invoice-${data.reference}.pdf`)
}

/**
 * Save a Blob to disk via a temporary anchor.
 *
 * The anchor is attached to the document before clicking (some browsers ignore
 * clicks on detached nodes) and the object URL is revoked on the next tick —
 * revoking synchronously can cancel the download mid-flight.
 */
function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
