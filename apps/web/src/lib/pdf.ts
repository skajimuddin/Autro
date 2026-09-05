// Task 4.6 — PDF templates + generation
//
// Client-side invoice/quotation PDF, per 01-tech-stack.md (no server-side
// rendering cost).
//
// Three deliberate choices:
//
// 1. `@react-pdf/renderer` is ~1 MB, so it is behind a dynamic `import()`. Vite
//    emits it as a separate chunk that only downloads when a user actually taps
//    PDF. A static import would roughly double the initial bundle.
//
// 2. Amounts are prefixed "Rs." rather than "₹". @react-pdf's built-in Helvetica
//    has no glyph for U+20B9, so a literal ₹ renders as a blank box in the
//    output. Fixing that properly means Font.register()-ing a .ttf that covers
//    the rupee sign (the app's Geist is served as woff2, which @react-pdf cannot
//    read) and fetching it at runtime. "Rs." is unambiguous, offline-safe, and
//    standard on Indian invoices. The ₹ glyph is still used everywhere in the UI.
//
// 3. Everything an owner can customise (Settings → Invoice & estimate PDFs) is a
//    `PdfTemplate` — logo/address visibility, item numbering, footer/terms
//    text, accent colour, document prefixes. Invoices and quotations share one
//    document builder so a template change never has to be kept in sync
//    between two near-identical layouts.
//
// This file uses createElement rather than JSX because 02-folder-structure.md
// specifies `lib/pdf.ts`, and a .ts file cannot contain JSX.
import { createElement as el } from 'react'
import type { PdfTemplate } from '@autro/shared'
import { DEFAULT_PDF_TEMPLATE } from '@autro/shared'
import { BRAND } from '@/theme'

// ── Public data shape ─────────────────────────────────────────────────────────

export interface PdfLineItem {
  description: string
  amount: number
  quantity: number
}

export interface PdfDocumentData {
  /** Short human-facing reference, e.g. first 8 chars of the record's id —
   *  the template's invoice/estimate prefix is applied on top of this. */
  reference: string
  /** ISO date string for the document date */
  date: string
  garage: {
    name: string
    phone: string
    address: string | null
    /** R2 (or any) public URL. Fetched and embedded best-effort — a CORS
     *  failure or network error silently omits the logo rather than
     *  breaking PDF generation, since the document still has to generate
     *  correctly on every device even when the image can't be reached. */
    logo_url: string | null
  }
  customer: {
    name: string
    phone: string
    registration: string
  }
  items: PdfLineItem[]
  subtotal: number
  taxEnabled: boolean
  taxPercent: number
  taxAmount: number
  discountAmount: number
  total: number
  notes: string | null
  /** Owner's customisation — pass `tenant.pdf_template` straight through.
   *  Missing/partial is fine; defaults fill the rest. */
  template: Partial<PdfTemplate> | null | undefined
}

export interface InvoicePdfData extends PdfDocumentData {
  paymentStatus: 'PAID' | 'UNPAID'
}

export type EstimatePdfData = PdfDocumentData

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

/**
 * Best-effort fetch of a public image URL as a data: URI, for @react-pdf's
 * <Image> to embed. Returns null on any failure (missing CORS headers on the
 * bucket, offline, a dead URL) — the document still has to render without a
 * logo rather than not render at all.
 */
async function toDataUrl(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { mode: 'cors' })
    if (!res.ok) return null
    const blob = await res.blob()
    return await new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null)
      reader.onerror = () => resolve(null)
      reader.readAsDataURL(blob)
    })
  } catch (err) {
    console.error('[Autro] Logo could not be embedded in the PDF', err)
    return null
  }
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

// ── Shared document builder ──────────────────────────────────────────────────

