// Settings → Garage details — name, phone, address, logo.
//
// Split out of the old single settings page (2026-08-20 MUI migration) when
// Settings grew into a multi-page hub. Logo lives here rather than only at
// onboarding: a garage that skipped it, or wants to change it, needs a way
// back in — and every invoice/estimate PDF and the app header read it live.
import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Box, Button, Stack } from '@mui/material'

import { apiFetch } from '@/lib/api'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import { SectionCard } from '@/components/ui/section-card'
import { Field } from '@/components/ui/field'
import { LogoUploader } from '@/components/domain/logo-uploader'
import { useToast, ToastContainer } from '@/components/ui/toast'
import { FullPageSpinner } from '@/components/ui/loading'

const garageSchema = z.object({
  name: z.string().trim().min(1, 'Garage name is required').max(100, 'Name is too long'),
  phone: z.string().regex(/^\d{10,15}$/, 'Enter a valid phone number (10–15 digits)'),
  address: z.string().trim().max(200, 'Address is too long').optional(),
})

type GarageForm = z.infer<typeof garageSchema>

export default function SettingsGaragePage(): React.JSX.Element {
  const { tenant, refetch } = useTenant()
  const { toasts, showToast, dismissToast } = useToast()
  const [logoUrl, setLogoUrl] = useState<string | null>(tenant?.logo_url ?? null)

  const { control, handleSubmit, formState: { isDirty } } = useForm<GarageForm>({
    resolver: zodResolver(garageSchema),
    defaultValues: {
      name: tenant?.name ?? '',
      phone: tenant?.phone ?? '',
      address: tenant?.address ?? '',
    },
  })

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch(`/tenants/${tenant?.id}`, { method: 'PATCH', body: JSON.stringify(data), tenantId: tenant?.id }),
    onSuccess: () => {
      showToast('success', 'Garage details saved')
      refetch()
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to save'),
  })

  const saveLogo = (url: string | null): void => {
    setLogoUrl(url)
    mutation.mutate({ logo_url: url })
  }

  if (!tenant) return <FullPageSpinner />

  return (
    <PageShell title="Garage details" mobileTitle="Garage details" showBack hideNav>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <Box sx={{ px: { xs: 2, md: 3.5 }, pb: 4, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <SectionCard id="settings-logo-card" title="Logo" padded>
          <LogoUploader
            value={logoUrl}
            onChange={saveLogo}
            tenantId={tenant.id}
            onError={(message) => showToast('error', message)}
          />
        </SectionCard>

        <SectionCard id="settings-garage-card" title="Details" padded>
          <Box component="form" onSubmit={handleSubmit((d) => mutation.mutate(d))}>
            <Stack spacing={2.5}>
              <Controller
                name="name"
                control={control}
                render={({ field, fieldState }) => (
                  <Field {...field} id="settings-name" label="Garage name" required error={fieldState.error?.message} />
                )}
              />

              <Controller
                name="phone"
                control={control}
                render={({ field, fieldState }) => (
                  <Field
                    {...field}
                    id="settings-phone"
                    label="Phone"
                    required
                    type="tel"
                    inputMode="numeric"
                    onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
                    error={fieldState.error?.message}
                  />
                )}
              />

              <Controller
                name="address"
                control={control}
                render={({ field, fieldState }) => (
                  <Field
                    {...field}
                    id="settings-address"
                    label="Address"
                    helper="Appears on invoices"
                    multiline
                    rows={2}
                    error={fieldState.error?.message}
                  />
                )}
              />

              <Button
                id="settings-save-btn"
                type="submit"
                variant="contained"
                disabled={!isDirty || mutation.isPending}
                sx={{ alignSelf: 'flex-start', minWidth: 150 }}
              >
                {mutation.isPending ? 'Saving…' : 'Save changes'}
              </Button>
            </Stack>
          </Box>
        </SectionCard>
      </Box>
    </PageShell>
  )
}
