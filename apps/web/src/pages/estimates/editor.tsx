// Estimate editor — line items, discount, tax, total.
//
// Migrated 2026-08-20 onto the MUI design system. The line-item row is the
// whole screen, so it gets the room: description takes the width, quantity and
// amount are fixed and right-aligned, and the running total sits at the bottom
// where an owner reads it out to a customer.
//
// The arithmetic is deliberately the backend's: discount comes off the
// subtotal, then tax applies to what is left. Taxing the pre-discount subtotal
// disagrees with the total the server freezes, and the customer sees both.
import { useState, useCallback, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box, Button, Divider, IconButton, InputAdornment, Stack, Switch, TextField, Typography,
} from '@mui/material'
import AddIcon from '@mui/icons-material/AddRounded'
import DeleteIcon from '@mui/icons-material/DeleteOutlineRounded'
import SaveIcon from '@mui/icons-material/SaveOutlined'
import ArrowIcon from '@mui/icons-material/ArrowForwardRounded'

import { apiFetch } from '@/lib/api'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import { SectionCard } from '@/components/ui/section-card'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { useToast, ToastContainer } from '@/components/ui/toast'
import { FullPageSpinner } from '@/components/ui/loading'
import { inr } from '@/lib/format'

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
}

interface DraftItem {
  tempId: string
  description: string
  amount: string
  quantity: string
}

const blankItem = (): DraftItem => ({
  tempId: crypto.randomUUID(),
  description: '',
  amount: '',
  quantity: '1',
})

export default function EstimateEditorPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>()
  const [searchParams] = useSearchParams()
  const visitId = searchParams.get('visit')
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
    setTaxEnabled(existing.tax_enabled)
    setTaxPercent(String(existing.tax_percent))
    if (existing.discount_type) setDiscountType(existing.discount_type)
    setDiscountValue(String(existing.discount_value))
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
      return isNew
        ? apiFetch<{ id: string }>('/estimates', {
            method: 'POST',
            body: JSON.stringify(body),
            tenantId: tenant?.id,
          })
        : apiFetch(`/estimates/${id}`, {
            method: 'PATCH',
            body: JSON.stringify(body),
            tenantId: tenant?.id,
          })
    },
    onSuccess: () => {
      showToast('success', isNew ? 'Estimate created' : 'Estimate saved')
      queryClient.invalidateQueries({ queryKey: ['estimates'] })
      // The vehicle screen prints this estimate's total.
      queryClient.invalidateQueries({ queryKey: ['vehicle'] })
      if (isNew) void navigate(-1)
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to save estimate'),
  })

  if (isLoading && !isNew) return <FullPageSpinner />

  const hasItems = items.some((i) => i.description.trim() && Number(i.amount) > 0)

  return (
    <PageShell title="Estimate" mobileTitle="Estimate" showBack hideNav>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <Box sx={{ px: { xs: 2, md: 3.5 }, pb: 4, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
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
                  // Never leave the list empty — an editor with no rows has no
                  // affordance to start typing again.
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
              id="estimate-add-item"
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
              id="estimate-discount-type"
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
            <Typography sx={{ fontSize: 12.5, color: 'text.disabled' }}>
              No tax on this estimate
            </Typography>
          )}
        </SectionCard>

        <SectionCard id="estimate-totals" padded>
          <Stack spacing={1}>
            <TotalLine label="Subtotal" value={subtotal} />
            {discountAmount > 0 && (
              <TotalLine
                label={`Discount${discountType === 'PERCENT' ? ` (${discountValue}%)` : ''}`}
                value={-discountAmount}
              />
            )}
            {taxAmount > 0 && <TotalLine label={`Tax (${taxPercent}%)`} value={taxAmount} />}
            <Divider sx={{ my: 0.5 }} />
            <Stack direction="row" justifyContent="space-between" alignItems="baseline">
              <Typography sx={{ fontSize: 14, fontWeight: 700 }}>Total</Typography>
              <Typography
                sx={{ fontSize: 26, fontWeight: 700, color: 'primary.main', fontVariantNumeric: 'tabular-nums' }}
              >
                {inr(grandTotal)}
              </Typography>
            </Stack>
          </Stack>
        </SectionCard>

        <Stack spacing={1.5}>
          <Button
            id="estimate-save"
            variant="contained"
            startIcon={<SaveIcon />}
            disabled={saveMutation.isPending || !hasItems}
            onClick={() => saveMutation.mutate()}
            sx={{ height: 46 }}
          >
            {saveMutation.isPending ? 'Saving…' : isNew ? 'Create estimate' : 'Save estimate'}
          </Button>
          <Button
            id="estimate-convert"
            variant="outlined"
            endIcon={<ArrowIcon />}
            // Converting reads the saved estimate by id, so a draft that has
            // never been saved has nothing to convert.
            disabled={isNew}
            onClick={() => void navigate(`/invoices/new?from_estimate=${id}`)}
            sx={{ height: 46 }}
          >
            {isNew ? 'Save first to convert' : 'Convert to invoice'}
          </Button>
        </Stack>
      </Box>
    </PageShell>
  )
}

function TotalLine({ label, value }: { label: string; value: number }): React.JSX.Element {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="baseline">
      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{label}</Typography>
      <Typography sx={{ fontSize: 13.5, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
        {inr(value)}
      </Typography>
    </Stack>
  )
}
