// Vehicle detail — one vehicle, its current visit, and the actions on it.
//
// Rebuilt 2026-08-20 on the dashboard's design system. Three things changed
// beyond the reskin, each because the old treatment spent colour it hadn't
// earned:
//
//   - The customer panel was a solid brand-blue card. It was the loudest thing
//     on the screen for information you read once; blue now appears only on
//     the primary action and the stage the job is actually at.
//   - The complaint sat in a warning-amber block. Amber means "needs a
//     decision" in this system, and a complaint is the job description, not an
//     alert. Amber is now spent on one thing: a visit that has run past
//     STALE_AFTER_DAYS.
//   - "Add photo" was a button with no handler. It uploads now.
//
// Every figure is backed by GET /vehicles/:id, including the estimate and
// invoice ids — so "View" opens the document the number came from instead of
// starting a new one.
import { useRef } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Box,
  Button,
  ButtonBase,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import CarIcon from '@mui/icons-material/DirectionsCarFilledOutlined'
import PhoneIcon from '@mui/icons-material/LocalPhoneOutlined'
import DescIcon from '@mui/icons-material/DescriptionOutlined'
import ReceiptIcon from '@mui/icons-material/ReceiptOutlined'
import AddPhotoIcon from '@mui/icons-material/AddAPhotoOutlined'
import CheckIcon from '@mui/icons-material/CheckRounded'
import ChevronRightIcon from '@mui/icons-material/ChevronRight'
import type { VisitStatus } from '@autro/shared'

import { apiFetch } from '@/lib/api'
import { uploadVehiclePhoto } from '@/lib/upload'
import {
  daysInShop,
  durationLabel,
  formatDayMonth,
  formatFullDate,
  inr,
  STAGE_LABEL,
  STAGE_ORDER,
  STALE_AFTER_DAYS,
} from '@/lib/format'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import { Kicker } from '@/components/ui/kicker'
import { SectionCard } from '@/components/ui/section-card'
import { EmptyPanel } from '@/components/ui/empty-panel'
import { useToast, ToastContainer } from '@/components/ui/toast'
import { FullPageSpinner } from '@/components/ui/loading'

// ── Types ─────────────────────────────────────────────────────────────────────

interface VehicleImage {
  id: string
  image_url: string
  uploaded_at: string
}

interface VehicleDetail {
  id: string
  registration_number: string
  name: string | null
  customer_id: string
  customer_name: string
  customer_phone: string
  status: VisitStatus
  complaint: string | null
  images: VehicleImage[]
  visit_id: string | null
  visit_started_at: string | null
  estimate_id: string | null
  estimate_total: number | null
  invoice_id: string | null
  invoice_total: number | null
  created_at: string
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function VehicleDetailsPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { tenant } = useTenant()
  const queryClient = useQueryClient()
  const { toasts, showToast, dismissToast } = useToast()

  const {
    data: vehicle,
    isLoading,
    isError,
  } = useQuery<VehicleDetail>({
    queryKey: ['vehicle', id],
    queryFn: () => apiFetch<VehicleDetail>(`/vehicles/${id}`, { tenantId: tenant?.id }),
    enabled: Boolean(id && tenant?.id),
  })

