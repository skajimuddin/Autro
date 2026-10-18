// The editable body of an estimate or an invoice — line items, discount, GST.
//
// Both editors draw exactly this; it lives here so a fix to the phone layout
// is made once. Each line is a small card (description on top, then
// Qty × Rate = Amount underneath) because four inputs in one row leave the
// description about 100px wide on a 360px phone.
import { Box, Button, IconButton, InputAdornment, Stack, Switch, TextField, Typography } from '@mui/material'
import AddIcon from '@mui/icons-material/AddRounded'
import CloseIcon from '@mui/icons-material/CloseRounded'

import { SectionCard } from '@/components/ui/section-card'
import { SegmentedControl } from '@/components/ui/segmented-control'
import type { BillTotals } from '@autro/shared'
import { blankItem, type DraftItem } from '@/lib/bill-draft'
import { inrExact } from '@/lib/format'

// ── Line items ────────────────────────────────────────────────────────────────

interface LineItemsCardProps {
  idPrefix: string
  items: DraftItem[]
  onChange: (items: DraftItem[]) => void
  disabled?: boolean
}

export function LineItemsCard({ idPrefix, items, onChange, disabled }: LineItemsCardProps): React.JSX.Element {
  const update = (tempId: string, patch: Partial<DraftItem>): void =>
    onChange(items.map((i) => (i.tempId === tempId ? { ...i, ...patch } : i)))

  return (
    <SectionCard title="Items" padded>
      <Stack spacing={1.5}>
        {items.map((item, idx) => {
          const lineTotal = (Number(item.amount) || 0) * (Number(item.quantity) || 1)
          return (
            <Box
              key={item.tempId}
              sx={{ border: 1, borderColor: 'divider', borderRadius: 2, p: 1.5, bgcolor: 'background.default' }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <TextField
                  size="small"
                  fullWidth
                  disabled={disabled}
                  value={item.description}
                  onChange={(e) => update(item.tempId, { description: e.target.value })}
                  placeholder="Item or service, e.g. Engine oil"
                  inputProps={{ 'aria-label': `Item ${idx + 1} description`, maxLength: 200 }}
                />
                <IconButton
                  aria-label={`Remove item ${idx + 1}`}
                  disabled={disabled}
                  // Never leave the list empty — an editor with no rows has no
                  // affordance to start typing again.
                  onClick={() => onChange(items.length === 1 ? [blankItem()] : items.filter((i) => i.tempId !== item.tempId))}
                  sx={{ color: 'text.disabled', flexShrink: 0, '&:hover': { color: 'error.main' } }}
                >
                  <CloseIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Stack>

              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.25 }}>
                <TextField
                  size="small"
                  label="Qty"
                  disabled={disabled}
                  value={item.quantity}
                  onChange={(e) => update(item.tempId, { quantity: e.target.value.replace(/\D/g, '') })}
                  inputProps={{ inputMode: 'numeric', style: { textAlign: 'center' } }}
                  sx={{ width: 72, flexShrink: 0 }}
                />
                <TextField
                  size="small"
                  label="Rate"
                  disabled={disabled}
                  value={item.amount}
                  onChange={(e) => update(item.tempId, { amount: e.target.value.replace(/[^\d.]/g, '') })}
                  placeholder="0"
                  inputProps={{ inputMode: 'decimal', style: { textAlign: 'right' } }}
                  InputProps={{ startAdornment: <InputAdornment position="start">₹</InputAdornment> }}
                  sx={{ flex: 1, minWidth: 0 }}
                />
                <Typography
                  sx={{ width: 92, flexShrink: 0, textAlign: 'right', fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}
                >
                  {inrExact(lineTotal)}
                </Typography>
              </Stack>
            </Box>
          )
        })}

        <Button
          id={`${idPrefix}-add-item`}
          startIcon={<AddIcon />}
          disabled={disabled}
          onClick={() => onChange([...items, blankItem()])}
          sx={{ alignSelf: 'flex-start' }}
        >
          Add another item
        </Button>
      </Stack>
    </SectionCard>
  )
}

// ── Discount ──────────────────────────────────────────────────────────────────

interface DiscountCardProps {
  idPrefix: string
  type: 'FLAT' | 'PERCENT'
  value: string
  onType: (t: 'FLAT' | 'PERCENT') => void
  onValue: (v: string) => void
  disabled?: boolean
}

