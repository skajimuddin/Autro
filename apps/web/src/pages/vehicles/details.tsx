// Vehicle Details — single vehicle view with status management
import { useParams, useNavigate } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Car,
  User,
  Phone,
  AlertTriangle,
  FileText,
  Receipt,
  ChevronRight,
  ImagePlus,
  Wrench,
  CheckCircle2,
  Truck,
  Clock,
} from 'lucide-react'

import { apiFetch } from '@/lib/api'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import {
  Card,
  Badge,
  Button,
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

// ── Status Config ─────────────────────────────────────────────────────────────

const STATUS_BADGE_MAP: Record<VehicleStatus, { variant: 'warning' | 'success' | 'default' | 'danger'; label: string }> = {
  NEW: { variant: 'default', label: 'New' },
  REPAIRING: { variant: 'warning', label: 'Repairing' },
  READY: { variant: 'success', label: 'Ready' },
  DELIVERED: { variant: 'default', label: 'Delivered' },
}

interface StatusAction {
  nextStatus: VehicleStatus
  label: string
  icon: React.ElementType
  variant: 'primary' | 'success' | 'outline'
}

const STATUS_TRANSITIONS: Partial<Record<VehicleStatus, StatusAction>> = {
  NEW: { nextStatus: 'REPAIRING', label: 'Start Repair', icon: Wrench, variant: 'primary' },
  REPAIRING: { nextStatus: 'READY', label: 'Mark as Ready', icon: CheckCircle2, variant: 'success' },
  READY: { nextStatus: 'DELIVERED', label: 'Mark Delivered', icon: Truck, variant: 'outline' },
}

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

  const statusBadge = STATUS_BADGE_MAP[vehicle.status]
  const transition = STATUS_TRANSITIONS[vehicle.status]

  return (
    <PageShell title={vehicle.registration_number} showBack hideNav>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="p-4 flex flex-col gap-4">
        {/* ── Photo Gallery ────────────────────────────────────── */}
        <PhotoGallery images={vehicle.images} />

        {/* ── Status Section ───────────────────────────────────── */}
        <Card id="vehicle-status-card" className="!p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-text-secondary" />
              <span className="text-sm font-medium text-text-secondary">Status</span>
            </div>
            <Badge variant={statusBadge.variant}>{statusBadge.label}</Badge>
          </div>

          {transition && (
            <div className="mt-3">
              <Button
                id={`vehicle-status-${transition.nextStatus.toLowerCase()}`}
                variant={transition.variant}
                size="sm"
                leftIcon={<transition.icon size={16} />}
                onClick={() => statusMutation.mutate(transition.nextStatus)}
                isLoading={statusMutation.isPending}
              >
                {transition.label}
              </Button>
            </div>
          )}
        </Card>

        {/* ── Customer Card ────────────────────────────────────── */}
        <Card id="vehicle-customer-card">
          <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">
            Customer
          </h3>
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary-light flex items-center justify-center flex-shrink-0">
                <User size={16} className="text-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-text truncate">
                  {vehicle.customer_name}
                </p>
                {vehicle.name && (
                  <p className="text-xs text-text-muted truncate">
                    {vehicle.name}
                  </p>
                )}
              </div>
            </div>
            <a
              id="vehicle-call-customer"
              href={`tel:${vehicle.customer_phone}`}
              className="flex items-center gap-2 text-sm text-primary font-medium hover:text-primary-hover transition-colors"
            >
              <Phone size={14} />
              {vehicle.customer_phone}
            </a>
          </div>
        </Card>

        {/* ── Complaint Card ───────────────────────────────────── */}
        {vehicle.complaint && (
          <Card id="vehicle-complaint-card">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-warning-light flex items-center justify-center flex-shrink-0 mt-0.5">
                <AlertTriangle size={16} className="text-warning" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-1">
                  Complaint
                </h3>
                <p className="text-sm text-text leading-relaxed">
                  {vehicle.complaint}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* ── Financial Summary ─────────────────────────────────── */}
        <Card id="vehicle-financial-card">
          <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">
            Financial Summary
          </h3>
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

        {/* ── Action Buttons ────────────────────────────────────── */}
        <div className="flex flex-col gap-3 pb-4">
          <Button
            id="vehicle-create-estimate"
            variant="outline"
            leftIcon={<FileText size={18} />}
            rightIcon={<ChevronRight size={16} />}
            onClick={() =>
              navigate(`/estimates/new?visit=${vehicle.visit_id}`)
            }
          >
            Create Estimate
          </Button>
          <Button
            id="vehicle-generate-invoice"
            leftIcon={<Receipt size={18} />}
            rightIcon={<ChevronRight size={16} />}
            onClick={() =>
              navigate(`/invoices/new?visit=${vehicle.visit_id}`)
            }
          >
            Generate Invoice
          </Button>
        </div>
      </div>
    </PageShell>
  )
}

// ── Photo Gallery ─────────────────────────────────────────────────────────────

function PhotoGallery({ images }: { images: VehicleImage[] }): React.JSX.Element {
  if (images.length === 0) {
    return (
      <div className="w-full aspect-[16/9] rounded-card bg-card border-2 border-dashed border-border flex flex-col items-center justify-center gap-2 text-text-muted">
        <ImagePlus size={28} />
        <span className="text-sm font-medium">No photos yet</span>
      </div>
    )
  }

  return (
    <div
      className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4"
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      {images.map((img) => (
        <div
          key={img.id}
          className="w-56 h-36 rounded-card overflow-hidden flex-shrink-0 bg-bg"
        >
          <img
            src={img.image_url}
            alt="Vehicle"
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      ))}
      {/* Add Photo button */}
      <button
        id="vehicle-add-photo"
        type="button"
        className="w-24 h-36 rounded-card border-2 border-dashed border-border flex flex-col items-center justify-center gap-1.5 text-text-muted hover:border-primary hover:text-primary transition-colors flex-shrink-0"
      >
        <ImagePlus size={20} />
        <span className="text-[0.65rem] font-medium">Add</span>
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
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-text-muted">{label}</p>
        <p className="text-sm font-bold text-text">
          {value != null ? `₹${value.toLocaleString('en-IN')}` : '—'}
        </p>
      </div>
    </div>
  )
}
