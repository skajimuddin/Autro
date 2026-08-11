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
} from 'lucide-react'

import { apiFetch } from '@/lib/api'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import {
  Card,
  Button,
  Input,
  Modal,
  PriceRow,
  TotalRow,
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
  const taxAmount = taxEnabled ? (subtotal * (Number(taxPercent) || 0)) / 100 : 0
  const discountAmount =
    discountType === 'PERCENT'
      ? (subtotal * (Number(discountValue) || 0)) / 100
      : Number(discountValue) || 0
  const grandTotal = Math.max(0, subtotal + taxAmount - discountAmount)

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
    const text = `Invoice from ${tenant?.name ?? 'Workshop'}:\nTotal: ₹${grandTotal.toLocaleString('en-IN')}\n\nThank you for your business!`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Invoice from ${tenant?.name ?? 'Workshop'}`,
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

      <div className="p-4 flex flex-col gap-4">
        {/* ── Left accent if from estimate ──────────────────────── */}
        {fromEstimate && (
          <div className="border-l-4 border-primary bg-primary-light/30 rounded-r-card px-4 py-2.5">
            <p className="text-xs font-semibold text-primary">
              Imported from Estimate
            </p>
            <p className="text-[0.65rem] text-text-secondary mt-0.5">
              Items have been pre-filled. You can edit them before saving.
            </p>
          </div>
        )}

        {/* ── Items Section ────────────────────────────────────── */}
        <section>
          <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <Receipt size={13} />
            Items
          </h3>

          <Card className="!p-3 flex flex-col gap-3">
            {items.map((item) => (
              <div key={item.tempId} className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) =>
                      updateItem(item.tempId, 'description', e.target.value)
                    }
                    placeholder="Item description"
                    className="flex-1 h-10 rounded-input border border-border bg-card text-text text-sm px-3 placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => removeItem(item.tempId)}
                    className="w-10 h-10 rounded-input flex items-center justify-center text-text-muted hover:text-danger hover:bg-danger-light transition-colors flex-shrink-0"
                    aria-label="Remove item"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={item.amount}
                    onChange={(e) =>
                      updateItem(item.tempId, 'amount', e.target.value)
                    }
                    placeholder="₹ Amount"
                    className="flex-1 h-10 rounded-input border border-border bg-card text-text text-sm px-3 placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(item.tempId, 'quantity', e.target.value)
                    }
                    placeholder="Qty"
                    className="w-16 h-10 rounded-input border border-border bg-card text-text text-sm px-3 text-center placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  />
                </div>
              </div>
            ))}

            <Button
              id="invoice-add-item"
              variant="dashed"
              size="sm"
              leftIcon={<Plus size={16} />}
              onClick={addItem}
            >
              Add Item
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
            <div className="flex rounded-full border border-border overflow-hidden">
              <button
                type="button"
                onClick={() => setDiscountType('FLAT')}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  discountType === 'FLAT'
                    ? 'bg-primary text-white'
                    : 'text-text-secondary hover:bg-bg'
                }`}
              >
                ₹ Flat
              </button>
              <button
                type="button"
                onClick={() => setDiscountType('PERCENT')}
                className={`px-3 py-1 text-xs font-medium transition-colors ${
                  discountType === 'PERCENT'
                    ? 'bg-primary text-white'
                    : 'text-text-secondary hover:bg-bg'
                }`}
              >
                %
              </button>
            </div>
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

        {/* ── Totals ───────────────────────────────────────────── */}
        <Card id="invoice-totals">
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
          <TotalRow total={grandTotal} />
        </Card>

        {/* ── Actions ──────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 pb-6">
          {/* PDF + Print */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              id="invoice-pdf"
              variant="outline"
              size="sm"
              leftIcon={<FileDown size={16} />}
              onClick={() => showToast('error', 'PDF generation coming soon')}
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
            variant="outline"
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
            <div className="flex items-center justify-center gap-2 py-3 bg-success-light rounded-card">
              <CheckCircle2 size={18} className="text-success" />
              <span className="text-sm font-bold text-success">Paid</span>
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
              <div className="w-10 h-10 rounded-xl bg-bg flex items-center justify-center flex-shrink-0">
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
