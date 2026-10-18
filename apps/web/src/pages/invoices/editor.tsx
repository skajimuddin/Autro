// Invoice editor — the same line items as an estimate, plus the money actions:
// PDF, share, and marking it paid.
//
// Two columns at md:+ with the total due and the actions on the right. On a
// phone the total and the primary action ride in a bar fixed to the bottom, so
// a long bill never scrolls them away.
//
// The arithmetic is computeBill() from @autro/shared — the same function the
// API freezes the total with, so the figure on screen, on the PDF and in the
// database is one figure.
import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Box, Button, ButtonBase, Card, Dialog, DialogContent, DialogTitle, Divider, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import SaveIcon from '@mui/icons-material/SaveOutlined'
import PdfIcon from '@mui/icons-material/PictureAsPdfOutlined'
import ShareIcon from '@mui/icons-material/IosShareRounded'
import PaidIcon from '@mui/icons-material/CheckCircleRounded'
import CashIcon from '@mui/icons-material/PaymentsOutlined'
import UpiIcon from '@mui/icons-material/SmartphoneOutlined'
import CardIcon from '@mui/icons-material/CreditCardOutlined'
import WalletIcon from '@mui/icons-material/AccountBalanceWalletOutlined'
import { computeBill } from '@autro/shared'

import { apiFetch } from '@/lib/api'
import { downloadInvoicePdf, shareInvoicePdf, type InvoicePdfData } from '@/lib/pdf'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import { Kicker } from '@/components/ui/kicker'
import { useToast, ToastContainer } from '@/components/ui/toast'
import { FullPageSpinner } from '@/components/ui/loading'
import { DiscountCard, GstCard, LineItemsCard, NotesCard, TotalsLines } from '@/components/domain/bill-form'
import { blankItem, isFilled, toApiItems, toNumbers, type DraftItem } from '@/lib/bill-draft'
import { docNumber, inr, inrExact } from '@/lib/format'

interface InvoiceDetail {
  id: string
  number: number
  visit_id: string
  items: { id: string; description: string; amount: number; quantity: number }[]
  discount_type: 'FLAT' | 'PERCENT' | null
  discount_value: number
  tax_enabled: boolean
  tax_percent: number
  payment_status: 'UNPAID' | 'PAID'
  payment_method: string | null
  notes: string | null
  created_at: string
  registration_number?: string
  customer_name?: string
  customer_phone?: string
}

type PaymentMethod = 'CASH' | 'UPI' | 'CARD' | 'OTHER'

const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: React.ElementType }[] = [
  { value: 'CASH', label: 'Cash', icon: CashIcon },
  { value: 'UPI', label: 'UPI', icon: UpiIcon },
  { value: 'CARD', label: 'Card', icon: CardIcon },
  { value: 'OTHER', label: 'Other', icon: WalletIcon },
]

