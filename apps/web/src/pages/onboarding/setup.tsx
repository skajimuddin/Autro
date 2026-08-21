// Onboarding — create the garage. The first screen a new owner ever sees.
//
// Migrated 2026-08-20 onto the MUI design system.
//
// The GPS capture is the one unusual control here. It is a button whose colour
// carries its state, because the state is the whole point: an owner who taps it
// from a desk in another city gets a wrong location and staff cannot check in.
// Hence the standing note about standing inside the workshop, kept from the
// previous version — it came from a real support problem, not from a designer.
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { z } from 'zod'
import {
  Alert, Box, Button, Card, CircularProgress, Stack, Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import GarageIcon from '@mui/icons-material/StorefrontOutlined'
import PinIcon from '@mui/icons-material/MyLocationRounded'
import CheckIcon from '@mui/icons-material/CheckCircleRounded'
import ErrorIcon from '@mui/icons-material/ErrorOutlineRounded'

import { apiFetch } from '@/lib/api'
import { useTenant } from '@/providers/tenant-provider'
import { Field } from '@/components/ui/field'

const onboardingSchema = z.object({
  name: z.string().min(1, 'Garage name is required').max(100, 'Name too long'),
  phone: z.string().regex(/^\d{10,15}$/, 'Enter a valid phone number (10–15 digits)'),
  address: z.string().max(300, 'Address too long').optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

type FormErrors = Partial<Record<keyof z.infer<typeof onboardingSchema>, string>>
type LocationStatus = 'idle' | 'loading' | 'set' | 'error'

export default function OnboardingPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { refetch } = useTenant()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [latitude, setLatitude] = useState<number | undefined>()
  const [longitude, setLongitude] = useState<number | undefined>()
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle')
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const captureLocation = (): void => {
    if (!navigator.geolocation) {
      setLocationStatus('error')
      return
    }
    setLocationStatus('loading')
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude)
        setLongitude(pos.coords.longitude)
        setLocationStatus('set')
      },
      () => setLocationStatus('error'),
      { enableHighAccuracy: true, timeout: 10_000 },
    )
  }

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault()
    setSubmitError(null)

    const result = onboardingSchema.safeParse({
      name: name.trim(),
      phone: phone.trim(),
      address: address.trim() || undefined,
      latitude,
      longitude,
    })

    if (!result.success) {
      const fieldErrors: FormErrors = {}
      for (const issue of result.error.issues) {
        fieldErrors[issue.path[0] as keyof FormErrors] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    setErrors({})
    setIsSubmitting(true)
    try {
      await apiFetch('/tenants', { method: 'POST', body: JSON.stringify(result.data) })
      refetch()
      void navigate('/', { replace: true })
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create garage. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Colour carries the state: green once captured, red on failure. Semantic,
  // not decorative — the brand blue stays the idle action.
  const locationTone =
    locationStatus === 'set' ? 'success' : locationStatus === 'error' ? 'error' : 'primary'

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default', px: 2, pt: 4, pb: 6 }}>
      <Box sx={{ width: '100%', maxWidth: 520, mx: 'auto' }}>
        <Stack alignItems="center" textAlign="center" spacing={1} sx={{ mb: 3.5 }}>
          <Box
            sx={{
              width: 56, height: 56, borderRadius: 2, display: 'grid', placeItems: 'center',
              bgcolor: 'primary.main', color: 'primary.contrastText', mb: 1,
            }}
          >
            <GarageIcon sx={{ fontSize: 26 }} />
          </Box>
          <Typography component="h1" sx={{ fontSize: 26, fontWeight: 700, letterSpacing: '-.02em' }}>
            Set up your garage
          </Typography>
          <Typography sx={{ fontSize: 13.5, color: 'text.secondary', lineHeight: 1.6 }}>
            These details go on your invoices and drive staff attendance.
          </Typography>
        </Stack>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Card sx={{ p: 3, mb: 2 }}>
            <Stack spacing={2.5}>
              <Field
                id="garage-name"
                label="Garage name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Sharma Auto Works"
                error={errors.name}
              />

              <Field
                id="garage-phone"
                label="Phone number"
                required
                type="tel"
                inputMode="numeric"
                value={phone}
                // Digits only as it is typed, so what the owner sees is what
                // the schema validates.
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="9876543210"
                error={errors.phone}
              />

              <Field
                id="garage-address"
                label="Address"
                helper="Optional — appears on invoices"
                multiline
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123, Main Road, Bhubaneswar"
                error={errors.address}
              />

              <Box>
                <Typography sx={{ fontSize: 12, fontWeight: 600, color: 'text.secondary', mb: 0.75 }}>
                  Workshop location
                </Typography>
                <Typography sx={{ fontSize: 12, color: 'text.disabled', lineHeight: 1.6, mb: 1.5 }}>
                  Staff check in by GPS, so capture this <strong>on a phone</strong>, <strong>standing
                  inside the workshop</strong>. A laptop will report the wrong place and check-ins
                  will fail.
                </Typography>

                <Button
                  id="set-location-btn"
                  type="button"
                  variant="outlined"
                  fullWidth
                  disabled={locationStatus === 'loading'}
                  onClick={captureLocation}
                  startIcon={
                    locationStatus === 'loading' ? <CircularProgress size={15} color="inherit" />
                    : locationStatus === 'set' ? <CheckIcon />
                    : locationStatus === 'error' ? <ErrorIcon />
                    : <PinIcon />
                  }
                  sx={(t) => ({
                    height: 46,
                    borderStyle: locationStatus === 'idle' ? 'dashed' : 'solid',
                    borderColor: `${locationTone}.main`,
                    color: `${locationTone}.main`,
                    bgcolor: locationTone === 'primary' ? 'transparent' : alpha(t.palette[locationTone].main, 0.1),
                    '&:hover': { borderColor: `${locationTone}.main` },
                  })}
                >
                  {locationStatus === 'loading' && 'Getting location…'}
                  {locationStatus === 'set' && `Location set (${latitude?.toFixed(4)}, ${longitude?.toFixed(4)})`}
                  {locationStatus === 'error' && 'Could not get location — tap to retry'}
                  {locationStatus === 'idle' && 'Set workshop location'}
                </Button>
              </Box>
            </Stack>
          </Card>

          {submitError && (
            <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>
              {submitError}
            </Alert>
          )}

          <Button
            id="create-autro-btn"
            type="submit"
            variant="contained"
            fullWidth
            disabled={isSubmitting}
            sx={{ height: 48, fontSize: 14 }}
          >
            {isSubmitting ? 'Creating…' : 'Create garage'}
          </Button>
        </Box>
      </Box>
    </Box>
  )
}