async function generate(
  kind: 'INVOICE' | 'QUOTATION',
  data: PdfDocumentData,
  paymentStatus: 'PAID' | 'UNPAID' | null,
): Promise<void> {
  const { pdf, Document, Page, Text, View, Image, StyleSheet } = await import('@react-pdf/renderer')

  const t: PdfTemplate = { ...DEFAULT_PDF_TEMPLATE, ...data.template }
  const accent = t.accent_color || BRAND.light
  const prefix = (kind === 'INVOICE' ? t.invoice_prefix : t.estimate_prefix) || (kind === 'INVOICE' ? 'INV' : 'EST')
  const reference = `${prefix}-${data.reference}`
  const showAddress = t.show_address && Boolean(data.garage.address)

  const logoDataUrl =
    t.show_logo && data.garage.logo_url ? await toDataUrl(data.garage.logo_url) : null

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
    logo: { width: 40, height: 40, marginBottom: 6, objectFit: 'contain' },
    garageName: { fontSize: 18, fontFamily: 'Helvetica-Bold' },
    muted: { color: '#64748b', marginTop: 2 },
    docTitle: {
      fontSize: 14,
      fontFamily: 'Helvetica-Bold',
      textAlign: 'right',
      color: accent,
    },
    statusPaid: { color: '#059669', fontFamily: 'Helvetica-Bold', marginTop: 4, textAlign: 'right' },
    statusUnpaid: { color: '#dc2626', fontFamily: 'Helvetica-Bold', marginTop: 4, textAlign: 'right' },
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
    cNo: { width: 22 },
    cDesc: { flex: 1 },
    cQty: { width: 40, textAlign: 'right' },
    cRate: { width: 80, textAlign: 'right' },
    cAmt: { width: 90, textAlign: 'right' },
    totalsBlock: { marginTop: 12, marginLeft: 'auto', width: 230 },
    totalRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
    grandRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: 6,
      marginTop: 4,
      borderTopWidth: 1,
      borderTopColor: accent,
      fontFamily: 'Helvetica-Bold',
      fontSize: 12,
      color: accent,
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
    { title: `${kind === 'INVOICE' ? 'Invoice' : 'Quotation'} ${reference}`, author: data.garage.name },
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
          logoDataUrl ? el(Image, { src: logoDataUrl, style: s.logo }) : null,
          el(Text, { style: s.garageName }, data.garage.name),
          el(Text, { style: s.muted }, data.garage.phone),
          showAddress ? el(Text, { style: s.muted }, data.garage.address) : null,
        ),
        el(
          View,
          {},
          el(Text, { style: s.docTitle }, kind === 'INVOICE' ? 'INVOICE' : 'QUOTATION'),
          el(Text, { style: s.muted }, `#${reference}`),
          el(Text, { style: s.muted }, formatDate(data.date)),
          paymentStatus
            ? el(Text, { style: paymentStatus === 'PAID' ? s.statusPaid : s.statusUnpaid }, paymentStatus)
            : null,
        ),
      ),

      // ── Customer ──
      el(
        View,
        { style: s.section },
        el(Text, { style: s.sectionLabel }, kind === 'INVOICE' ? 'BILLED TO' : 'QUOTED FOR'),
        el(Text, {}, data.customer.name),
        el(Text, { style: s.muted }, data.customer.phone),
        el(Text, { style: s.muted }, `Vehicle: ${data.customer.registration}`),
      ),

      // ── Items table ──
      el(
        View,
        { style: s.section },
        // `fixed` makes react-pdf repeat this exact row at the top of every
        // page the table spills onto — without it, a bill long enough to
        // wrap to a second page (40+ lines; rare, but this app has no cap on
        // line items) left that page's numbers with no column labels at all.
        el(
          View,
          { style: s.tableHead, fixed: true },
          t.show_item_numbers ? el(Text, { style: s.cNo }, '#') : null,
          el(Text, { style: s.cDesc }, 'Description'),
          el(Text, { style: s.cQty }, 'Qty'),
          el(Text, { style: s.cRate }, 'Rate'),
          el(Text, { style: s.cAmt }, 'Amount'),
        ),
        ...data.items.map((item, i) =>
          el(
            View,
            { style: s.row, key: String(i) },
            t.show_item_numbers ? el(Text, { style: s.cNo }, String(i + 1)) : null,
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
          el(View, { style: s.totalRow }, el(Text, {}, 'Subtotal'), el(Text, {}, money(data.subtotal))),
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

      // ── Terms & conditions ──
      t.terms_and_conditions
        ? el(
            View,
            { style: s.section },
            el(Text, { style: s.sectionLabel }, 'TERMS & CONDITIONS'),
            el(Text, { style: s.muted }, t.terms_and_conditions),
          )
        : null,

      el(
        Text,
        { style: s.footer, fixed: true },
        t.footer_note ? `${data.garage.name} · ${data.garage.phone} · ${t.footer_note}` : `${data.garage.name} · ${data.garage.phone}`,
      ),
    ),
  )

  const blob = await pdf(doc).toBlob()
  triggerDownload(blob, `${kind === 'INVOICE' ? 'invoice' : 'quotation'}-${reference}.pdf`)
}

// ── Public API ────────────────────────────────────────────────────────────────

/** Build the invoice PDF and hand it to the browser as a download. Throws on
 *  failure so the caller can surface a toast. */
export async function downloadInvoicePdf(data: InvoicePdfData): Promise<void> {
  await generate('INVOICE', data, data.paymentStatus)
}

/** Same document builder, no payment status — a quotation isn't paid or
 *  unpaid, it's an estimate. */
export async function downloadEstimatePdf(data: EstimatePdfData): Promise<void> {
  await generate('QUOTATION', data, null)
}
