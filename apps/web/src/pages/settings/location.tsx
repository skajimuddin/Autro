// Settings → Workshop location — the GPS fix staff check-in is measured
// against, plus how wide a radius counts as "at the workshop".
//
// The GPS control is deliberately its own action rather than part of a form:
// coordinates are not typed, they are captured where you stand, and saving
// them alongside other fields would imply otherwise. Desktop/laptop gets no
// button at all (see lib/device.ts) — a laptop's location is IP/network-based
// and can be kilometres off, which would silently break every check-in.
import { useState, useCallback } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Alert, Box, Button, Chip, CircularProgress, Slider, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import PinIcon from '@mui/icons-material/MyLocationRounded'
import PlaceIcon from '@mui/icons-material/PlaceOutlined'

import { apiFetch } from '@/lib/api'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import { SectionCard } from '@/components/ui/section-card'
import { useToast, ToastContainer } from '@/components/ui/toast'
import { FullPageSpinner } from '@/components/ui/loading'
import { isMobileDevice } from '@/lib/device'

export default function SettingsLocationPage(): React.JSX.Element {
  const { tenant, refetch } = useTenant()
  const { toasts, showToast, dismissToast } = useToast()
  const [isLocating, setIsLocating] = useState(false)
  const [onMobile] = useState(isMobileDevice)
  const [radius, setRadius] = useState(tenant?.gps_radius_meters ?? 100)

  const radiusMutation = useMutation({
    mutationFn: (gps_radius_meters: number) =>
      apiFetch(`/tenants/${tenant?.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ gps_radius_meters }),
        tenantId: tenant?.id,
      }),
    onSuccess: () => {
      showToast('success', 'Check-in radius updated')
      refetch()
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to save'),
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

  if (!tenant) return <FullPageSpinner />

  const hasLocation = tenant.latitude != null && tenant.longitude != null

  return (
    <PageShell title="Workshop location" mobileTitle="Location" showBack hideNav>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <Box sx={{ px: { xs: 2, md: 3.5 }, pb: 4, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <SectionCard id="settings-location-card" title="GPS fix" padded>
          <Stack spacing={1.5}>
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
                <Alert severity="warning" sx={{ flex: 1, borderRadius: 2, fontSize: 12.5 }}>
                  Not set — staff cannot check in until this is set.
                </Alert>
              )}
            </Stack>

            {onMobile ? (
              <Button
                id="settings-update-location"
                type="button"
                variant="outlined"
                fullWidth
                startIcon={isLocating ? <CircularProgress size={15} color="inherit" /> : <PinIcon sx={{ fontSize: 16 }} />}
                disabled={isLocating}
                onClick={updateLocation}
                sx={{ height: 44 }}
              >
                {isLocating ? 'Locating…' : hasLocation ? 'Update location' : 'Set workshop location'}
              </Button>
            ) : (
              <Alert severity="warning" icon={<PinIcon sx={{ fontSize: 18 }} />} sx={{ borderRadius: 2, fontSize: 12.5 }}>
                You're on a desktop or laptop — the location can only be set from a{' '}
                <strong>phone</strong>, standing inside the workshop. Open Autro there and come back
                to this page.
              </Alert>
            )}

            <Typography sx={{ fontSize: 11.5, color: 'text.disabled', lineHeight: 1.6 }}>
              Capture this <strong>on a phone</strong>, <strong>standing inside the workshop</strong>.
              A laptop reports the wrong place and every staff check-in will be refused.
            </Typography>
          </Stack>
        </SectionCard>

        <SectionCard id="settings-radius-card" title="Check-in radius" padded>
          <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 2 }}>
            How far from the GPS fix above a staff member is still allowed to check in.
          </Typography>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Slider
              id="settings-radius-slider"
              value={radius}
              onChange={(_, v) => setRadius(v as number)}
              onChangeCommitted={(_, v) => radiusMutation.mutate(v as number)}
              min={20}
              max={1000}
              step={10}
              disabled={radiusMutation.isPending}
              sx={{ flex: 1 }}
            />
            <Typography sx={{ fontSize: 14, fontWeight: 700, fontVariantNumeric: 'tabular-nums', minWidth: 56, textAlign: 'right' }}>
              {radius} m
            </Typography>
          </Stack>
        </SectionCard>
      </Box>
    </PageShell>
  )
}
