// Vehicle Details — single vehicle view with status management
//
// Rebuilt 2026-08-19 to match planning/design_handoff_autro_ui: a free-choice
// Repairing/Ready/Delivered segmented control (the visits API accepts any
// status directly — verified in apps/api/src/routes/visits.ts — so this is
// safe, not just a visual change), a 3-up photo grid, and a flat
// kicker/card-title/card-body customer card. Complaint and financial-summary
// cards are real app data the handoff never modeled (it has no complaint
// field or estimate/invoice totals) — kept, restyled flat, not dropped. See
// DESIGN.md.
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
} from '@/components/ui/icons'

import { apiFetch } from '@/lib/api'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import {
  Card,
  Button,
  SegmentedControl,
  EmptyState,
  useToast,
  ToastContainer,
} from '@/components/ui'
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

const STATUS_OPTIONS: { value: VehicleStatus; label: string }[] = [
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

  const { data: vehicle, isLoading, isError } = useQuery<VehicleDetail>({
    queryKey: ['vehicle', id],
    queryFn: () =>
      apiFetch<VehicleDetail>(`/vehicles/${id}`, {
        tenantId: tenant?.id,
      }),
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
          icon={<Car size={28} />}
          title="Vehicle not found"
          description="This vehicle may have been removed"
          action={
            <Button
              size="sm"
              fullWidth={false}
              onClick={() => navigate('/vehicles')}
            >
              Back to Vehicles
            </Button>
          }
        />
      </PageShell>
    )
  }

  return (
    <PageShell title={vehicle.registration_number} showBack hideNav>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="p-4 md:p-6 md:grid md:grid-cols-[1.4fr_1fr] md:gap-6 md:items-start">
        <div className="flex flex-col gap-5">
          {/* ── Status ─────────────────────────────────────────── */}
          <SegmentedControl
            id="vehicle-status"
            aria-label="Status"
            fill
            // A fresh vehicle starts life as NEW (no option below matches, so
            // nothing lights up) until the owner picks one — the cast is
            // type-only, the runtime comparison against 'NEW' is still exact.
            value={vehicle.status as 'REPAIRING' | 'READY' | 'DELIVERED'}
            onChange={(next) => statusMutation.mutate(next)}
            options={STATUS_OPTIONS}
          />

          {/* ── Photos ─────────────────────────────────────────── */}
          <div>
            <p className="text-kicker font-semibold text-text-secondary uppercase tracking-[0.08em] mb-2">
              Photos
            </p>
            <PhotoGrid images={vehicle.images} />
          </div>

          {/* ── Complaint ──────────────────────────────────────── */}
          {vehicle.complaint && (
            <Card id="vehicle-complaint-card">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 bg-warning-light flex items-center justify-center flex-shrink-0 mt-0.5">
                  <AlertTriangle size={16} className="text-warning" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-kicker font-semibold text-text-secondary uppercase tracking-[0.08em] mb-1">
                    Complaint
                  </p>
                  <p className="text-row-title text-text leading-relaxed">
                    {vehicle.complaint}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* ── Financial summary ─────────────────────────────── */}
          <Card id="vehicle-financial-card">
            <p className="text-kicker font-semibold text-text-secondary uppercase tracking-[0.08em] mb-3">
              Financial Summary
            </p>
            <div className="grid grid-cols-2 gap-3">
              <FinancialBlock
                label="Estimate"
                value={vehicle.estimate_total}
                icon={<FileText size={16} className="text-warning" />}
                iconBg="bg-warning-light"
              />
              <FinancialBlock
                label="Invoice"
                value={vehicle.invoice_total}
                icon={<Receipt size={16} className="text-success" />}
                iconBg="bg-success-light"
              />
            </div>
          </Card>

          {/* ── Actions ────────────────────────────────────────── */}
          <div className="flex gap-3 flex-wrap">
            <Button
              id="vehicle-call-customer"
              variant="outline"
              fullWidth={false}
              leftIcon={<Phone size={16} />}
              className="flex-1 min-w-[140px]"
              onClick={() => { window.location.href = `tel:${vehicle.customer_phone}` }}
            >
              Call customer
            </Button>
            <Button
              id="vehicle-create-estimate"
              fullWidth={false}
              leftIcon={<FileText size={16} />}
              className="flex-1 min-w-[140px]"
              onClick={() => navigate(`/estimates/new?visit=${vehicle.visit_id}`)}
            >
              Create estimate
            </Button>
          </div>
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
        <Card id="vehicle-customer-card" elevated className="mt-5 md:mt-0 flex flex-col gap-1.5">
          <p className="text-kicker font-semibold text-text-secondary uppercase tracking-[0.08em]">
            Customer
          </p>
          <p className="text-value font-bold text-text truncate">{vehicle.customer_name}</p>
          <p className="text-row-title text-text-secondary">
            {vehicle.customer_phone} · Vehicle in since {formatDate(vehicle.created_at)}
          </p>
        </Card>
      </div>
    </PageShell>
  )
}

// ── Photo Grid ────────────────────────────────────────────────────────────────

function PhotoGrid({ images }: { images: VehicleImage[] }): React.JSX.Element {
  return (
    <div className="grid grid-cols-3 gap-2">
      {images.map((img) => (
        <div key={img.id} className="aspect-square overflow-hidden bg-bg border-2 border-divider">
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
        className="aspect-square border-2 border-dashed border-divider flex flex-col items-center justify-center gap-1.5 text-text-muted hover:border-primary hover:text-primary transition-colors"
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
      <div className={`w-9 h-9 flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div>
        <p className="text-row-sub text-text-muted">{label}</p>
        <p className="text-row-title font-bold text-text">
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
