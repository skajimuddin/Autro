// Estimate editor — line items, discount, GST, total.
//
// Shares its form body with the invoice editor (components/domain/bill-form)
// and its arithmetic with the API (computeBill in @autro/shared), so the
// quotation a customer is shown always adds up to what the invoice will.
// On a phone the total and the primary action ride in a bar fixed to the
// bottom of the screen.
import { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Box, Button, Divider, Stack, Typography } from '@mui/material'
import SaveIcon from '@mui/icons-material/SaveOutlined'
import ArrowIcon from '@mui/icons-material/ArrowForwardRounded'
import PdfIcon from '@mui/icons-material/PictureAsPdfOutlined'
import ShareIcon from '@mui/icons-material/IosShareRounded'
import { computeBill } from '@autro/shared'

import { apiFetch } from '@/lib/api'
import { downloadEstimatePdf, shareEstimatePdf, type EstimatePdfData } from '@/lib/pdf'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import { SectionCard } from '@/components/ui/section-card'
import { Kicker } from '@/components/ui/kicker'
import { useToast, ToastContainer } from '@/components/ui/toast'
import { FullPageSpinner } from '@/components/ui/loading'
import { DiscountCard, GstCard, LineItemsCard, NotesCard, TotalsLines } from '@/components/domain/bill-form'
import { blankItem, isFilled, toApiItems, toNumbers, type DraftItem } from '@/lib/bill-draft'
import { docNumber, inr, inrExact } from '@/lib/format'

interface EstimateDetail {
  id: string
  number: number
  visit_id: string
  items: { id: string; description: string; amount: number; quantity: number }[]
  discount_type: 'FLAT' | 'PERCENT' | null
  discount_value: number
  tax_enabled: boolean
  tax_percent: number
  notes: string | null
  status: string
  created_at: string
  registration_number?: string
  customer_name?: string
  customer_phone?: string
}

