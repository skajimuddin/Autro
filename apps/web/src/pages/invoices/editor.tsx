// Invoice Editor — create/edit invoices with payment flow
import { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Receipt,
  Plus,
  Trash2,
  Save,
  FileDown,
  Printer,
  Share2,
  CreditCard,
  Percent,
  IndianRupee,
  ToggleLeft,
  ToggleRight,
  CheckCircle2,
  Banknote,
  Smartphone,
  Wallet,
} from '@/components/ui/icons'

import { apiFetch } from '@/lib/api'
import { downloadInvoicePdf } from '@/lib/pdf'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import {
  Card,
  Button,
  Input,
  Modal,
  PriceRow,
  SegmentedControl,
  useToast,
  ToastContainer,
} from '@/components/ui'
import { FullPageSpinner } from '@/components/ui/loading'

// ── Types ─────────────────────────────────────────────────────────────────────

interface InvoiceItem {
  id: string
  description: string
  amount: number
  quantity: number
  sort_order: number
}

interface InvoiceDetail {
  id: string
  visit_id: string
  estimate_id: string | null
  items: InvoiceItem[]
  discount_type: 'FLAT' | 'PERCENT' | null
  discount_value: number
  tax_enabled: boolean
  tax_percent: number
  frozen_total: number
  payment_status: 'UNPAID' | 'PAID'
  payment_method: string | null
  notes: string | null
  registration_number?: string
  customer_name?: string
  customer_phone?: string
}

interface NewItem {
  tempId: string
  description: string
  amount: string
  quantity: string
}

type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'OTHER'

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { value: 'CASH', label: 'Cash', icon: Banknote },
  { value: 'UPI', label: 'UPI', icon: Smartphone },
  { value: 'CARD', label: 'Card', icon: CreditCard },
  { value: 'OTHER', label: 'Other', icon: Wallet },
]

// ── Invoice Editor Page ───────────────────────────────────────────────────────

