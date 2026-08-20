// Estimate Editor — create/edit estimates with line items
import { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  FileText,
  Plus,
  Trash2,
  Save,
  ArrowRight,
  Percent,
  IndianRupee,
  ToggleLeft,
  ToggleRight,
} from '@/components/ui/icons'

import { apiFetch } from '@/lib/api'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import {
  Card,
  Button,
  Input,
  PriceRow,
  TotalRow,
  SegmentedControl,
  useToast,
  ToastContainer,
} from '@/components/ui'
import { FullPageSpinner } from '@/components/ui/loading'

// ── Types ─────────────────────────────────────────────────────────────────────

interface EstimateItem {
  id: string
  description: string
  amount: number
  quantity: number
  sort_order: number
}

interface EstimateDetail {
  id: string
  visit_id: string
  items: EstimateItem[]
  discount_type: 'FLAT' | 'PERCENT' | null
  discount_value: number
  tax_enabled: boolean
  tax_percent: number
  notes: string | null
  status: string
  registration_number?: string
  customer_name?: string
}

interface NewItem {
  tempId: string
  description: string
  amount: string
  quantity: string
}

// ── Estimate Editor Page ──────────────────────────────────────────────────────

export default function EstimateEditorPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const visitId = searchParams.get('visit')
  const navigate = useNavigate()
  const { tenant } = useTenant()
  const queryClient = useQueryClient()
  const { toasts, showToast, dismissToast } = useToast()

  const isNew = !id || id === 'new'

  // State for items
  const [items, setItems] = useState<NewItem[]>([
    { tempId: crypto.randomUUID(), description: '', amount: '', quantity: '1' },
  ])
  const [taxEnabled, setTaxEnabled] = useState(false)
  const [taxPercent, setTaxPercent] = useState('18')
  const [discountType, setDiscountType] = useState<'FLAT' | 'PERCENT'>('FLAT')
  const [discountValue, setDiscountValue] = useState('0')

  // Fetch existing estimate
  const { data: existingEstimate, isLoading: fetchLoading } = useQuery<EstimateDetail>({
    queryKey: ['estimate', id],
    queryFn: () =>
      apiFetch<EstimateDetail>(`/estimates/${id}`, {
        tenantId: tenant?.id,
      }),
    enabled: Boolean(id && !isNew && tenant?.id),
  })

  // Hydrate form state when data loads
  useEffect(() => {
    if (!existingEstimate) return
    setItems(
      existingEstimate.items.map((item) => ({
        tempId: item.id,
        description: item.description,
        amount: String(item.amount),
        quantity: String(item.quantity),
      })),
    )
    setTaxEnabled(existingEstimate.tax_enabled)
    setTaxPercent(String(existingEstimate.tax_percent))
    if (existingEstimate.discount_type) setDiscountType(existingEstimate.discount_type)
    setDiscountValue(String(existingEstimate.discount_value))
  }, [existingEstimate])

  // Calculate totals
  const subtotal = items.reduce((sum, item) => {
    const amount = Number(item.amount) || 0
    const qty = Number(item.quantity) || 1
    return sum + amount * qty
  }, 0)

  // Discount applies to the subtotal, then tax applies to what's left —
  // matches the backend's canonical calc in routes/estimates.ts and
  // routes/invoices.ts. Taxing the pre-discount subtotal (as this used to)
  // silently disagreed with the total the server freezes and displays
  // everywhere else once both tax and a discount are in use.
  const discountAmount =
    discountType === 'PERCENT'
      ? (subtotal * (Number(discountValue) || 0)) / 100
      : Number(discountValue) || 0

  const afterDiscount = Math.max(0, subtotal - discountAmount)

  const taxAmount = taxEnabled ? (afterDiscount * (Number(taxPercent) || 0)) / 100 : 0

  const grandTotal = afterDiscount + taxAmount

  // Add item
  const addItem = useCallback(() => {
    setItems((prev) => [
      ...prev,
      { tempId: crypto.randomUUID(), description: '', amount: '', quantity: '1' },
    ])
  }, [])

  // Remove item
  const removeItem = useCallback((tempId: string) => {
    setItems((prev) => prev.filter((i) => i.tempId !== tempId))
  }, [])

  // Update item
  const updateItem = useCallback((tempId: string, field: keyof NewItem, value: string) => {
    setItems((prev) => prev.map((i) => (i.tempId === tempId ? { ...i, [field]: value } : i)))
  }, [])

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

      if (isNew) {
        return apiFetch<{ id: string }>('/estimates', {
          method: 'POST',
          body: JSON.stringify(body),
          tenantId: tenant?.id,
        })
      }
      return apiFetch(`/estimates/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(body),
        tenantId: tenant?.id,
      })
    },
    onSuccess: () => {
      showToast('success', isNew ? 'Estimate created' : 'Estimate saved')
      queryClient.invalidateQueries({ queryKey: ['estimates'] })
      if (isNew) navigate(-1)
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to save estimate')
    },
  })

  if (fetchLoading && !isNew) return <FullPageSpinner />

  return (
    <PageShell title="Estimate" showBack hideNav>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="p-4 md:p-6 flex flex-col gap-4">
        {/* ── Items Section ────────────────────────────────────── */}
        <section>
          <h3 className="text-kicker font-bold text-text-secondary uppercase tracking-[0.08em] mb-3 flex items-center gap-1.5">
            <FileText size={13} />
            Items
          </h3>

          <Card className="!p-3 flex flex-col gap-2">
            {items.map((item) => (
              <div key={item.tempId} className="flex gap-2 items-center">
                <input
                  type="text"
                  value={item.description}
                  onChange={(e) => updateItem(item.tempId, 'description', e.target.value)}
                  placeholder="Item description"
                  className="flex-1 min-w-0 h-10 rounded-input border border-border bg-card text-detail text-text px-3 placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
                <input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateItem(item.tempId, 'quantity', e.target.value)}
                  placeholder="Qty"
                  aria-label="Quantity"
                  className="w-12 h-10 rounded-input border border-border bg-card text-detail text-text px-1 text-center placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                />
                <input
                  type="number"
                  value={item.amount}
                  onChange={(e) => updateItem(item.tempId, 'amount', e.target.value)}
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
              id="estimate-add-item"
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
              aria-label={taxEnabled ? 'Disable tax' : 'Enable tax'}
            >
              {taxEnabled ? (
                <ToggleRight size={28} />
              ) : (
                <ToggleLeft size={28} className="text-text-muted" />
              )}
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
              id="estimate-discount-type"
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
            leftIcon={discountType === 'FLAT' ? <IndianRupee size={14} /> : <Percent size={14} />}
            placeholder="0"
          />
        </Card>

        {/* ── Totals ───────────────────────────────────────────── */}
        <Card id="estimate-totals">
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
          <Button
            id="estimate-save"
            variant="outline"
            leftIcon={<Save size={16} />}
            isLoading={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            Save Estimate
          </Button>
          <Button
            id="estimate-convert"
            leftIcon={<ArrowRight size={16} />}
            onClick={() => {
              if (id && !isNew) {
                navigate(`/invoices/new?from_estimate=${id}`)
              } else {
                showToast('error', 'Save the estimate first')
              }
            }}
          >
            Convert to Invoice
          </Button>
        </div>
      </div>
    </PageShell>
  )
}
