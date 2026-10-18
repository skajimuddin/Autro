// Settings → GST — whether this garage charges GST, and on what registration.
//
// Off: bills are plain (no tax lines anywhere in the editors or PDFs).
// On: every new estimate/invoice starts with GST at the default rate, split
// into CGST + SGST, and invoice PDFs become "Tax Invoice"s carrying the GSTIN.
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Box, Button, Stack, Switch, Typography } from '@mui/material'
import { GSTIN_REGEX } from '@autro/shared'

import { apiFetch } from '@/lib/api'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import { SectionCard } from '@/components/ui/section-card'
import { Field } from '@/components/ui/field'
import { useToast, ToastContainer } from '@/components/ui/toast'
import { FullPageSpinner } from '@/components/ui/loading'

export default function SettingsGstPage(): React.JSX.Element {
  const { tenant, refetch } = useTenant()
  const { toasts, showToast, dismissToast } = useToast()

  const [enabled, setEnabled] = useState(tenant?.gst_enabled ?? false)
  const [gstin, setGstin] = useState(tenant?.gstin ?? '')
  const [percent, setPercent] = useState(String(tenant?.gst_percent ?? 18))

  const mutation = useMutation({
    mutationFn: () =>
      apiFetch(`/tenants/${tenant?.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          gst_enabled: enabled,
          gstin: gstin.trim() ? gstin.trim().toUpperCase() : null,
          gst_percent: Number(percent),
        }),
        tenantId: tenant?.id,
      }),
    onSuccess: () => {
      showToast('success', 'GST settings saved')
      refetch()
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to save'),
  })

  if (!tenant) return <FullPageSpinner />

  const gstinValue = gstin.trim().toUpperCase()
  const gstinError =
    gstinValue && !GSTIN_REGEX.test(gstinValue)
      ? 'Enter a valid 15-character GSTIN, like 21AAAAA0000A1Z5'
      : enabled && !gstinValue
        ? 'Add your GSTIN to charge GST'
        : undefined
  const rate = Number(percent)
  const rateError = enabled && !(rate > 0 && rate <= 100) ? 'Enter a rate between 0 and 100' : undefined

  return (
    <PageShell title="GST" mobileTitle="GST" showBack hideNav>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <Box sx={{ px: { xs: 2, md: 3.5 }, pb: 4, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <SectionCard id="gst-toggle-card" padded>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Box sx={{ minWidth: 0 }}>
              <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>Charge GST on bills</Typography>
              <Typography sx={{ fontSize: 11.5, color: 'text.disabled', mt: 0.25 }}>
                Off for plain bills. On adds GST to estimates and invoices and prints "Tax Invoice" with your GSTIN.
              </Typography>
            </Box>
            <Switch checked={enabled} onChange={(e) => setEnabled(e.target.checked)} inputProps={{ 'aria-label': 'Charge GST on bills' }} />
          </Stack>
        </SectionCard>

        {enabled && (
          <SectionCard id="gst-details-card" title="Registration" padded>
            <Stack spacing={2.5}>
              <Field
                id="gst-gstin"
                label="GSTIN"
                required
                value={gstin}
                onChange={(e) => setGstin(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 15))}
                placeholder="21AAAAA0000A1Z5"
                error={gstinError}
                helper="15 characters. Printed on every invoice and quotation."
              />
              <Field
                id="gst-percent"
                label="Default GST rate (%)"
                value={percent}
                inputMode="decimal"
                onChange={(e) => setPercent(e.target.value.replace(/[^\d.]/g, ''))}
                error={rateError}
                helper="Pre-filled on new bills; you can change it per bill. Workshop services are usually 18%, split equally into CGST and SGST."
              />
            </Stack>
          </SectionCard>
        )}

        <Button
          id="gst-save-btn"
          variant="contained"
          disabled={mutation.isPending || Boolean(gstinError) || Boolean(rateError)}
          onClick={() => mutation.mutate()}
          sx={{ alignSelf: 'flex-start', minWidth: 150 }}
        >
          {mutation.isPending ? 'Saving…' : 'Save changes'}
        </Button>
      </Box>
    </PageShell>
  )
}
