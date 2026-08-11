// Task 1.7 — Onboarding Page (Create Garage)
import { useState } from 'react'
import { useNavigate } from 'react-router'
import { z } from 'zod'
import { MapPin, Building2, Phone, MapPinned, CheckCircle, AlertCircle } from 'lucide-react'
import { apiFetch } from '@/lib/api'
import { useTenant } from '@/hooks/use-tenant'

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

// ── Component ─────────────────────────────────────────────────────────────────
export default function OnboardingPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { refetch } = useTenant()

  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [latitude, setLatitude] = useState<number | undefined>()
  const [longitude, setLongitude] = useState<number | undefined>()
  const [locationStatus, setLocationStatus] = useState<'idle' | 'loading' | 'set' | 'error'>('idle')
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
      setSubmitError(err instanceof Error ? err.message : 'Failed to create garage. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Inline styles ──────────────────────────────────────────────────────────
  const inputStyle = (hasError: boolean): React.CSSProperties => ({
    width: '100%',
    padding: '12px 12px 12px 40px',
    borderRadius: '12px',
    border: `1.5px solid ${hasError ? '#ef4444' : '#cbd5e1'}`,
    fontSize: '1rem',
    color: '#0f172a',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    background: '#fff',
  })

  const locationBtnStyle = (): React.CSSProperties => ({
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px',
    borderRadius: '12px',
    border: `1.5px ${locationStatus === 'set' ? 'solid' : 'dashed'} ${
      locationStatus === 'set' ? '#10b981' : locationStatus === 'error' ? '#ef4444' : '#2563eb'
    }`,
    background: locationStatus === 'set' ? '#d1fae5' : locationStatus === 'error' ? '#fee2e2' : 'transparent',
    color: locationStatus === 'set' ? '#059669' : locationStatus === 'error' ? '#ef4444' : '#2563eb',
    fontSize: '0.875rem',
    fontWeight: 600,
    cursor: locationStatus === 'loading' ? 'wait' : 'pointer',
    fontFamily: 'inherit',
  })

  return (
    <div style={{ minHeight: '100dvh', background: '#f1f5f9', padding: '24px 16px 40px', fontFamily: "'Inter', system-ui, sans-serif" }}>
      <div style={{ maxWidth: '414px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{
            width: '56px', height: '56px',
            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
            borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 16px', boxShadow: '0 10px 20px -4px rgba(37,99,235,0.3)',
          }}>
            <Building2 size={28} color="white" />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0f172a', margin: '0 0 8px' }}>
            Set Up Your Garage
          </h1>
          <p style={{ fontSize: '0.875rem', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
            We need these details for your invoices and staff attendance.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} noValidate>
          <div style={{ background: '#fff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)', marginBottom: '16px' }}>

            {/* Garage Name */}
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="garage-name" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                Garage Name <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Building2 size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  id="garage-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Azim Auto Workshop"
                  style={inputStyle(Boolean(errors.name))}
                />
              </div>
              {errors.name && <p style={{ fontSize: '0.8rem', color: '#ef4444', marginTop: '4px' }}>{errors.name}</p>}
            </div>

            {/* Phone */}
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="garage-phone" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                Phone Number <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ position: 'relative' }}>
                <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  id="garage-phone"
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9876543210"
                  style={inputStyle(Boolean(errors.phone))}
                />
              </div>
              {errors.phone && <p style={{ fontSize: '0.8rem', color: '#ef4444', marginTop: '4px' }}>{errors.phone}</p>}
            </div>

            {/* Address */}
            <div style={{ marginBottom: '16px' }}>
              <label htmlFor="garage-address" style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                Address <span style={{ color: '#94a3b8', fontWeight: 400 }}>(optional)</span>
              </label>
              <div style={{ position: 'relative' }}>
                <MapPin size={16} style={{ position: 'absolute', left: '12px', top: '14px', color: '#94a3b8' }} />
                <textarea
                  id="garage-address"
                  rows={2}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="123, Main Road, Bhubaneswar"
                  style={{ ...inputStyle(false), paddingTop: '12px', resize: 'none', lineHeight: '1.5' }}
                />
              </div>
            </div>

            {/* Location */}
            <div>
              <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 600, color: '#374151', marginBottom: '6px' }}>
                Workshop Location <span style={{ color: '#94a3b8', fontWeight: 400 }}>(for staff attendance)</span>
              </label>
              <button type="button" id="set-location-btn" onClick={handleSetLocation} style={locationBtnStyle()}>
                {locationStatus === 'loading' && <span>📍 Getting location…</span>}
                {locationStatus === 'set' && <><CheckCircle size={16} /> Location set ({latitude?.toFixed(4)}, {longitude?.toFixed(4)})</>}
                {locationStatus === 'error' && <><AlertCircle size={16} /> Failed — tap to retry</>}
                {locationStatus === 'idle' && <><MapPinned size={16} /> Set Workshop Location</>}
              </button>
            </div>
          </div>

          {/* Submit error */}
          {submitError && (
            <div style={{ background: '#fee2e2', borderRadius: '12px', padding: '12px 16px', marginBottom: '16px', fontSize: '0.875rem', color: '#ef4444', display: 'flex', gap: '8px', alignItems: 'center' }}>
              <AlertCircle size={16} />{submitError}
            </div>
          )}

          {/* Submit button */}
          <button
            type="submit"
            id="create-workshop-btn"
            disabled={isSubmitting}
            style={{
              width: '100%', padding: '16px', borderRadius: '16px', border: 'none',
              background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', color: '#fff',
              fontSize: '1rem', fontWeight: 700, cursor: isSubmitting ? 'wait' : 'pointer',
              fontFamily: 'inherit', boxShadow: '0 10px 15px -3px rgba(37,99,235,0.3)',
              opacity: isSubmitting ? 0.7 : 1,
            }}
          >
            {isSubmitting ? 'Creating Workshop…' : '🚀 Create Workshop'}
          </button>
        </form>
      </div>
    </div>
  )
}
