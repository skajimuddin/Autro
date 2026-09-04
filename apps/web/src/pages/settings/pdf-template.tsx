// Settings → Invoice & estimate PDFs — what the generated documents show.
//
// Deliberately narrow: these are presentation toggles and short strings, not
// a layout editor. The numbers on a PDF always come from the estimate/invoice
// itself; nothing here can change what a document adds up to.
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Box, Button, Stack, Switch, Typography } from '@mui/material'
import type { PdfTemplate } from '@autro/shared'
import { DEFAULT_PDF_TEMPLATE } from '@autro/shared'

import { apiFetch } from '@/lib/api'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import { SectionCard } from '@/components/ui/section-card'
import { Field } from '@/components/ui/field'
import { useToast, ToastContainer } from '@/components/ui/toast'
import { FullPageSpinner } from '@/components/ui/loading'
import { BRAND } from '@/theme'

function ToggleRow({
  label,
  helper,
  checked,
  onChange,
}: {
  label: string
  helper: string
  checked: boolean
  onChange: (v: boolean) => void
}): React.JSX.Element {
  return (
    <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
      <Box sx={{ minWidth: 0 }}>
        <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>{label}</Typography>
        <Typography sx={{ fontSize: 11.5, color: 'text.disabled', mt: 0.25 }}>{helper}</Typography>
      </Box>
      <Switch checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </Stack>
  )
}

export default function SettingsPdfTemplatePage(): React.JSX.Element {
  const { tenant, refetch } = useTenant()
  const { toasts, showToast, dismissToast } = useToast()

  const [form, setForm] = useState<PdfTemplate>({ ...DEFAULT_PDF_TEMPLATE, ...tenant?.pdf_template })

  const mutation = useMutation({
    mutationFn: (data: PdfTemplate) =>
      apiFetch(`/tenants/${tenant?.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ pdf_template: data }),
        tenantId: tenant?.id,
      }),
    onSuccess: () => {
      showToast('success', 'PDF template saved')
      refetch()
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to save'),
  })

  const set = <K extends keyof PdfTemplate>(key: K, value: PdfTemplate[K]): void =>
    setForm((prev) => ({ ...prev, [key]: value }))

  const accentInvalid = Boolean(form.accent_color) && !/^#[0-9a-fA-F]{6}$/.test(form.accent_color ?? '')

  if (!tenant) return <FullPageSpinner />

  return (
    <PageShell title="Invoice & estimate PDFs" mobileTitle="PDF template" showBack hideNav>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <Box sx={{ px: { xs: 2, md: 3.5 }, pb: 4, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <SectionCard id="pdf-toggles-card" title="What's on the document" padded>
          <Stack spacing={2.5} divider={<Box sx={{ borderBottom: 1, borderColor: 'divider' }} />}>
            <ToggleRow
              label="Garage logo"
              helper="Printed at the top of every invoice and quotation, when uploaded"
              checked={form.show_logo}
              onChange={(v) => set('show_logo', v)}
            />
            <ToggleRow
              label="Garage address"
              helper="Printed under the garage name and phone"
              checked={form.show_address}
              onChange={(v) => set('show_address', v)}
            />
            <ToggleRow
              label="Item numbers"
              helper="Number each line item (1, 2, 3…) in its own column"
              checked={form.show_item_numbers}
              onChange={(v) => set('show_item_numbers', v)}
            />
          </Stack>
        </SectionCard>

        <SectionCard id="pdf-text-card" title="Text" padded>
          <Stack spacing={2.5}>
            <Field
              id="pdf-footer-note"
              label="Footer note"
              helper="One short line under the totals — a GSTIN, a UPI ID, a thank-you"
              value={form.footer_note ?? ''}
              onChange={(e) => set('footer_note', e.target.value)}
              placeholder="GSTIN: 21AAAAA0000A1Z5"
            />
            <Field
              id="pdf-terms"
              label="Terms & conditions"
              helper="Printed at the very bottom — warranty, returns, anything standard"
              multiline
              rows={3}
              value={form.terms_and_conditions ?? ''}
              onChange={(e) => set('terms_and_conditions', e.target.value)}
              placeholder="Parts carry a 30-day warranty. Payment due on delivery."
            />
          </Stack>
        </SectionCard>

        <SectionCard id="pdf-numbering-card" title="Document numbering & colour" padded>
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={2}>
              <Field
                id="pdf-invoice-prefix"
                label="Invoice prefix"
                value={form.invoice_prefix ?? ''}
                onChange={(e) => set('invoice_prefix', e.target.value.toUpperCase())}
                placeholder="INV"
                sx={{ flex: 1 }}
              />
              <Field
                id="pdf-estimate-prefix"
                label="Quotation prefix"
                value={form.estimate_prefix ?? ''}
                onChange={(e) => set('estimate_prefix', e.target.value.toUpperCase())}
                placeholder="EST"
                sx={{ flex: 1 }}
              />
            </Stack>

            <Box>
              <Field
                id="pdf-accent-color"
                label="Accent colour"
                helper="Hex colour for the document title and totals. Leave blank for the app's brand colour."
                error={accentInvalid ? 'Must be a hex colour like #3560c0' : undefined}
                value={form.accent_color ?? ''}
                onChange={(e) => set('accent_color', e.target.value.trim())}
                placeholder={BRAND.light ?? '#3560c0'}
                InputProps={{
                  endAdornment: (
                    <Box
                      sx={{
                        width: 22,
                        height: 22,
                        borderRadius: 1,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: !accentInvalid && form.accent_color ? form.accent_color : BRAND.light,
                        flexShrink: 0,
                      }}
                    />
                  ),
                }}
              />
            </Box>
          </Stack>
        </SectionCard>

        <Button
          id="pdf-template-save-btn"
          variant="contained"
          disabled={mutation.isPending || accentInvalid}
          onClick={() => mutation.mutate(form)}
          sx={{ alignSelf: 'flex-start', minWidth: 150 }}
        >
          {mutation.isPending ? 'Saving…' : 'Save changes'}
        </Button>
      </Box>
    </PageShell>
  )
}