export default function InvoiceEditorPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const visitId = searchParams.get('visit')
  const fromEstimate = searchParams.get('from_estimate')
  const navigate = useNavigate()
  const { tenant } = useTenant()
  const queryClient = useQueryClient()
  const { toasts, showToast, dismissToast } = useToast()

  const isNew = !id || id === 'new'

  // State
  const [items, setItems] = useState<NewItem[]>([
    { tempId: crypto.randomUUID(), description: '', amount: '', quantity: '1' },
  ])
  const [taxEnabled, setTaxEnabled] = useState(false)
  const [taxPercent, setTaxPercent] = useState('18')
  const [discountType, setDiscountType] = useState<'FLAT' | 'PERCENT'>('FLAT')
  const [discountValue, setDiscountValue] = useState('0')
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [isPaid, setIsPaid] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  // Fetch existing invoice
  const { data: existingInvoice, isLoading: fetchLoading } = useQuery<InvoiceDetail>({
    queryKey: ['invoice', id],
    queryFn: () =>
      apiFetch<InvoiceDetail>(`/invoices/${id}`, {
        tenantId: tenant?.id,
      }),
    enabled: Boolean(id && !isNew && tenant?.id),
  })

  // Hydrate form state when data loads
  useEffect(() => {
    if (!existingInvoice) return
    setItems(
      existingInvoice.items.map((item) => ({
        tempId: item.id,
        description: item.description,
        amount: String(item.amount),
        quantity: String(item.quantity),
      })),
    )
    setTaxEnabled(existingInvoice.tax_enabled)
    setTaxPercent(String(existingInvoice.tax_percent))
    if (existingInvoice.discount_type) setDiscountType(existingInvoice.discount_type)
    setDiscountValue(String(existingInvoice.discount_value))
    setIsPaid(existingInvoice.payment_status === 'PAID')
  }, [existingInvoice])

  // Totals
  const subtotal = items.reduce((sum, item) => {
    const amount = Number(item.amount) || 0
    const qty = Number(item.quantity) || 1
    return sum + amount * qty
  }, 0)
  // Discount applies to the subtotal, then tax applies to what's left —
  // matches the backend's canonical calc in routes/invoices.ts. Taxing the
  // pre-discount subtotal (as this used to) silently disagreed with the
  // frozen_total the server computes and saves once both tax and a discount
  // are in use — the WhatsApp share text below reads straight off grandTotal,
  // so a wrong on-screen figure would go straight to the customer.
  const discountAmount =
    discountType === 'PERCENT'
      ? (subtotal * (Number(discountValue) || 0)) / 100
      : Number(discountValue) || 0
  const afterDiscount = Math.max(0, subtotal - discountAmount)
  const taxAmount = taxEnabled ? (afterDiscount * (Number(taxPercent) || 0)) / 100 : 0
  const grandTotal = afterDiscount + taxAmount

  // PDF export (Task 4.6). The heavy @react-pdf/renderer import lives inside
  // lib/pdf.ts, so it only downloads when this handler actually runs.
  const handleDownloadPdf = useCallback(async () => {
    if (!tenant) {
      showToast('error', 'Garage details are still loading. Try again.')
      return
    }
    if (items.length === 0) {
      showToast('error', 'Add at least one item before exporting a PDF')
      return
    }

    setIsGeneratingPdf(true)
    try {
      await downloadInvoicePdf({
        reference: (existingInvoice?.id ?? id ?? 'draft').slice(0, 8).toUpperCase(),
        date: new Date().toISOString(),
        garage: {
          name: tenant.name,
          phone: tenant.phone,
          address: tenant.address,
        },
        customer: {
          name: existingInvoice?.customer_name ?? '—',
          phone: existingInvoice?.customer_phone ?? '—',
          registration: existingInvoice?.registration_number ?? '—',
        },
        items: items.map((item) => ({
          description: item.description,
          amount: Number(item.amount) || 0,
          quantity: Number(item.quantity) || 1,
        })),
        subtotal,
        taxEnabled,
        taxPercent: Number(taxPercent) || 0,
        taxAmount,
        discountAmount,
        total: grandTotal,
        paymentStatus: isPaid ? 'PAID' : 'UNPAID',
        notes: existingInvoice?.notes ?? null,
      })
    } catch (err: unknown) {
      showToast(
        'error',
        err instanceof Error ? err.message : 'Could not generate the PDF',
      )
    } finally {
      setIsGeneratingPdf(false)
    }
  }, [
    tenant,
    existingInvoice,
    id,
    items,
    subtotal,
    taxEnabled,
    taxPercent,
    taxAmount,
    discountAmount,
    grandTotal,
    isPaid,
    showToast,
  ])

  // Item handlers
  const addItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      { tempId: crypto.randomUUID(), description: '', amount: '', quantity: '1' },
    ])
  }, [])

  const removeItem = useCallback((tempId: string) => {
    setItems((prev) => prev.filter((i) => i.tempId !== tempId))
  }, [])

  const updateItem = useCallback(
    (tempId: string, field: keyof NewItem, value: string) => {
      setItems((prev) =>
        prev.map((i) => (i.tempId === tempId ? { ...i, [field]: value } : i)),
      )
    },
    [],
  )

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: () => {
      const body = {
        visit_id: visitId,
        items: items
          .filter((i) => i.description.trim() && Number(i.amount) > 0)
          .map((i, idx) => ({
            description: i.description.trim(),
            amount: Number(i.amount),
            quantity: Number(i.quantity) || 1,
            sort_order: idx,
          })),
        discount_type: Number(discountValue) > 0 ? discountType : null,
        discount_value: Number(discountValue) || 0,
        tax_enabled: taxEnabled,
        tax_percent: taxEnabled ? Number(taxPercent) || 0 : 0,
      }

      if (fromEstimate) {
        return apiFetch(`/invoices/from-estimate/${fromEstimate}`, {
          method: 'POST',
          tenantId: tenant?.id,
        })
      }
      if (isNew) {
        return apiFetch('/invoices', {
          method: 'POST',
          body: JSON.stringify(body),
          tenantId: tenant?.id,
        })
      }
      return apiFetch(`/invoices/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
        tenantId: tenant?.id,
      })
    },
    onSuccess: () => {
      showToast('success', isNew ? 'Invoice created' : 'Invoice saved')
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      if (isNew) navigate(-1)
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to save invoice')
    },
  })

  // Pay mutation
  const payMutation = useMutation({
    mutationFn: (method: PaymentMethod) =>
      apiFetch(`/invoices/${id}/pay`, {
        method: 'PATCH',
        body: JSON.stringify({ payment_method: method }),
        tenantId: tenant?.id,
      }),
    onSuccess: () => {
      showToast('success', 'Invoice marked as paid')
      setShowPaymentModal(false)
      setIsPaid(true)
      queryClient.invalidateQueries({ queryKey: ['invoice', id] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to mark as paid')
    },
  })

  // WhatsApp share
  const handleWhatsAppShare = useCallback(async () => {
    const text = `Invoice from ${tenant?.name ?? 'Autro'}:\nTotal: ₹${grandTotal.toLocaleString('en-IN')}\n\nThank you for your business!`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Invoice from ${tenant?.name ?? 'Autro'}`,
          text,
        })
        return
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Native share failed', err)
        } else {
          return // User cancelled
        }
      }
    }

    const url = `https://wa.me/?text=${encodeURIComponent(text)}`
    window.open(url, '_blank', 'noopener')
  }, [tenant?.name, grandTotal])

  if (fetchLoading && !isNew) return <FullPageSpinner />

  return (
    <PageShell title="Invoice" showBack hideNav>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="p-4 md:p-6 md:grid md:grid-cols-[1fr_380px] md:gap-6 md:items-start">
      <div className="flex flex-col gap-4">
        {/* ── Left accent if from estimate ──────────────────────── */}
        {fromEstimate && (
          <div className="rounded-tile bg-primary-light/40 px-4 py-2.5">
            <p className="text-row-sub font-semibold text-primary">
              Imported from Estimate
            </p>
            <p className="text-row-sub text-text-secondary mt-0.5">
              Items have been pre-filled. You can edit them before saving.
            </p>
          </div>
        )}

        {/* ── Items Section ────────────────────────────────────── */}
        <section>
          <h3 className="text-kicker font-bold text-text-secondary uppercase tracking-[0.08em] mb-3 flex items-center gap-1.5">
            <Receipt size={13} />
            Items
          </h3>

          <Card className="!p-3 flex flex-col gap-2">
            {items.map((item) => (
              <div key={item.tempId} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) =>
                    updateItem(item.tempId, 'description', e.target.value)
                  }
                  placeholder="Item description"
                  className="flex-1 min-w-0 h-10 rounded-input border border-border bg-card text-detail text-text px-3 placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) =>
                    updateItem(item.tempId, 'quantity', e.target.value)
                  }
                  placeholder="Qty"
                  aria-label="Quantity"
                  className="w-12 h-10 rounded-input border border-border bg-card text-detail text-text px-1 text-center placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
                <input
                  type="number"
                  value={item.amount}
                  onChange={(e) =>
                    updateItem(item.tempId, 'amount', e.target.value)
                  }
                  placeholder="₹ Amount"
                  aria-label="Amount"
                  className="w-24 h-10 rounded-input border border-border bg-card text-detail text-text px-2 placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
                <button
                  type="button"
                  onClick={() => removeItem(item.tempId)}
                  className="w-9 h-9 flex items-center justify-center text-text-muted hover:text-danger hover:bg-danger-light transition-colors flex-shrink-0"
                  aria-label="Remove item"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}

            <Button
              id="invoice-add-item"
              variant="ghost"
              size="sm"
              fullWidth={false}
              leftIcon={<Plus size={14} />}
              onClick={addItem}
              className="self-start !px-0 hover:!bg-transparent hover:!text-primary"
            >
              Add line item
            </Button>
          </Card>
        </section>

        {/* ── Tax Toggle ───────────────────────────────────────── */}
        <Card>
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-text">Add Tax</span>
            <button
              type="button"
              onClick={() => setTaxEnabled(!taxEnabled)}
              className="text-primary"
            >
              {taxEnabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="text-text-muted" />}
            </button>
          </div>
          {taxEnabled && (
            <div className="mt-3">
              <Input
                label="Tax %"
                type="number"
                value={taxPercent}
                onChange={(e) => setTaxPercent(e.target.value)}
                leftIcon={<Percent size={14} />}
                placeholder="18"
              />
            </div>
          )}
        </Card>

        {/* ── Discount ─────────────────────────────────────────── */}
        <Card>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-text">Discount</span>
            <SegmentedControl
              id="invoice-discount-type"
              aria-label="Discount type"
              value={discountType}
              onChange={setDiscountType}
              options={[
                { value: 'FLAT', label: '₹ Flat' },
                { value: 'PERCENT', label: '%' },
              ]}
            />
          </div>
          <Input
            type="number"
            value={discountValue}
            onChange={(e) => setDiscountValue(e.target.value)}
            leftIcon={
              discountType === 'FLAT' ? (
                <IndianRupee size={14} />
              ) : (
                <Percent size={14} />
              )
            }
            placeholder="0"
          />
        </Card>

        {/* ── Line breakdown (subtotal/tax/discount) ────────────── */}
        <Card>
          <PriceRow name="Subtotal" price={subtotal} />
          {taxEnabled && taxAmount > 0 && (
            <PriceRow name={`Tax (${taxPercent}%)`} price={taxAmount} />
          )}
          {discountAmount > 0 && (
            <PriceRow
              name={`Discount${discountType === 'PERCENT' ? ` (${discountValue}%)` : ''}`}
              price={-discountAmount}
            />
          )}
        </Card>
      </div>

      {/* ── Total due + actions (right column at md:+) ───────────── */}
      <div className="flex flex-col gap-3 mt-4 md:mt-0 pb-6">
        <Card id="invoice-totals" elevated className="flex flex-col gap-1">
          <span className="text-kicker font-semibold text-text-secondary uppercase tracking-[0.08em]">
            Total due
          </span>
          <span className="text-value-xl font-bold text-primary tabular-nums">
            ₹{grandTotal.toLocaleString('en-IN')}
          </span>
        </Card>

        <div className="grid grid-cols-2 gap-3">
          <Button
            id="invoice-pdf"
            variant="outline"
            size="sm"
            leftIcon={<FileDown size={16} />}
            isLoading={isGeneratingPdf}
            onClick={handleDownloadPdf}
          >
            PDF
          </Button>
          <Button
            id="invoice-print"
            variant="outline"
            size="sm"
            leftIcon={<Printer size={16} />}
            onClick={() => window.print()}
          >
            Print
          </Button>
        </div>

        <Button
          id="invoice-share-whatsapp"
          leftIcon={<Share2 size={16} />}
          onClick={handleWhatsAppShare}
        >
          Share on WhatsApp
        </Button>

        {!isPaid && (
          <Button
            id="invoice-mark-paid"
            variant="success"
            leftIcon={<CheckCircle2 size={18} />}
            onClick={() => {
              if (!isNew && id) {
                setShowPaymentModal(true)
              } else {
                showToast('error', 'Save the invoice first')
              }
            }}
          >
            Mark as Paid
          </Button>
        )}

        {isPaid && (
          <div className="flex items-center justify-center gap-2 py-3 rounded-tile bg-success-light">
            <CheckCircle2 size={18} className="text-success" />
            <span className="text-row-title font-bold text-success">Paid</span>
          </div>
        )}

        {!isPaid && (
          <Button
            id="invoice-save"
            variant="ghost"
            leftIcon={<Save size={16} />}
            isLoading={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            Save Draft
          </Button>
        )}
      </div>
      </div>

      {/* ── Payment Method Modal ───────────────────────────────── */}
      <Modal
        id="payment-modal"
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        title="Select Payment Method"
      >
        <div className="flex flex-col gap-3">
          {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              type="button"
              onClick={() => payMutation.mutate(value)}
              disabled={payMutation.isPending}
              className="flex items-center gap-3 px-4 py-3 rounded-card border border-border hover:border-primary hover:bg-primary-light/30 transition-colors text-left"
            >
              <div className="w-10 h-10 bg-bg flex items-center justify-center flex-shrink-0">
                <Icon size={20} className="text-text-secondary" />
              </div>
              <span className="text-sm font-semibold text-text">{label}</span>
            </button>
          ))}
        </div>
      </Modal>
    </PageShell>
  )
}