export function DiscountCard({ idPrefix, type, value, onType, onValue, disabled }: DiscountCardProps): React.JSX.Element {
  return (
    <SectionCard title="Discount" padded>
      <Stack direction="row" spacing={1.5} alignItems="center">
        <SegmentedControl
          id={`${idPrefix}-discount-type`}
          aria-label="Discount type"
          value={type}
          onChange={onType}
          options={[
            { value: 'FLAT', label: '₹ Flat' },
            { value: 'PERCENT', label: '%' },
          ]}
        />
        <TextField
          size="small"
          disabled={disabled}
          value={value}
          onChange={(e) => onValue(e.target.value.replace(/[^\d.]/g, ''))}
          placeholder="0"
          inputProps={{ 'aria-label': 'Discount value', inputMode: 'decimal', style: { textAlign: 'right' } }}
          InputProps={{ startAdornment: <InputAdornment position="start">{type === 'FLAT' ? '₹' : '%'}</InputAdornment> }}
          sx={{ flex: 1, maxWidth: 160 }}
        />
      </Stack>
    </SectionCard>
  )
}

// ── GST ───────────────────────────────────────────────────────────────────────

interface GstCardProps {
  enabled: boolean
  percent: string
  onEnabled: (v: boolean) => void
  onPercent: (v: string) => void
  disabled?: boolean
}

/** Rendered only when the garage has GST turned on in Settings. */
export function GstCard({ enabled, percent, onEnabled, onPercent, disabled }: GstCardProps): React.JSX.Element {
  return (
    <SectionCard
      title="GST"
      padded
      action={
        <Switch
          checked={enabled}
          disabled={disabled}
          onChange={(e) => onEnabled(e.target.checked)}
          inputProps={{ 'aria-label': 'Charge GST on this bill' }}
        />
      }
    >
      {enabled ? (
        <Stack direction="row" spacing={1.5} alignItems="center">
          <TextField
            size="small"
            disabled={disabled}
            value={percent}
            onChange={(e) => onPercent(e.target.value.replace(/[^\d.]/g, ''))}
            inputProps={{ 'aria-label': 'GST rate', inputMode: 'decimal', style: { textAlign: 'right' } }}
            InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
            sx={{ width: 120 }}
          />
          <Typography sx={{ fontSize: 12, color: 'text.disabled' }}>Split equally into CGST and SGST</Typography>
        </Stack>
      ) : (
        <Typography sx={{ fontSize: 12.5, color: 'text.disabled' }}>No GST on this bill</Typography>
      )}
    </SectionCard>
  )
}

// ── Totals ────────────────────────────────────────────────────────────────────

function Line({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="baseline">
      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{label}</Typography>
      <Typography sx={{ fontSize: 13.5, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>{value}</Typography>
    </Stack>
  )
}

/** The lines above the grand total: subtotal, discount, CGST/SGST, round off. */
export function TotalsLines({ bill, gstPercent }: { bill: BillTotals; gstPercent: number }): React.JSX.Element {
  return (
    <>
      <Line label="Subtotal" value={inrExact(bill.subtotal)} />
      {bill.discount > 0 && <Line label="Discount" value={`−${inrExact(bill.discount)}`} />}
      {bill.tax > 0 && (
        <>
          <Line label={`CGST (${gstPercent / 2}%)`} value={inrExact(bill.cgst)} />
          <Line label={`SGST (${gstPercent / 2}%)`} value={inrExact(bill.sgst)} />
        </>
      )}
      {bill.roundOff !== 0 && (
        <Line label="Round off" value={`${bill.roundOff > 0 ? '+' : '−'}${inrExact(Math.abs(bill.roundOff))}`} />
      )}
    </>
  )
}

// ── Notes ─────────────────────────────────────────────────────────────────────

export function NotesCard({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }): React.JSX.Element {
  return (
    <SectionCard title="Notes" padded>
      <TextField
        fullWidth
        multiline
        minRows={2}
        size="small"
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Printed on the document — e.g. next service at 10,000 km"
        inputProps={{ 'aria-label': 'Notes', maxLength: 500 }}
      />
    </SectionCard>
  )
}