  const statusMutation = useMutation({
    mutationFn: (status: VisitStatus) =>
      apiFetch(`/visits/${vehicle?.visit_id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
        tenantId: tenant?.id,
      }),
    onSuccess: () => {
      showToast('success', 'Stage updated')
      queryClient.invalidateQueries({ queryKey: ['vehicle', id] })
      // The list and the dashboard both show this vehicle's stage and the
      // stage counts, so they are stale the moment this succeeds.
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (err: Error) => showToast('error', err.message || 'Could not update the stage'),
  })

  const photoMutation = useMutation({
    mutationFn: async (file: File) => {
      const imageUrl = await uploadVehiclePhoto(file, tenant?.id)
      return apiFetch(`/vehicles/${id}/images`, {
        method: 'POST',
        body: JSON.stringify({ image_url: imageUrl }),
        tenantId: tenant?.id,
      })
    },
    onSuccess: () => {
      showToast('success', 'Photo added')
      queryClient.invalidateQueries({ queryKey: ['vehicle', id] })
    },
    onError: (err: Error) => showToast('error', err.message || 'Could not add the photo'),
  })

  if (isLoading) return <FullPageSpinner />

  if (isError || !vehicle) {
    return (
      <PageShell title="Vehicle" showBack hideNav>
        <Box sx={{ px: { xs: 2, md: 3.5 } }}>
          <SectionCard>
            <EmptyPanel
              icon={<CarIcon />}
              title="Vehicle not found"
              description="It may have been removed, or the link is out of date"
              action={{ label: 'Back to vehicles', onClick: () => navigate('/vehicles') }}
            />
          </SectionCard>
        </Box>
      </PageShell>
    )
  }

  const days = daysInShop(vehicle.visit_started_at)
  const inShop = days !== null && vehicle.status !== 'DELIVERED'
  const stale = inShop && days >= STALE_AFTER_DAYS

  const createEstimate = (): void => {
    navigate(
      vehicle.estimate_id
        ? `/estimates/${vehicle.estimate_id}`
        : `/estimates/new?visit=${vehicle.visit_id}`,
    )
  }

  const subtitle = [vehicle.name, inShop ? `in the bay ${durationLabel(days).toLowerCase()}` : null]
    .filter(Boolean)
    .join(' · ')

  return (
    <PageShell
      title={vehicle.registration_number}
      subtitle={subtitle || undefined}
      // A sub-screen's app bar shows what it is about; you already know which
      // garage you are in by the time you are two screens deep.
      mobileSubtitle={vehicle.name ?? undefined}
      showBack
      hideNav
      wide
      rightAction={
        <Button variant="contained" startIcon={<DescIcon />} onClick={createEstimate}>
          {vehicle.estimate_id ? 'View estimate' : 'Create estimate'}
        </Button>
      }
      // Below md the two primary actions sit in the bar pinned to the bottom
      // of this screen, within thumb reach.
      mobileAction={null}
    >
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <Box
        sx={{
          px: { xs: 2, md: 3.5 },
          // Clears the fixed action bar on mobile; there is no bar at md:+.
          pb: { xs: 12, md: 4 },
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '1.55fr 1fr' },
          gap: 2.5,
          alignItems: 'start',
        }}
      >
        <Stack spacing={2}>
          {/* ── Job status ──────────────────────────────────────────── */}
          <SectionCard
            id="vehicle-status"
            title="Job status"
            action={
              inShop ? (
                <Chip
                  size="small"
                  label={`${durationLabel(days)} in shop`}
                  sx={
                    stale
                      ? (t) => ({
                          bgcolor: alpha(t.palette.warning.main, 0.14),
                          color: t.palette.warning.main,
                        })
                      : (t) => ({
                          bgcolor: alpha(t.palette.text.primary, 0.06),
                          color: t.palette.text.secondary,
                        })
                  }
                />
              ) : undefined
            }
          >
            <Box sx={{ px: 3, py: 2.5 }}>
              <StatusStepper
                current={vehicle.status}
                disabled={!vehicle.visit_id || statusMutation.isPending}
                onSelect={(next) => statusMutation.mutate(next)}
              />
              {!vehicle.visit_id && (
                <Typography
                  sx={{ fontSize: 12, color: 'text.disabled', mt: 2, textAlign: 'center' }}
                >
                  No open visit — add this vehicle again to start one.
                </Typography>
              )}
            </Box>
          </SectionCard>

          {/* ── Complaint ───────────────────────────────────────────── */}
          {vehicle.complaint && (
            <SectionCard id="vehicle-complaint" padded>
              <Kicker>Reported complaint</Kicker>
              <Typography sx={{ fontSize: 14, color: 'text.secondary', lineHeight: 1.55, mt: 1 }}>
                {vehicle.complaint}
              </Typography>
            </SectionCard>
          )}

          {/* ── Photos ──────────────────────────────────────────────── */}
          <SectionCard id="vehicle-photos" padded>
            <Kicker>Photos</Kicker>
            <PhotoGrid
              images={vehicle.images}
              uploading={photoMutation.isPending}
              onPick={(file) => photoMutation.mutate(file)}
            />
          </SectionCard>

          {/* ── Money ───────────────────────────────────────────────── */}
          <SectionCard id="vehicle-money" title="Money">
            <MoneyRow
              icon={<DescIcon sx={{ fontSize: 17 }} />}
              label="Estimate"
              total={vehicle.estimate_total}
              actionLabel={vehicle.estimate_id ? 'View' : 'Create'}
              onClick={createEstimate}
              emptyLabel="Not created yet"
            />
            <Divider />
            <MoneyRow
              icon={<ReceiptIcon sx={{ fontSize: 17 }} />}
              label="Invoice"
              total={vehicle.invoice_total}
              actionLabel={vehicle.invoice_id ? 'View' : 'Generate'}
              onClick={() =>
                navigate(
                  vehicle.invoice_id
                    ? `/invoices/${vehicle.invoice_id}`
                    : `/invoices/new?visit=${vehicle.visit_id}`,
                )
              }
              emptyLabel="Not generated yet"
            />
          </SectionCard>
        </Stack>

        <Stack spacing={2}>
          {/* ── Customer ────────────────────────────────────────────── */}
          <SectionCard id="vehicle-customer" padded>
            <Kicker>Customer</Kicker>
            <Typography noWrap sx={{ fontSize: 18, fontWeight: 700, mt: 1 }}>
              {vehicle.customer_name}
            </Typography>
            <Typography
              sx={{
                fontSize: 13.5,
                color: 'text.secondary',
                mt: 0.375,
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {vehicle.customer_phone}
            </Typography>
            <Button
              id="vehicle-call-customer"
              variant="outlined"
              fullWidth
              startIcon={<PhoneIcon />}
              href={`tel:${vehicle.customer_phone}`}
              sx={{ mt: 1.75, borderColor: 'divider', color: 'text.primary' }}
            >
              Call customer
            </Button>
          </SectionCard>

          {/* ── Vehicle ─────────────────────────────────────────────── */}
          <SectionCard id="vehicle-spec" title="Vehicle">
            <Spec label="Registration" value={vehicle.registration_number} />
            <Divider />
            <Spec label="Model" value={vehicle.name ?? '—'} />
            <Divider />
            <Spec label="In shop since" value={formatDayMonth(vehicle.visit_started_at)} />
            <Divider />
            <Spec label="First seen" value={formatFullDate(vehicle.created_at)} />
          </SectionCard>
        </Stack>
      </Box>

      {/* ── Mobile action bar ─────────────────────────────────────────── */}
      <Box
        sx={{
          display: { xs: 'flex', md: 'none' },
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 30,
          gap: 1.25,
          px: 2,
          pt: 1.5,
          pb: 'max(env(safe-area-inset-bottom, 0px), 12px)',
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <Button
          variant="outlined"
          startIcon={<PhoneIcon />}
          href={`tel:${vehicle.customer_phone}`}
          sx={{ flex: 1, borderColor: 'divider', color: 'text.primary' }}
        >
          Call
        </Button>
        <Button
          variant="contained"
          startIcon={<DescIcon />}
          onClick={createEstimate}
          sx={{ flex: 2 }}
        >
          {vehicle.estimate_id ? 'View estimate' : 'Create estimate'}
        </Button>
      </Box>
    </PageShell>
  )
}

// ── Status stepper ────────────────────────────────────────────────────────────

interface StatusStepperProps {
  current: VisitStatus
  disabled: boolean
  onSelect: (status: VisitStatus) => void
}

/**
 * A repair moves through stages, so the control shows where this job *is* as
 * well as letting the owner move it.
 *
 * Every stage is selectable in both directions — checked against
 * UpdateVisitStatusSchema, which accepts any of the four with no forward-only
 * restriction. Going back is how you undo a mis-tap, not a workflow violation.
 */
function StatusStepper({ current, disabled, onSelect }: StatusStepperProps): React.JSX.Element {
  const currentIndex = STAGE_ORDER.indexOf(current)

  return (
    // Equal-width grid columns, with each connector drawn from the centre of
    // its own dot to the centre of the next. A flex row sized the columns to
    // their labels ("Repairing" vs "New"), which spaced the dots unevenly —
    // the stepper only reads as a track when the dots are on a regular rhythm.
    <Box
      role="radiogroup"
      aria-label="Job stage"
      sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}
    >
      {STAGE_ORDER.map((stage, index) => {
        const done = index < currentIndex
        const active = index === currentIndex
        const last = index === STAGE_ORDER.length - 1

        return (
          <Box
            key={stage}
            sx={{
              position: 'relative',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 1,
            }}
          >
            {!last && (
              <Box
                aria-hidden
                sx={{
                  // 11px centres the 2px rule on the 24px dot.
                  position: 'absolute',
                  top: 11,
                  left: '50%',
                  width: '100%',
                  height: 2,
                  bgcolor: done ? 'primary.main' : 'divider',
                }}
              />
            )}

            <ButtonBase
              role="radio"
              aria-checked={active}
              aria-label={STAGE_LABEL[stage]}
              disabled={disabled}
              onClick={() => onSelect(stage)}
              sx={{
                position: 'relative',
                zIndex: 1,
                width: 24,
                height: 24,
                borderRadius: '50%',
                color: 'primary.contrastText',
                bgcolor: done || active ? 'primary.main' : 'background.paper',
                border: done || active ? 0 : 2,
                borderColor: 'divider',
                boxShadow: active
                  ? (t) => `0 0 0 4px ${alpha(t.palette.primary.main, 0.15)}`
                  : 'none',
                opacity: disabled ? 0.6 : 1,
              }}
            >
              {done && <CheckIcon sx={{ fontSize: 14 }} />}
            </ButtonBase>

            <Typography
              sx={{
                fontSize: 11,
                fontWeight: active ? 700 : 600,
                color: active ? 'primary.main' : 'text.disabled',
                whiteSpace: 'nowrap',
              }}
            >
              {STAGE_LABEL[stage]}
            </Typography>
          </Box>
        )
      })}
    </Box>
  )
}

// ── Photos ────────────────────────────────────────────────────────────────────

interface PhotoGridProps {
  images: VehicleImage[]
  uploading: boolean
  onPick: (file: File) => void
}

function PhotoGrid({ images, uploading, onPick }: PhotoGridProps): React.JSX.Element {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.25, mt: 1.25 }}>
      {images.map((image) => (
        <Box
          key={image.id}
          component="img"
          src={image.image_url}
          alt=""
          loading="lazy"
          sx={{
            width: 104,
            height: 104,
            borderRadius: 1,
            objectFit: 'cover',
            border: 1,
            borderColor: 'divider',
            bgcolor: 'action.hover',
          }}
        />
      ))}

      <ButtonBase
        id="vehicle-add-photo"
        disabled={uploading}
        onClick={() => inputRef.current?.click()}
        sx={{
          width: 104,
          height: 104,
          borderRadius: 1,
          border: '1.5px dashed',
          borderColor: 'divider',
          color: 'text.disabled',
          display: 'flex',
          flexDirection: 'column',
          gap: 0.75,
          '&:hover': { borderColor: 'primary.main', color: 'primary.main' },
        }}
      >
        {uploading ? <CircularProgress size={20} /> : <AddPhotoIcon sx={{ fontSize: 20 }} />}
        <Typography sx={{ fontSize: 11, fontWeight: 600 }}>
          {uploading ? 'Uploading…' : 'Add photo'}
        </Typography>
      </ButtonBase>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture="environment"
        hidden
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) onPick(file)
          // Reset so picking the same file twice still fires onChange.
          e.target.value = ''
        }}
      />
    </Box>
  )
}

// ── Rows ──────────────────────────────────────────────────────────────────────

interface MoneyRowProps {
  icon: React.ReactNode
  label: string
  total: number | null
  actionLabel: string
  emptyLabel: string
  onClick: () => void
}

function MoneyRow({
  icon,
  label,
  total,
  actionLabel,
  emptyLabel,
  onClick,
}: MoneyRowProps): React.JSX.Element {
  return (
    <ButtonBase
      onClick={onClick}
      sx={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 2.25,
        py: 1.75,
        textAlign: 'left',
      }}
    >
      <Box
        sx={{
          width: 34,
          height: 34,
          borderRadius: 1,
          bgcolor: 'action.hover',
          color: 'text.secondary',
          display: 'grid',
          placeItems: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>

      <Box sx={{ flex: 1, minWidth: 0 }}>
        <Typography sx={{ fontSize: 11.5, color: 'text.disabled' }}>{label}</Typography>
        {total === null ? (
          <Typography sx={{ fontSize: 13.5, color: 'text.disabled' }}>{emptyLabel}</Typography>
        ) : (
          <Typography sx={{ fontSize: 15, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
            {inr(total)}
          </Typography>
        )}
      </Box>

      <Stack direction="row" alignItems="center" sx={{ color: 'primary.main', flexShrink: 0 }}>
        <Typography sx={{ fontSize: 13, fontWeight: 600 }}>{actionLabel}</Typography>
        <ChevronRightIcon sx={{ fontSize: 16 }} />
      </Stack>
    </ButtonBase>
  )
}

function Spec({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <Stack
      direction="row"
      alignItems="baseline"
      justifyContent="space-between"
      spacing={1.5}
      sx={{ px: 2.25, py: 1.375 }}
    >
      <Typography sx={{ fontSize: 12.5, color: 'text.disabled' }}>{label}</Typography>
      <Typography noWrap sx={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
        {value}
      </Typography>
    </Stack>
  )
}
