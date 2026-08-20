// Settings — garage profile and user settings
import { useState, useCallback } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import {
  User,
  Mail,
  Building2,
  Phone,
  MapPin,
  Navigation,
  LogOut,
  Save,
} from '@/components/ui/icons'

import { apiFetch } from '@/lib/api'
import { useAuth } from '@/providers/auth-provider'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import { Card, Button, Input, Textarea, useToast, ToastContainer } from '@/components/ui'

// ── Form Schema ───────────────────────────────────────────────────────────────

const settingsSchema = z.object({
  name: z.string().min(1, 'Garage name is required').max(100),
  phone: z.string().min(10, 'Enter a valid phone number').max(15),
  address: z.string().max(200).optional(),
})

type SettingsForm = z.infer<typeof settingsSchema>

// ── Settings Page ─────────────────────────────────────────────────────────────

export default function SettingsPage(): React.JSX.Element {
  const { user, logout } = useAuth()
  const { tenant, refetch } = useTenant()
  const { toasts, showToast, dismissToast } = useToast()
  const [isLocating, setIsLocating] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<SettingsForm>({
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
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to save settings')
    },
  })

  const handleUpdateLocation = useCallback(() => {
    if (!navigator.geolocation) {
      showToast('error', 'Geolocation is not supported by your browser')
      return
    }

    setIsLocating(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false)
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
          .catch(() => {
            showToast('error', 'Failed to update location')
          })
      },
      () => {
        setIsLocating(false)
        showToast('error', 'Could not get your location')
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }, [tenant?.id, showToast, refetch])

  const onSubmit = handleSubmit((data) => {
    mutation.mutate(data)
  })

  return (
    <PageShell title="Settings">
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="p-4 md:p-6 flex flex-col gap-5">
        {/* ── Profile Section ──────────────────────────────────── */}
        <section>
          <h3 className="text-kicker font-bold text-text-secondary uppercase tracking-[0.08em] mb-3">
            Your Profile
          </h3>
          <Card id="settings-profile-card">
            <div className="flex items-center gap-4">
              {/* Avatar */}
              {user?.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.name}
                  className="w-14 h-14 rounded-tile object-cover flex-shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-14 h-14 rounded-tile bg-primary-light flex items-center justify-center flex-shrink-0">
                  <User size={24} className="text-primary" />
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="text-base font-bold text-text truncate">{user?.name ?? 'User'}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <Mail size={12} className="text-text-muted flex-shrink-0" />
                  <p className="text-xs text-text-muted truncate">{user?.email ?? ''}</p>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* ── Garage Section ───────────────────────────────────── */}
        <section>
          <h3 className="text-kicker font-bold text-text-secondary uppercase tracking-[0.08em] mb-3">
            Garage Details
          </h3>
          <Card id="settings-garage-card">
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <Input
                label="Garage Name"
                placeholder="Your autro name"
                leftIcon={<Building2 size={16} />}
                error={errors.name?.message}
                required
                {...register('name')}
              />

              <Input
                label="Phone"
                placeholder="Contact number"
                type="tel"
                leftIcon={<Phone size={16} />}
                error={errors.phone?.message}
                required
                {...register('phone')}
              />

              <Textarea
                label="Address"
                placeholder="Autro address"
                rows={2}
                error={errors.address?.message}
                {...register('address')}
              />

              {/* Location */}
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-semibold text-text">Autro Location</span>
                <div className="flex items-center gap-2">
                  {tenant?.latitude && tenant?.longitude ? (
                    <div className="flex items-center gap-1.5 text-xs text-success bg-success-light px-3 py-1.5 border border-success/30 flex-1 min-w-0">
                      <MapPin size={12} className="flex-shrink-0" />
                      <span className="truncate">
                        {tenant.latitude.toFixed(4)}, {tenant.longitude.toFixed(4)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-xs text-text-muted flex-1">Not set</span>
                  )}
                  <Button
                    id="settings-update-location"
                    type="button"
                    variant="outline"
                    size="sm"
                    fullWidth={false}
                    leftIcon={<Navigation size={14} />}
                    isLoading={isLocating}
                    onClick={handleUpdateLocation}
                  >
                    Update
                  </Button>
                </div>
                <div className="text-[0.65rem] text-text-muted mt-1 leading-snug">
                  <p className="font-semibold text-text">Important rules for accuracy:</p>
                  <ul className="list-disc pl-4 mt-1 space-y-0.5">
                    <li>
                      Use a <strong>mobile phone</strong> (PCs give wrong locations).
                    </li>
                    <li>
                      Stand <strong>inside the autro</strong> when updating.
                    </li>
                  </ul>
                </div>
              </div>

              {/* Save */}
              <Button
                id="settings-save-btn"
                type="submit"
                isLoading={mutation.isPending}
                disabled={!isDirty && !mutation.isPending}
                leftIcon={<Save size={16} />}
              >
                Save Changes
              </Button>
            </form>
          </Card>
        </section>

        {/* ── Sign Out ─────────────────────────────────────────── */}
        <div className="pt-2 pb-6">
          <Button
            id="settings-sign-out"
            variant="ghost"
            onClick={logout}
            leftIcon={<LogOut size={16} />}
            className="!text-danger hover:!bg-danger-light"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </PageShell>
  )
}
