// Task 1.7 — Onboarding Page (Create Garage)
//
// Converted off inline styles 2026-08-13 (UI-6). This page was the worst offender
// in the codebase: 31 inline `style={{ }}` props, 13 hardcoded hex colours and
// zero uses of `className`, i.e. it did not touch the design system at all — while
// being the first screen a new owner ever sees.
//
// Changes beyond the mechanical conversion:
//   - hand-rolled <input>/<textarea> markup (absolute-positioned icons, a shared
//     `inputStyle()` factory, manual error paragraphs) replaced with the existing
//     <Input>/<Textarea> components, which already do labels, left icons, the
//     required asterisk and error text
//   - two `linear-gradient`s removed (logo tile, submit button). The design system
//     has no gradients; 05-ui-screens.md prescribes solid primary + shadow
//   - label colour was `#374151` (Tailwind gray-700), which is not a project token
//     at all — now `text-text`
//   - submit button replaced with <Button isLoading>
//   - the address field loses its inline MapPin icon: <Textarea> has no leftIcon
//     prop, and adding one just for this page would fork the component
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { z } from 'zod'
import {
  Building2,
  Phone,
  MapPinned,
  CheckCircle,
  AlertCircle,
  Loader2,
} from '@/components/ui/icons'

import { apiFetch } from '@/lib/api'
import { useTenant } from '@/hooks/use-tenant'
import { Card, Button, Input, Textarea } from '@/components/ui'

// ── Validation schema ─────────────────────────────────────────────────────────
const onboardingSchema = z.object({
  name: z.string().min(1, 'Garage name is required').max(100, 'Name too long'),
  phone: z
    .string()
    .min(10, 'Phone must be at least 10 digits')
    .max(15, 'Phone too long')
    .regex(/^\d+$/, 'Phone must contain only digits'),
  address: z.string().max(300, 'Address too long').optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
})

type FormErrors = Partial<Record<keyof z.infer<typeof onboardingSchema>, string>>

type LocationStatus = 'idle' | 'loading' | 'set' | 'error'

// Colour here is semantic (success = captured, danger = failed), not decorative.
const LOCATION_BUTTON_STYLES: Record<LocationStatus, string> = {
  idle: 'border-[1.5px] border-dashed border-primary text-primary hover:bg-primary-light',
  loading: 'border-[1.5px] border-dashed border-primary text-primary cursor-wait',
  set: 'border-[1.5px] border-solid border-success bg-success-light text-success',
  error: 'border-[1.5px] border-solid border-danger bg-danger-light text-danger',
}

// ── Component ─────────────────────────────────────────────────────────────────
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

  // ── Capture GPS location ──────────────────────────────────────────────────
  const handleSetLocation = () => {
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
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  // ── Submit handler ─────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
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
        const field = issue.path[0] as keyof FormErrors
        fieldErrors[field] = issue.message
      }
      setErrors(fieldErrors)
      return
    }

    setErrors({})
    setIsSubmitting(true)

    try {
      await apiFetch<{ tenant: { id: string } }>('/tenants', {
        method: 'POST',
        body: JSON.stringify(result.data),
      })
      refetch()
      navigate('/', { replace: true })
    } catch (err: unknown) {
      setSubmitError(
        err instanceof Error ? err.message : 'Failed to create garage. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-dvh bg-bg px-4 pt-6 pb-10">
      <div className="w-full max-w-md md:max-w-lg mx-auto">
        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="text-center mb-7">
          <div className="w-14 h-14 rounded-tile bg-primary flex items-center justify-center mx-auto mb-4">
            <Building2 size={26} className="text-white" />
          </div>
          <h1 className="text-[1.625rem] font-bold text-text mb-2">Set Up Your Garage</h1>
          <p className="text-row-title text-text-secondary leading-normal">
            We need these details for your invoices and staff attendance.
          </p>
        </div>

        {/* ── Form ───────────────────────────────────────────────── */}
        <form onSubmit={handleSubmit} noValidate>
          <Card className="!p-6 mb-4">
            <div className="flex flex-col gap-4">
              <Input
                id="garage-name"
                label="Garage Name"
                required
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Azim Auto Autro"
                leftIcon={<Building2 size={16} />}
                error={errors.name}
              />

              <Input
                id="garage-phone"
                label="Phone Number"
                required
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="9876543210"
                leftIcon={<Phone size={16} />}
                error={errors.phone}
              />

              <Textarea
                id="garage-address"
                label="Address (optional)"
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123, Main Road, Bhubaneswar"
                error={errors.address}
              />

              {/* ── Autro location ──────────────────────────── */}
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-text">
                  Autro Location{' '}
                  <span className="font-normal text-text-muted">(for staff attendance)</span>
                </span>

                <div className="text-xs text-text-secondary leading-snug mb-1.5">
                  <strong className="font-semibold">Important rules for accurate GPS:</strong>
                  <ul className="list-disc ml-4 mt-1">
                    <li>
                      Use a <strong className="font-semibold">mobile phone</strong> (PCs often give
                      wrong locations).
                    </li>
                    <li>
                      Stand <strong className="font-semibold">inside the autro</strong> when tapping
                      the button.
                    </li>
                  </ul>
                </div>

                <button
                  type="button"
                  id="set-location-btn"
                  onClick={handleSetLocation}
                  disabled={locationStatus === 'loading'}
                  className={[
                    'w-full flex items-center justify-center gap-2',
                    'rounded-input border-[1.5px] p-3',
                    'text-sm font-semibold transition-colors cursor-pointer',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                    LOCATION_BUTTON_STYLES[locationStatus],
                  ].join(' ')}
                >
                  {locationStatus === 'loading' && (
                    <>
                      <Loader2 size={16} className="animate-spin-fast" /> Getting location…
                    </>
                  )}
                  {locationStatus === 'set' && (
                    <>
                      <CheckCircle size={16} /> Location set ({latitude?.toFixed(4)},{' '}
                      {longitude?.toFixed(4)})
                    </>
                  )}
                  {locationStatus === 'error' && (
                    <>
                      <AlertCircle size={16} /> Failed — tap to retry
                    </>
                  )}
                  {locationStatus === 'idle' && (
                    <>
                      <MapPinned size={16} /> Set Autro Location
                    </>
                  )}
                </button>
              </div>
            </div>
          </Card>

          {/* ── Submit error ─────────────────────────────────────── */}
          {submitError && (
            <div className="flex items-center gap-2 rounded-input bg-danger-light text-danger text-sm px-4 py-3 mb-4">
              <AlertCircle size={16} className="flex-shrink-0" />
              {submitError}
            </div>
          )}

          <Button type="submit" id="create-autro-btn" size="lg" isLoading={isSubmitting}>
            Create Autro
          </Button>
        </form>
      </div>
    </div>
  )
}
