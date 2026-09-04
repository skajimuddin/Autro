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
import { isMobileDevice } from '@/lib/device'
import { LogoUploader } from '@/components/domain/logo-uploader'
import { useToast, ToastContainer } from '@/components/ui/toast'

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
  const { toasts, showToast, dismissToast } = useToast()

  // Two steps, not one form: the logo upload needs a real tenant id (the
  // presign endpoint requires tenant membership), which only exists once
  // POST /tenants has already succeeded. So the garage is created first,
  // then this optionally attaches a logo to it before landing on the
  // dashboard — never blocking garage creation on a photo picker.
  const [step, setStep] = useState<'details' | 'logo'>('details')
  const [createdTenantId, setCreatedTenantId] = useState<string | null>(null)
  const [logoUrl, setLogoUrl] = useState<string | null>(null)
  const [isSavingLogo, setIsSavingLogo] = useState(false)

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [latitude, setLatitude] = useState<number | undefined>()
  const [longitude, setLongitude] = useState<number | undefined>()
  const [locationStatus, setLocationStatus] = useState<LocationStatus>('idle')
  const [errors, setErrors] = useState<FormErrors>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  // Computed once — the device an owner is on does not change mid-session,
  // and re-checking on every render would just flicker the button.
  const [onMobile] = useState(isMobileDevice)

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
      const { tenant } = await apiFetch<{ tenant: { id: string } }>('/tenants', {
        method: 'POST',
        body: JSON.stringify(result.data),
      })
      setCreatedTenantId(tenant.id)
      setStep('logo')
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to create garage. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const finishOnboarding = async (): Promise<void> => {
    if (logoUrl && createdTenantId) {
      setIsSavingLogo(true)
      try {
        await apiFetch(`/tenants/${createdTenantId}`, {
          method: 'PATCH',
          body: JSON.stringify({ logo_url: logoUrl }),
          tenantId: createdTenantId,
        })
      } catch {
        // The garage already exists — a failed logo save shouldn't strand the
        // owner on this screen. It's addable any time from Settings → Garage.
        showToast('error', 'Garage created, but the logo did not save. Add it from Settings.')
      } finally {
        setIsSavingLogo(false)
      }
    }
    refetch()
    void navigate('/', { replace: true })
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
            {step === 'details' ? 'Set up your garage' : 'Add your logo'}
          </Typography>
          <Typography sx={{ fontSize: 13.5, color: 'text.secondary', lineHeight: 1.6 }}>
            {step === 'details'
              ? 'These details go on your invoices and drive staff attendance.'
              : "It'll appear on every invoice and quotation PDF, and in the app header. Optional — add it any time from Settings."}
          </Typography>
        </Stack>

        {step === 'logo' ? (
          <Card sx={{ p: 3 }}>
            <ToastContainer toasts={toasts} onDismiss={dismissToast} />
            <Stack spacing={3}>
              <LogoUploader
                value={logoUrl}
                onChange={setLogoUrl}
                tenantId={createdTenantId ?? undefined}
                onError={(message) => showToast('error', message)}
              />
              <Button
                id="onboarding-finish-btn"
                type="button"
                variant="contained"
                fullWidth
                disabled={isSavingLogo}
                onClick={() => void finishOnboarding()}
                sx={{ height: 48, fontSize: 14 }}
              >
                {isSavingLogo ? 'Saving…' : logoUrl ? 'Finish' : 'Skip for now'}
              </Button>
            </Stack>
          </Card>
        ) : (
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

                {onMobile ? (
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
                ) : (
                  // Desktop/laptop: no button at all. Offering one that produces
                  // a bad fix (and then blames the owner for every failed
                  // check-in) is worse than not offering it — this can only be
                  // done from the phone, later, from Settings → Location.
                  <Alert severity="warning" icon={<PinIcon sx={{ fontSize: 18 }} />} sx={{ borderRadius: 2, fontSize: 12.5 }}>
                    You're on a desktop or laptop. Open Autro on your <strong>phone</strong>, standing
                    inside the workshop, and set the location from Settings — you can finish the rest
                    of this setup here and do that afterwards.
                  </Alert>
                )}
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
        )}
      </Box>
    </Box>
  )
}