export default function InvoiceEditorPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const visitId = searchParams.get('visit')
  const navigate = useNavigate()
  const { tenant } = useTenant()
  const queryClient = useQueryClient()
  const { toasts, showToast, dismissToast } = useToast()

  const isNew = !id || id === 'new'
  const gstAvailable = Boolean(tenant?.gst_enabled)

  const [items, setItems] = useState<DraftItem[]>([blankItem()])
  // A garage that bills GST starts every new bill with it on.
  const [taxEnabled, setTaxEnabled] = useState(gstAvailable)
  const [taxPercent, setTaxPercent] = useState(String(tenant?.gst_percent ?? ''))
  const [discountType, setDiscountType] = useState<'FLAT' | 'PERCENT'>('FLAT')
  const [discountValue, setDiscountValue] = useState('')
  const [notes, setNotes] = useState('')
  const [payOpen, setPayOpen] = useState(false)
  const [busy, setBusy] = useState<'pdf' | 'share' | null>(null)

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
    setTaxEnabled(Boolean(existing.tax_enabled))
    setTaxPercent(String(existing.tax_percent || tenant?.gst_percent || ''))
    if (existing.discount_type) setDiscountType(existing.discount_type)
    setDiscountValue(existing.discount_value ? String(existing.discount_value) : '')
    setNotes(existing.notes ?? '')
  }, [existing, tenant?.gst_percent])

  const isPaid = existing?.payment_status === 'PAID'
  const gstOn = gstAvailable && taxEnabled
  const gstPercent = Number(taxPercent) || 0
  const bill = computeBill({
    items: toNumbers(items),
    discountType: Number(discountValue) > 0 ? discountType : null,
    discountValue: Number(discountValue) || 0,
    taxEnabled: gstOn,
    taxPercent: gstPercent,
  })

  const hasItems = items.some(isFilled)
  const gstInvalid = gstOn && (gstPercent <= 0 || gstPercent > 100)
  const canSave = hasItems && !gstInvalid
  const numberLabel = existing ? docNumber('invoice', tenant?.pdf_template, existing.number) : null

  const pdfData = (): InvoicePdfData => {
    if (!tenant || !existing) throw new Error('Save the invoice first')
    return {
      number: existing.number,
      date: existing.created_at,
      garage: {
        name: tenant.name,
        phone: tenant.phone,
        address: tenant.address,
        logo_url: tenant.logo_url,
        gstin: tenant.gst_enabled ? tenant.gstin : null,
      },
      template: tenant.pdf_template,
      customer: {
        name: existing.customer_name ?? '—',
        phone: existing.customer_phone ?? '—',
        registration: existing.registration_number ?? '—',
      },
      items: toApiItems(items),
      bill,
      gstPercent,
      paymentStatus: isPaid ? 'PAID' : 'UNPAID',
      notes: notes.trim() || null,
    }
  }

  const runPdf = async (mode: 'pdf' | 'share'): Promise<void> => {
    setBusy(mode)
    try {
      if (mode === 'pdf') {
        await downloadInvoicePdf(pdfData())
      } else {
        const message = `Invoice ${numberLabel} from ${tenant?.name}: ${inr(bill.total)}${isPaid ? ' (paid)' : ''}. Thank you!`
        await shareInvoicePdf(pdfData(), message)
      }
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Could not generate the PDF')
    } finally {
      setBusy(null)
    }
  }

  const saveMutation = useMutation({
    mutationFn: () => {
      const body = {
        items: toApiItems(items),
        discount_type: Number(discountValue) > 0 ? discountType : null,
        discount_value: Number(discountValue) || 0,
        tax_enabled: gstOn,
        tax_percent: gstOn ? gstPercent : 0,
        notes: notes.trim(),
      }
      return isNew
        ? apiFetch<{ id: string }>('/invoices', {
            method: 'POST',
            body: JSON.stringify({ ...body, visit_id: visitId }),
            tenantId: tenant?.id,
          })
        : apiFetch(`/invoices/${id}`, { method: 'PATCH', body: JSON.stringify(body), tenantId: tenant?.id })
    },
    onSuccess: (res) => {
      showToast('success', isNew ? 'Invoice created' : 'Invoice saved')
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['invoice', id] })
      // The dashboard counts unpaid invoices and the vehicle screen prints
      // this total; both are stale the moment this succeeds.
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['vehicle'] })
      // Land on the saved invoice: sharing it and taking payment is what comes next.
      if (isNew) void navigate(`/invoices/${(res as { id: string }).id}`, { replace: true })
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
      queryClient.invalidateQueries({ queryKey: ['invoice', id] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['vehicle'] })
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to mark as paid'),
  })

  if (isLoading && !isNew) return <FullPageSpinner />

  const saveButton = (buttonId: string): React.JSX.Element => (
    <Button
      id={buttonId}
      variant="contained"
      startIcon={<SaveIcon />}
      disabled={saveMutation.isPending || !canSave}
      onClick={() => saveMutation.mutate()}
      sx={{ height: 46 }}
    >
      {saveMutation.isPending ? 'Saving…' : isNew ? 'Create invoice' : 'Save changes'}
    </Button>
  )

  return (
    <PageShell
      title={numberLabel ? `Invoice ${numberLabel}` : 'New invoice'}
      mobileTitle="Invoice"
      mobileSubtitle={existing?.registration_number}
      showBack
      hideNav
      wide
    >
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <Box
        sx={{
          px: { xs: 2, md: 3.5 }, pb: { xs: 12, md: 4 },
          display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 340px' },
          gap: 2.5, alignItems: 'start',
        }}
      >
        {/* On a phone a saved invoice leads with its total and the money
            actions; a new one leads with the items you are typing. */}
        <Stack spacing={2.5} sx={{ order: { xs: isNew ? 0 : 1, md: 0 } }}>
          {isPaid && (
            <Stack
              direction="row"
              alignItems="center"
              spacing={1}
              sx={{ px: 2, py: 1.25, borderRadius: 2, bgcolor: (t) => alpha(t.palette.success.main, 0.14), color: 'success.main' }}
            >
              <PaidIcon sx={{ fontSize: 20 }} />
              <Typography sx={{ fontSize: 13.5, fontWeight: 700 }}>
                Paid{existing?.payment_method ? ` · ${existing.payment_method}` : ''} — this invoice is locked
              </Typography>
            </Stack>
          )}

          <LineItemsCard idPrefix="invoice" items={items} onChange={setItems} disabled={isPaid} />
          <DiscountCard
            idPrefix="invoice"
            type={discountType}
            value={discountValue}
            onType={setDiscountType}
            onValue={setDiscountValue}
            disabled={isPaid}
          />
          {gstAvailable && (
            <GstCard enabled={taxEnabled} percent={taxPercent} onEnabled={setTaxEnabled} onPercent={setTaxPercent} disabled={isPaid} />
          )}
          <NotesCard value={notes} onChange={setNotes} disabled={isPaid} />
        </Stack>

        {/* ── Total due + the money actions ─────────────────────── */}
        <Stack spacing={1.5} sx={{ order: { xs: isNew ? 1 : 0, md: 0 } }}>
          <Card id="invoice-totals" sx={{ p: 2.5 }}>
            <Stack spacing={1}>
              <TotalsLines bill={bill} gstPercent={gstPercent} />
              <Divider sx={{ my: 0.5 }} />
              <Kicker>Total due</Kicker>
              <Typography
                sx={{ fontSize: 30, fontWeight: 700, color: 'primary.main', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}
              >
                {inrExact(bill.total)}
              </Typography>
            </Stack>
          </Card>

          {!isPaid && (
            <>
              <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column' }}>{saveButton('invoice-save')}</Box>
              {!isNew && (
                <Button
                  id="invoice-mark-paid"
                  variant="outlined"
                  color="success"
                  startIcon={<PaidIcon />}
                  onClick={() => setPayOpen(true)}
                  sx={{ height: 46 }}
                >
                  Mark as paid
                </Button>
              )}
            </>
          )}

          <Stack direction="row" spacing={1.5}>
            <Button
              id="invoice-share-whatsapp"
              variant="outlined"
              startIcon={<ShareIcon />}
              disabled={isNew || busy !== null}
              onClick={() => void runPdf('share')}
              sx={{ flex: 1, height: 46 }}
            >
              {busy === 'share' ? 'Preparing…' : 'Share'}
            </Button>
            <Button
              id="invoice-pdf"
              variant="outlined"
              startIcon={<PdfIcon />}
              disabled={isNew || busy !== null}
              onClick={() => void runPdf('pdf')}
              sx={{ flex: 1, height: 46 }}
            >
              {busy === 'pdf' ? 'Building…' : 'PDF'}
            </Button>
          </Stack>
          {isNew && (
            <Typography sx={{ fontSize: 12, color: 'text.disabled', textAlign: 'center' }}>
              Create the invoice to share it or download the PDF.
            </Typography>
          )}
        </Stack>
      </Box>

      {/* ── Bottom bar (mobile): total + the primary action ─────────── */}
      <Stack
        direction="row"
        alignItems="center"
        spacing={2}
        sx={{
          display: { xs: 'flex', md: 'none' },
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30,
          px: 2, pt: 1.25, pb: 'max(env(safe-area-inset-bottom, 0px), 12px)',
          bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider',
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Kicker>{isPaid ? 'Paid' : 'Total due'}</Kicker>
          <Typography sx={{ fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1.15 }}>
            {inrExact(bill.total)}
          </Typography>
        </Box>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          {isPaid ? null : saveButton('invoice-save-mobile')}
        </Box>
      </Stack>

      <Dialog id="payment-modal" open={payOpen} onClose={() => setPayOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontSize: 16, fontWeight: 700 }}>How was it paid?</DialogTitle>
        <DialogContent sx={{ pb: 3 }}>
          <Typography sx={{ fontSize: 12.5, color: 'text.secondary', mb: 1.5 }}>
            {inrExact(bill.total)} — the invoice is locked once marked paid, and the vehicle is marked delivered.
          </Typography>
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