export default function EstimateEditorPage(): React.JSX.Element {
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
  const [busy, setBusy] = useState<'pdf' | 'share' | null>(null)

  const { data: existing, isLoading } = useQuery<EstimateDetail>({
    queryKey: ['estimate', id],
    queryFn: () => apiFetch<EstimateDetail>(`/estimates/${id}`, { tenantId: tenant?.id }),
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
  const numberLabel = existing ? docNumber('estimate', tenant?.pdf_template, existing.number) : null

  const pdfData = (): EstimatePdfData => {
    if (!tenant || !existing) throw new Error('Save the estimate first')
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
      notes: notes.trim() || null,
    }
  }

  const runPdf = async (mode: 'pdf' | 'share'): Promise<void> => {
    setBusy(mode)
    try {
      if (mode === 'pdf') {
        await downloadEstimatePdf(pdfData())
      } else {
        const message = `Quotation ${numberLabel} from ${tenant?.name}: ${inr(bill.total)}. Let us know if you'd like to go ahead.`
        await shareEstimatePdf(pdfData(), message)
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
        ? apiFetch<{ id: string }>('/estimates', {
            method: 'POST',
            body: JSON.stringify({ ...body, visit_id: visitId }),
            tenantId: tenant?.id,
          })
        : apiFetch(`/estimates/${id}`, { method: 'PATCH', body: JSON.stringify(body), tenantId: tenant?.id })
    },
    onSuccess: (res) => {
      showToast('success', isNew ? 'Estimate created' : 'Estimate saved')
      queryClient.invalidateQueries({ queryKey: ['estimates'] })
      queryClient.invalidateQueries({ queryKey: ['estimate', id] })
      // The vehicle screen prints this estimate's total.
      queryClient.invalidateQueries({ queryKey: ['vehicle'] })
      // Land on the saved estimate: sharing it or converting it is what comes next.
      if (isNew) void navigate(`/estimates/${(res as { id: string }).id}`, { replace: true })
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to save estimate'),
  })

  // The server copies the saved estimate into an invoice (and hands back the
  // existing one if it was already converted), so convert the *saved* version.
  const convertMutation = useMutation({
    mutationFn: () =>
      apiFetch<{ invoice_id: string }>(`/invoices/from-estimate/${id}`, { method: 'POST', tenantId: tenant?.id }),
    onSuccess: ({ invoice_id }) => {
      queryClient.invalidateQueries({ queryKey: ['estimates'] })
      queryClient.invalidateQueries({ queryKey: ['estimate', id] })
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['vehicle'] })
      void navigate(`/invoices/${invoice_id}`)
    },
    onError: (err: Error) => showToast('error', err.message || 'Could not convert the estimate'),
  })

  if (isLoading && !isNew) return <FullPageSpinner />

  const converted = existing?.status === 'CONVERTED'

  const saveButton = (buttonId: string): React.JSX.Element => (
    <Button
      id={buttonId}
      variant="contained"
      startIcon={<SaveIcon />}
      disabled={saveMutation.isPending || !canSave}
      onClick={() => saveMutation.mutate()}
      sx={{ height: 46 }}
    >
      {saveMutation.isPending ? 'Saving…' : isNew ? 'Create estimate' : 'Save changes'}
    </Button>
  )

  return (
    <PageShell
      title={numberLabel ? `Estimate ${numberLabel}` : 'New estimate'}
      mobileTitle="Estimate"
      mobileSubtitle={existing?.registration_number}
      showBack
      hideNav
    >
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <Box sx={{ px: { xs: 2, md: 3.5 }, pb: { xs: 12, md: 4 }, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <LineItemsCard idPrefix="estimate" items={items} onChange={setItems} />
        <DiscountCard
          idPrefix="estimate"
          type={discountType}
          value={discountValue}
          onType={setDiscountType}
          onValue={setDiscountValue}
        />
        {gstAvailable && (
          <GstCard enabled={taxEnabled} percent={taxPercent} onEnabled={setTaxEnabled} onPercent={setTaxPercent} />
        )}
        <NotesCard value={notes} onChange={setNotes} />

        <SectionCard id="estimate-totals" padded>
          <Stack spacing={1}>
            <TotalsLines bill={bill} gstPercent={gstPercent} />
            <Divider sx={{ my: 0.5 }} />
            <Stack direction="row" justifyContent="space-between" alignItems="baseline">
              <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Total</Typography>
              <Typography
                sx={{ fontSize: 26, fontWeight: 700, color: 'primary.main', fontVariantNumeric: 'tabular-nums' }}
              >
                {inrExact(bill.total)}
              </Typography>
            </Stack>
          </Stack>
        </SectionCard>

        <Stack direction="row" spacing={1.5}>
          <Button
            id="estimate-share-whatsapp"
            variant="outlined"
            startIcon={<ShareIcon />}
            disabled={isNew || busy !== null}
            onClick={() => void runPdf('share')}
            sx={{ flex: 1, height: 46 }}
          >
            {busy === 'share' ? 'Preparing…' : 'Share'}
          </Button>
          <Button
            id="estimate-download-pdf"
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
          <Typography sx={{ fontSize: 12, color: 'text.disabled', textAlign: 'center', mt: -1.5 }}>
            Create the estimate to share it or download the PDF.
          </Typography>
        )}

        {!isNew && (
          <Button
            id="estimate-convert"
            variant="outlined"
            endIcon={<ArrowIcon />}
            disabled={convertMutation.isPending}
            onClick={() => convertMutation.mutate()}
            sx={{ height: 46 }}
          >
            {convertMutation.isPending ? 'Converting…' : converted ? 'View invoice' : 'Convert to invoice'}
          </Button>
        )}

        <Box sx={{ display: { xs: 'none', md: 'flex' }, flexDirection: 'column' }}>{saveButton('estimate-save')}</Box>
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
          <Kicker>Total</Kicker>
          <Typography sx={{ fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1.15 }}>
            {inrExact(bill.total)}
          </Typography>
        </Box>
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>{saveButton('estimate-save-mobile')}</Box>
      </Stack>
    </PageShell>
  )
}
