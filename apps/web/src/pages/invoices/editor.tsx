// Invoice editor — the same line items as an estimate, plus the money actions:
// PDF, share, and marking it paid.
//
// Migrated 2026-08-20 onto the MUI design system. Two columns at md:+ with the
// total due and the actions on the right, because that is what an owner reaches
// for once the items are entered.
//
// The arithmetic is the backend's: discount off the subtotal, then tax on what
// is left. This matters more here than on an estimate — the WhatsApp text reads
// straight off the on-screen total, so a wrong figure goes to the customer.
import { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert, Box, Button, ButtonBase, Card, Dialog, DialogContent, DialogTitle, Divider,
  IconButton, InputAdornment, Stack, Switch, TextField, Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import AddIcon from '@mui/icons-material/AddRounded'
import DeleteIcon from '@mui/icons-material/DeleteOutlineRounded'
import SaveIcon from '@mui/icons-material/SaveOutlined'
import PdfIcon from '@mui/icons-material/PictureAsPdfOutlined'
import PrintIcon from '@mui/icons-material/PrintOutlined'
import ShareIcon from '@mui/icons-material/IosShareRounded'
import PaidIcon from '@mui/icons-material/CheckCircleRounded'
import CashIcon from '@mui/icons-material/PaymentsOutlined'
import UpiIcon from '@mui/icons-material/SmartphoneOutlined'
import CardIcon from '@mui/icons-material/CreditCardOutlined'
import WalletIcon from '@mui/icons-material/AccountBalanceWalletOutlined'

import { apiFetch } from '@/lib/api'
import { downloadInvoicePdf } from '@/lib/pdf'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import { SectionCard } from '@/components/ui/section-card'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { Kicker } from '@/components/ui/kicker'
import { useToast, ToastContainer } from '@/components/ui/toast'
import { FullPageSpinner } from '@/components/ui/loading'
import { inr } from '@/lib/format'

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

interface DraftItem {
  tempId: string
  description: string
  amount: string
  quantity: string
}

type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'OTHER'

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { value: 'CASH', label: 'Cash', icon: CashIcon },
  { value: 'UPI', label: 'UPI', icon: UpiIcon },
  { value: 'CARD', label: 'Card', icon: CardIcon },
  { value: 'OTHER', label: 'Other', icon: WalletIcon },
]

