// Settings — the owner's profile and the garage's details.
//
// Migrated 2026-08-20 onto the MUI design system. Three SectionCards: who you
// are, the garage (the only editable part), and sign out.
//
// The GPS control is deliberately its own action rather than part of the form.
// Coordinates are not typed, they are captured where you stand, and saving them
// with the rest of the form would imply otherwise. Same standing note as
// onboarding, for the same reason: an owner who updates this from a desk
// elsewhere breaks every staff check-in until it is corrected.
import { useState, useCallback } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Avatar, Box, Button, Chip, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import MailIcon from '@mui/icons-material/MailOutlineRounded'
import PinIcon from '@mui/icons-material/MyLocationRounded'
import PlaceIcon from '@mui/icons-material/PlaceOutlined'
import LogoutIcon from '@mui/icons-material/LogoutRounded'

import { apiFetch } from '@/lib/api'
import { useAuth } from '@/providers/auth-provider'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import { SectionCard } from '@/components/ui/section-card'
import { Field } from '@/components/ui/field'
import { useToast, ToastContainer } from '@/components/ui/toast'

const settingsSchema = z.object({
  name: z.string().trim().min(1, 'Garage name is required').max(100, 'Name is too long'),
  phone: z.string().regex(/^\d{10,15}$/, 'Enter a valid phone number (10–15 digits)'),
  address: z.string().trim().max(200, 'Address is too long').optional(),
})

type SettingsForm = z.infer<typeof settingsSchema>

export default function SettingsPage(): React.JSX.Element {
  const { user, logout } = useAuth()
  const { tenant, refetch } = useTenant()
  const { toasts, showToast, dismissToast } = useToast()
  const [isLocating, setIsLocating] = useState(false)

  const { control, handleSubmit, formState: { isDirty } } = useForm<SettingsForm>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: tenant?.name ?? '',
      phone: tenant?.phone ?? '',
      address: tenant?.address ?? '',
    },
  })

  const mutation = useMutation({
    mutationFn: (data: SettingsForm) =>
      apiFetch(`/tenants/${tenant?.id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
        tenantId: tenant?.id,
      }),
    onSuccess: () => {
      showToast('success', 'Settings saved')
      refetch()
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to save settings'),
  })

  const updateLocation = useCallback(() => {
    if (!navigator.geolocation) {
      showToast('error', 'Geolocation is not supported by your browser')
      return
    }
    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        apiFetch(`/tenants/${tenant?.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          }),
          tenantId: tenant?.id,
        })
          .then(() => {
            showToast('success', 'Location updated')
            refetch()
          })
          .catch(() => showToast('error', 'Failed to update location'))
          .finally(() => setIsLocating(false))
      },
      () => {
        setIsLocating(false)
        showToast('error', 'Could not get your location')
      },
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }, [tenant?.id, showToast, refetch])

  const hasLocation = tenant?.latitude != null && tenant?.longitude != null

  return (
    <PageShell title="Settings">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <Box sx={{ px: { xs: 2, md: 3.5 }, pb: 4, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        {/* ── Who you are ──────────────────────────────────────── */}
        <SectionCard id="settings-profile-card" title="Your profile" padded>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar
              src={user?.avatar_url ?? undefined}
              imgProps={{ referrerPolicy: 'no-referrer' }}
              variant="rounded"
              sx={{ width: 56, height: 56, borderRadius: 2, fontSize: 20, fontWeight: 600 }}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography noWrap sx={{ fontSize: 16, fontWeight: 700 }}>
                {user?.name ?? 'Signed in'}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 0.25 }}>
                <MailIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                <Typography noWrap sx={{ fontSize: 12.5, color: 'text.disabled' }}>
                  {user?.email ?? ''}
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </SectionCard>

        {/* ── The garage ───────────────────────────────────────── */}
        <SectionCard id="settings-garage-card" title="Garage details" padded>
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

              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary', mb: 0.75 }}>
                  Workshop location
                </Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                  {hasLocation ? (
                    <Chip
                      size="small"
                      icon={<PlaceIcon sx={{ fontSize: 14 }} />}
                      label={`${tenant.latitude?.toFixed(4)}, ${tenant.longitude?.toFixed(4)}`}
                      sx={(t) => ({
                        flex: 1,
                        justifyContent: 'flex-start',
                        bgcolor: alpha(t.palette.success.main, 0.14),
                        color: t.palette.success.main,
                        fontVariantNumeric: 'tabular-nums',
                      })}
                    />
                  ) : (
                    <Typography sx={{ flex: 1, fontSize: 12.5, color: 'text.disabled' }}>Not set</Typography>
                  )}
                  <Button
                    id="settings-update-location"
                    type="button"
                    variant="outlined"
                    size="small"
                    startIcon={<PinIcon sx={{ fontSize: 16 }} />}
                    disabled={isLocating}
                    onClick={updateLocation}
                    sx={{ height: 34, flexShrink: 0 }}
                  >
                    {isLocating ? 'Locating…' : 'Update'}
                  </Button>
                </Stack>
                <Typography sx={{ fontSize: 11.5, color: 'text.disabled', lineHeight: 1.6, mt: 1 }}>
                  Capture this <strong>on a phone</strong>, <strong>standing inside the workshop</strong>.
                  A laptop reports the wrong place and staff check-ins will fail.
                </Typography>
              </Box>

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

        <Button
          id="settings-sign-out"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={logout}
          sx={{ alignSelf: 'flex-start' }}
        >
          Sign out
        </Button>
      </Box>
    </PageShell>
  )
}
