// Vehicle Details — one vehicle, its current visit, and the actions on it.
//
// Rebuilt 2026-08-20 for the rounded design system (see DESIGN.md). The status
// control is a job-progress stepper (New → Repairing → Ready → Delivered)
// rather than a segmented control: a repair moves through stages, and the
// stepper shows where this job *is* as well as letting the owner move it.
//
// All four stages are clickable in any direction — verified against
// UpdateVisitStatusSchema (packages/shared/src/schemas/vehicle.ts), which
// accepts any of the four with no forward-only restriction. The stepper is a
// presentation of that, not a workflow constraint the API doesn't have.
import { useParams, useNavigate } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Car,
  Phone,
  AlertTriangle,
  FileText,
  Receipt,
  ChevronRight,
  ImagePlus,
  Check,
} from '@/components/ui/icons'

import { apiFetch } from '@/lib/api'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import { Card, Button, EmptyState, useToast, ToastContainer } from '@/components/ui'
import { FullPageSpinner } from '@/components/ui/loading'

// ── Types ─────────────────────────────────────────────────────────────────────

type VehicleStatus = 'NEW' | 'REPAIRING' | 'READY' | 'DELIVERED'

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
  status: VehicleStatus
  complaint: string | null
  images: VehicleImage[]
  visit_id: string | null
  estimate_total: number | null
  invoice_total: number | null
  created_at: string
}

/** Display order == the real repair progression in shared/constants/status.ts */
const STAGES: { value: VehicleStatus; label: string }[] = [
  { value: 'NEW', label: 'New' },
  { value: 'REPAIRING', label: 'Repairing' },
  { value: 'READY', label: 'Ready' },
  { value: 'DELIVERED', label: 'Delivered' },
]