const blankItem = (): DraftItem => ({
  tempId: crypto.randomUUID(),
  description: '',
  amount: '',
  quantity: '1',
})

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

  const [items, setItems] = useState<DraftItem[]>([blankItem()])
  const [taxEnabled, setTaxEnabled] = useState(false)
  const [taxPercent, setTaxPercent] = useState('18')
  const [discountType, setDiscountType] = useState<'FLAT' | 'PERCENT'>('FLAT')
  const [discountValue, setDiscountValue] = useState('0')
  const [payOpen, setPayOpen] = useState(false)
  const [isPaid, setIsPaid] = useState(false)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)

  const { data: existing, isLoading } = useQuery<InvoiceDetail>({
    queryKey: ['invoice', id],
    queryFn: () => apiFetch<InvoiceDetail>(`/invoices/${id}`, { tenantId: tenant?.id }),
    enabled: Boolean(id && !isNew && tenant?.id),
  })

  useEffect(() => {
    if (!existing) return
    setItems(
      existing.items.map((item) => ({
        tempId: item.id,
        description: item.description,
        amount: String(item.amount),
        quantity: String(item.quantity),
      })),
    )
    setTaxEnabled(existing.tax_enabled)
    setTaxPercent(String(existing.tax_percent))
    if (existing.discount_type) setDiscountType(existing.discount_type)
    setDiscountValue(String(existing.discount_value))
    setIsPaid(existing.payment_status === 'PAID')
  }, [existing])

  const subtotal = items.reduce(
    (sum, i) => sum + (Number(i.amount) || 0) * (Number(i.quantity) || 1),
    0,
  )
  const discountAmount =
    discountType === 'PERCENT'
      ? (subtotal * (Number(discountValue) || 0)) / 100
      : Number(discountValue) || 0
  const afterDiscount = Math.max(0, subtotal - discountAmount)
  const taxAmount = taxEnabled ? (afterDiscount * (Number(taxPercent) || 0)) / 100 : 0
  const grandTotal = afterDiscount + taxAmount

  const updateItem = useCallback((tempId: string, field: keyof DraftItem, value: string) => {
    setItems((prev) => prev.map((i) => (i.tempId === tempId ? { ...i, [field]: value } : i)))
  }, [])

  // The heavy @react-pdf/renderer import lives in lib/pdf.ts so it only
  // downloads when this actually runs.
  const downloadPdf = useCallback(async () => {
    if (!tenant) {
      showToast('error', 'Garage details are still loading. Try again.')
      return
    }
    setIsGeneratingPdf(true)
    try {
      await downloadInvoicePdf({
        reference: (existing?.id ?? id ?? 'draft').slice(0, 8).toUpperCase(),
        date: new Date().toISOString(),
        garage: { name: tenant.name, phone: tenant.phone, address: tenant.address },
        customer: {
          name: existing?.customer_name ?? '—',
          phone: existing?.customer_phone ?? '—',
          registration: existing?.registration_number ?? '—',
        },
        items: items.map((i) => ({
          description: i.description,
          amount: Number(i.amount) || 0,
          quantity: Number(i.quantity) || 1,
        })),
        subtotal,
        taxEnabled,
        taxPercent: Number(taxPercent) || 0,
        taxAmount,
        discountAmount,
        total: grandTotal,
        paymentStatus: isPaid ? 'PAID' : 'UNPAID',
        notes: existing?.notes ?? null,
      })
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Could not generate the PDF')
    } finally {
      setIsGeneratingPdf(false)
    }
  }, [tenant, existing, id, items, subtotal, taxEnabled, taxPercent, taxAmount, discountAmount, grandTotal, isPaid, showToast])

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
        return apiFetch(`/invoices/from-estimate/${fromEstimate}`, { method: 'POST', tenantId: tenant?.id })
      }
      return isNew
        ? apiFetch('/invoices', { method: 'POST', body: JSON.stringify(body), tenantId: tenant?.id })
        : apiFetch(`/invoices/${id}`, { method: 'PATCH', body: JSON.stringify(body), tenantId: tenant?.id })
    },
    onSuccess: () => {
      showToast('success', isNew ? 'Invoice created' : 'Invoice saved')
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      // The dashboard counts unpaid invoices and the vehicle screen prints
      // this total; both are stale the moment this succeeds.
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['vehicle'] })
      if (isNew) void navigate(-1)
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to save invoice'),
  })

  const payMutation = useMutation({
    mutationFn: (method: PaymentMethod) =>
      apiFetch(`/invoices/${id}/pay`, {
        method: 'PATCH',
        body: JSON.stringify({ payment_method: method }),
        tenantId: tenant?.id,
      }),
    onSuccess: () => {
      showToast('success', 'Invoice marked as paid')
      setPayOpen(false)
      setIsPaid(true)
      queryClient.invalidateQueries({ queryKey: ['invoice', id] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to mark as paid'),
  })

  const share = useCallback(async () => {
    const text = `Invoice from ${tenant?.name ?? 'the workshop'}:\nTotal: ${inr(grandTotal)}\n\nThank you for your business!`
    if (navigator.share) {
      try {
        await navigator.share({ title: `Invoice from ${tenant?.name ?? 'the workshop'}`, text })
        return
      } catch (err) {
        // A cancelled share is not a failure.
        if ((err as Error).name === 'AbortError') return
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank', 'noopener')
  }, [tenant?.name, grandTotal])

  if (isLoading && !isNew) return <FullPageSpinner />

  const hasItems = items.some((i) => i.description.trim() && Number(i.amount) > 0)

  return (
    <PageShell title="Invoice" mobileTitle="Invoice" showBack hideNav wide>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <Box
        sx={{
          px: { xs: 2, md: 3.5 }, pb: 4,
          display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 340px' },
          gap: 2.5, alignItems: 'start',
        }}
      >
        <Stack spacing={2.5}>
          {fromEstimate && (
            <Alert severity="info" sx={{ borderRadius: 2 }}>
              Imported from an estimate — edit the items before saving if anything changed.
            </Alert>
          )}

          <SectionCard title="Items" padded>
            <Stack spacing={1.25}>
              {items.map((item) => (
                <Stack key={item.tempId} direction="row" spacing={1} alignItems="center">
                  <TextField
                    size="small"
                    fullWidth
                    value={item.description}
                    onChange={(e) => updateItem(item.tempId, 'description', e.target.value)}
                    placeholder="Item or service"
                    inputProps={{ 'aria-label': 'Description' }}
                  />
                  <TextField
                    size="small"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.tempId, 'quantity', e.target.value)}
                    type="number"
                    inputProps={{ 'aria-label': 'Quantity', style: { textAlign: 'center' } }}
                    sx={{ width: 62, flexShrink: 0 }}
                  />
                  <TextField
                    size="small"
                    value={item.amount}
                    onChange={(e) => updateItem(item.tempId, 'amount', e.target.value)}
                    type="number"
                    placeholder="0"
                    inputProps={{ 'aria-label': 'Amount', style: { textAlign: 'right' } }}
                    InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                    sx={{ width: 118, flexShrink: 0 }}
                  />
                  <IconButton
                    aria-label="Remove item"
                    onClick={() =>
                      setItems((prev) =>
                        prev.length === 1 ? [blankItem()] : prev.filter((i) => i.tempId !== item.tempId),
                      )
                    }
                    sx={{ color: 'text.disabled', flexShrink: 0, '&:hover': { color: 'error.main' } }}
                  >
                    <DeleteIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Stack>
              ))}

              <Button
                id="invoice-add-item"
                startIcon={<AddIcon />}
                onClick={() => setItems((prev) => [...prev, blankItem()])}
                sx={{ alignSelf: 'flex-start' }}
              >
                Add line item
              </Button>
            </Stack>
          </SectionCard>

          <SectionCard title="Discount" padded>
            <Stack direction="row" spacing={1.5} alignItems="center">
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
              <TextField
                size="small"
                type="number"
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder="0"
                inputProps={{ 'aria-label': 'Discount value', style: { textAlign: 'right' } }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">{discountType === 'FLAT' ? '₹' : '%'}</InputAdornment>
                  ),
                }}
                sx={{ width: 140 }}
              />
            </Stack>
          </SectionCard>

          <SectionCard
            title="Tax"
            padded
            action={
              <Switch
                checked={taxEnabled}
                onChange={(e) => setTaxEnabled(e.target.checked)}
                inputProps={{ 'aria-label': 'Add tax' }}
              />
            }
          >
            {taxEnabled ? (
              <TextField
                size="small"
                type="number"
                value={taxPercent}
                onChange={(e) => setTaxPercent(e.target.value)}
                placeholder="18"
                inputProps={{ 'aria-label': 'Tax percent', style: { textAlign: 'right' } }}
                InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                sx={{ width: 140 }}
              />
            ) : (
              <Typography sx={{ fontSize: 12.5, color: 'text.disabled' }}>No tax on this invoice</Typography>
            )}
          </SectionCard>
        </Stack>

        {/* ── Total due + the money actions ─────────────────────── */}
        <Stack spacing={1.5}>
          <Card id="invoice-totals" sx={{ p: 2.5 }}>
            <Stack spacing={1}>
              <Stack direction="row" justifyContent="space-between">
                <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Subtotal</Typography>
                <Typography sx={{ fontSize: 13.5, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                  {inr(subtotal)}
                </Typography>
              </Stack>
              {discountAmount > 0 && (
                <Stack direction="row" justifyContent="space-between">
                  <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
                    Discount{discountType === 'PERCENT' ? ` (${discountValue}%)` : ''}
                  </Typography>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    −{inr(discountAmount)}
                  </Typography>
                </Stack>
              )}
              {taxAmount > 0 && (
                <Stack direction="row" justifyContent="space-between">
                  <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>Tax ({taxPercent}%)</Typography>
                  <Typography sx={{ fontSize: 13.5, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                    {inr(taxAmount)}
                  </Typography>
                </Stack>
              )}

              <Divider sx={{ my: 0.5 }} />

              <Kicker>Total due</Kicker>
              <Typography
                sx={{ fontSize: 30, fontWeight: 700, color: 'primary.main', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}
              >
                {inr(grandTotal)}
              </Typography>
            </Stack>
          </Card>

          {isPaid ? (
            <Stack
              direction="row"
              alignItems="center"
              justifyContent="center"
              spacing={1}
              sx={{ py: 1.5, borderRadius: 2, bgcolor: (t) => alpha(t.palette.success.main, 0.14), color: 'success.main' }}
            >
              <PaidIcon sx={{ fontSize: 20 }} />
              <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Paid</Typography>
            </Stack>
          ) : (
            <>
              <Button
                id="invoice-save"
                variant="contained"
                startIcon={<SaveIcon />}
                disabled={saveMutation.isPending || !hasItems}
                onClick={() => saveMutation.mutate()}
                sx={{ height: 46 }}
              >
                {saveMutation.isPending ? 'Saving…' : isNew ? 'Create invoice' : 'Save invoice'}
              </Button>
              <Button
                id="invoice-mark-paid"
                variant="outlined"
                color="success"
                startIcon={<PaidIcon />}
                // Marking paid PATCHes an existing invoice, so a draft that was
                // never saved has nothing to mark.
                disabled={isNew}
                onClick={() => setPayOpen(true)}
                sx={{ height: 46 }}
              >
                {isNew ? 'Save first to mark paid' : 'Mark as paid'}
              </Button>
            </>
          )}

          <Button id="invoice-share-whatsapp" variant="outlined" startIcon={<ShareIcon />} onClick={() => void share()}>
            Share
          </Button>

          <Stack direction="row" spacing={1.5}>
            <Button
              id="invoice-pdf"
              startIcon={<PdfIcon />}
              disabled={isGeneratingPdf || !hasItems}
              onClick={() => void downloadPdf()}
              sx={{ flex: 1 }}
            >
              {isGeneratingPdf ? 'Building…' : 'PDF'}
            </Button>
            <Button id="invoice-print" startIcon={<PrintIcon />} onClick={() => window.print()} sx={{ flex: 1 }}>
              Print
            </Button>
          </Stack>
        </Stack>
      </Box>

      <Dialog id="payment-modal" open={payOpen} onClose={() => setPayOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontSize: 16, fontWeight: 700 }}>How was it paid?</DialogTitle>
        <DialogContent sx={{ pb: 3 }}>
          <Stack spacing={1}>
            {PAYMENT_METHODS.map(({ value, label, icon: Icon }) => (
              <ButtonBase
                key={value}
                disabled={payMutation.isPending}
                onClick={() => payMutation.mutate(value)}
                sx={{
                  display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.5,
                  borderRadius: 2, border: 1, borderColor: 'divider', justifyContent: 'flex-start',
                  '&:hover': { borderColor: 'primary.main', bgcolor: (t) => alpha(t.palette.primary.main, 0.06) },
                }}
              >
                <Icon sx={{ fontSize: 20, color: 'text.secondary' }} />
                <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{label}</Typography>
              </ButtonBase>
            ))}
          </Stack>
        </DialogContent>
      </Dialog>
    </PageShell>
  )
}