// ── Vehicle Details Page ──────────────────────────────────────────────────────

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
    mutationFn: (newStatus: VehicleStatus) =>
      apiFetch(`/visits/${vehicle?.visit_id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
        tenantId: tenant?.id,
      }),
    onSuccess: () => {
      showToast('success', 'Status updated')
      queryClient.invalidateQueries({ queryKey: ['vehicle', id] })
      // The list and dashboard both show this vehicle's stage and the stage
      // counts, so they are stale the moment this succeeds.
      queryClient.invalidateQueries({ queryKey: ['vehicles'] })
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to update status')
    },
  })

  if (isLoading) return <FullPageSpinner />

  if (isError || !vehicle) {
    return (
      <PageShell title="Vehicle" showBack hideNav>
        <EmptyState
          icon={<Car size={24} />}
          title="Vehicle not found"
          description="This vehicle may have been removed"
          action={
            <Button size="sm" fullWidth={false} onClick={() => navigate('/vehicles')}>
              Back to vehicles
            </Button>
          }
        />
      </PageShell>
    )
  }

  return (
    <PageShell
      title={vehicle.registration_number}
      subtitle={vehicle.name ?? undefined}
      showBack
      hideNav
      wide
    >
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="px-4 md:px-7 pb-28 md:pb-8 md:grid md:grid-cols-[1.4fr_1fr] md:gap-6 md:items-start">
        <div className="flex flex-col gap-4">
          {/* ── Job status stepper ─────────────────────────────── */}
          <Card id="vehicle-status" className="!p-4">
            <p className="text-row-sub font-bold text-text mb-3.5">
              Job status
              {!vehicle.visit_id && (
                <span className="font-normal text-text-muted"> — no open visit</span>
              )}
            </p>
            <StatusStepper
              current={vehicle.status}
              disabled={!vehicle.visit_id || statusMutation.isPending}
              onSelect={(next) => statusMutation.mutate(next)}
            />
          </Card>

          {/* ── Photos ─────────────────────────────────────────── */}
          <div>
            <p className="text-row-sub font-bold text-text mb-2">Photos</p>
            <PhotoGrid images={vehicle.images} />
          </div>

          {/* ── Complaint ──────────────────────────────────────── */}
          {vehicle.complaint && (
            <Card id="vehicle-complaint-card">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-warning-light flex items-center justify-center flex-shrink-0">
                  <AlertTriangle size={16} className="text-warning-deep" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-row-sub font-bold text-text mb-1">Complaint</p>
                  <p className="text-row-title text-text-secondary leading-relaxed">
                    {vehicle.complaint}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* ── Financial summary ─────────────────────────────── */}
          <Card id="vehicle-financial-card">
            <p className="text-row-sub font-bold text-text mb-3">Financial summary</p>
            <div className="flex flex-wrap gap-x-10 gap-y-3">
              <FinancialBlock
                label="Estimate"
                value={vehicle.estimate_total}
                icon={<FileText size={16} className="text-warning-deep" />}
                iconBg="bg-warning-light"
              />
              <FinancialBlock
                label="Invoice"
                value={vehicle.invoice_total}
                icon={<Receipt size={16} className="text-success-deep" />}
                iconBg="bg-success-light"
              />
            </div>
          </Card>

          {/* ── Primary actions ──────────────────────────────────
              Calling the customer and starting an estimate are what this
              screen exists for, so they lead the column on desktop and are
              pinned above the fold on mobile — both used to sit below a
              scroll, under the secondary "Generate invoice". */}
          <div className="fixed md:static bottom-0 left-0 right-0 z-30 flex gap-2.5 px-4 md:px-0 py-3 md:py-0 bg-bg/90 md:bg-transparent backdrop-blur-sm md:backdrop-blur-none border-t md:border-t-0 border-divider pb-[max(env(safe-area-inset-bottom,0px),0.75rem)] md:pb-0">
            <Button
              id="vehicle-call-customer"
              variant="outline"
              fullWidth={false}
              leftIcon={<Phone size={16} />}
              className="flex-1 !bg-card"
              onClick={() => { window.location.href = `tel:${vehicle.customer_phone}` }}
            >
              Call
            </Button>
            <Button
              id="vehicle-create-estimate"
              fullWidth={false}
              leftIcon={<FileText size={16} />}
              className="flex-[2]"
              onClick={() => navigate(`/estimates/new?visit=${vehicle.visit_id}`)}
            >
              Create estimate
            </Button>
          </div>

          {/* ── Generate invoice ───────────────────────────────── */}
          <Button
            id="vehicle-generate-invoice"
            variant="outline"
            leftIcon={<Receipt size={16} />}
            rightIcon={<ChevronRight size={14} />}
            onClick={() => navigate(`/invoices/new?visit=${vehicle.visit_id}`)}
          >
            Generate invoice
          </Button>
        </div>

        {/* ── Customer card ────────────────────────────────────── */}
        <Card
          id="vehicle-customer-card"
          className="mt-4 md:mt-0 !bg-primary !border-primary flex flex-col gap-1.5 !p-5 shadow-[var(--shadow-primary)]"
        >
          <p className="text-kicker font-semibold text-white/75 uppercase tracking-[0.08em]">
            Customer
          </p>
          <p className="text-value font-extrabold text-white truncate">{vehicle.customer_name}</p>
          <p className="text-row-title text-white/85">{vehicle.customer_phone}</p>
          <p className="text-row-sub text-white/65 mt-1.5">
            In since {formatDate(vehicle.created_at)}
          </p>
        </Card>
      </div>

    </PageShell>
  )
}

// ── Status Stepper ────────────────────────────────────────────────────────────

interface StatusStepperProps {
  current: VehicleStatus
  disabled: boolean
  onSelect: (status: VehicleStatus) => void
}

function StatusStepper({ current, disabled, onSelect }: StatusStepperProps): React.JSX.Element {
  const currentIndex = STAGES.findIndex((s) => s.value === current)

  return (
    // Equal-width grid columns, with each connector drawn from the centre of
    // its own dot to the centre of the next. A flex row sized the columns to
    // their LABEL widths ("Repairing" vs "New"), which spaced the dots
    // unevenly — the stepper only reads as a track when the dots are on a
    // regular rhythm.
    <div role="radiogroup" aria-label="Job status" className="grid grid-cols-4">
      {STAGES.map((stage, index) => {
        const isDone = index < currentIndex
        const isCurrent = index === currentIndex
        const isLast = index === STAGES.length - 1

        return (
          <div key={stage.value} className="relative flex flex-col items-center gap-2">
            {!isLast && (
              <div
                aria-hidden="true"
                className={[
                  // top-[11px] centres the 2px rule on the 24px dot.
                  'absolute top-[11px] left-1/2 w-full h-0.5',
                  index < currentIndex ? 'bg-primary' : 'bg-divider',
                ].join(' ')}
              />
            )}

            <button
              type="button"
              role="radio"
              aria-checked={isCurrent}
              aria-label={stage.label}
              disabled={disabled}
              onClick={() => onSelect(stage.value)}
              className={[
                'relative z-10 w-6 h-6 rounded-full flex items-center justify-center transition-all',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
                isDone || isCurrent ? 'bg-primary' : 'bg-card border-2 border-divider',
                isCurrent ? 'ring-4 ring-primary/15' : '',
                !disabled && !isDone && !isCurrent ? 'hover:border-primary' : '',
              ].join(' ')}
            >
              {isDone && <Check size={12} className="text-white" strokeWidth={3} />}
            </button>

            <span
              className={[
                'text-[0.6875rem] text-center whitespace-nowrap',
                isCurrent ? 'font-bold text-primary' : 'font-semibold text-text-muted',
              ].join(' ')}
            >
              {stage.label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

// ── Photo Grid ────────────────────────────────────────────────────────────────

function PhotoGrid({ images }: { images: VehicleImage[] }): React.JSX.Element {
  return (
    // Capped width: at md:+ the left column is ~900px, so an uncapped
    // 3-column grid blew each square up to ~280px — an "Add photo"
    // placeholder the size of a hero image.
    <div className="grid grid-cols-3 gap-2 max-w-[420px]">
      {images.map((img) => (
        <div key={img.id} className="aspect-square overflow-hidden rounded-card bg-subtle">
          <img
            src={img.image_url}
            alt="Vehicle"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ))}
      <button
        id="vehicle-add-photo"
        type="button"
        className="aspect-square rounded-card border-2 border-dashed border-divider flex flex-col items-center justify-center gap-1.5 text-text-muted hover:border-primary hover:text-primary transition-colors"
      >
        <ImagePlus size={20} />
        <span className="text-row-sub font-medium">Add photo</span>
      </button>
    </div>
  )
}

// ── Financial Block ───────────────────────────────────────────────────────────

interface FinancialBlockProps {
  label: string
  value: number | null
  icon: React.ReactNode
  iconBg: string
}

function FinancialBlock({ label, value, icon, iconBg }: FinancialBlockProps): React.JSX.Element {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg}`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-row-sub text-text-muted">{label}</p>
        <p className="text-row-title font-bold text-text tabular">
          {value != null ? `₹${value.toLocaleString('en-IN')}` : '—'}
        </p>
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
  } catch {
    return '—'
  }
}
