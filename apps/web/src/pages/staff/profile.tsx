// Staff Profile — individual staff view with attendance + salary
import { useParams, useNavigate } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  User,
  Clock,
  CalendarDays,
  IndianRupee,
  CheckCircle2,
  XCircle,
  Edit3,
  Trash2,
  ChevronRight,
} from '@/components/ui/icons'

import { apiFetch } from '@/lib/api'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import {
  Card,
  Button,
  StatCard,
  EmptyState,
  Modal,
  Input,
  useToast,
  ToastContainer,
} from '@/components/ui'
import { FullPageSpinner } from '@/components/ui/loading'
import { useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

interface StaffProfile {
  id: string
  user_id: string
  name: string
  email: string
  avatar_url: string | null
  role: 'OWNER' | 'STAFF'
  monthly_salary: number | null
  check_in_at: string | null
  check_out_at: string | null
  present_days: number
  absent_days: number
  total_working_days: number
}

// ── Staff Profile Page ────────────────────────────────────────────────────────

export default function StaffProfilePage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { tenant } = useTenant()
  const queryClient = useQueryClient()
  const { toasts, showToast, dismissToast } = useToast()

  const [showSalaryModal, setShowSalaryModal] = useState(false)
  const [showRemoveModal, setShowRemoveModal] = useState(false)
  const [newSalary, setNewSalary] = useState('')

  const { data: profile, isLoading, isError } = useQuery<StaffProfile>({
    queryKey: ['staff', id],
    queryFn: () =>
      apiFetch<StaffProfile>(`/staff/${id}`, {
        tenantId: tenant?.id,
      }),
    enabled: Boolean(id && tenant?.id),
  })

  const salaryMutation = useMutation({
    mutationFn: (salary: number) =>
      apiFetch(`/staff/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ monthly_salary: salary }),
        tenantId: tenant?.id,
      }),
    onSuccess: () => {
      showToast('success', 'Salary updated')
      setShowSalaryModal(false)
      queryClient.invalidateQueries({ queryKey: ['staff', id] })
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to update salary')
    },
  })

  const removeMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/staff/${id}`, {
        method: 'DELETE',
        tenantId: tenant?.id,
      }),
    onSuccess: () => {
      showToast('success', 'Staff member removed')
      navigate('/staff')
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to remove staff')
    },
  })

  if (isLoading) return <FullPageSpinner />

  if (isError || !profile) {
    return (
      <PageShell title="Staff" showBack hideNav>
        <EmptyState
          icon={<User size={28} />}
          title="Staff member not found"
          action={
            <Button
              size="sm"
              fullWidth={false}
              onClick={() => navigate('/staff')}
            >
              Back to Staff
            </Button>
          }
        />
      </PageShell>
    )
  }

  // Calculate estimated salary
  const estimatedSalary =
    profile.monthly_salary && profile.total_working_days > 0
      ? Math.round(
          (profile.present_days / profile.total_working_days) *
            profile.monthly_salary,
        )
      : null

  return (
    <PageShell title={profile.name} showBack hideNav>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="p-4 md:p-6 flex flex-col gap-4">
        {/* ── Profile Header ───────────────────────────────────── */}
        <Card id="staff-profile-header">
          <div className="flex items-center gap-4">
            {profile.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.name}
                className="w-16 h-16 rounded-2xl object-cover flex-shrink-0"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-primary-light flex items-center justify-center flex-shrink-0">
                <User size={28} className="text-primary" />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-lg font-bold text-text truncate">
                {profile.name}
              </p>
              <p className="text-xs text-text-muted truncate">{profile.email}</p>
              <p className="text-xs text-text-secondary mt-0.5 capitalize">
                {profile.role.toLowerCase()}
              </p>
            </div>
          </div>
        </Card>

        {/* ── Today's Attendance ────────────────────────────────── */}
        <Card id="staff-today-attendance">
          <h3 className="text-label font-bold text-text-secondary uppercase tracking-[1px] mb-3">
            Today
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <TimeBlock
              label="IN"
              time={profile.check_in_at}
              variant="success"
            />
            <TimeBlock
              label="OUT"
              time={profile.check_out_at}
              variant="default"
            />
          </div>
        </Card>

        {/* ── Monthly Stats ────────────────────────────────────── */}
        <div>
          <h3 className="text-label font-bold text-text-secondary uppercase tracking-[1px] mb-3">
            This Month
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              id="staff-present-days"
              icon={<CheckCircle2 size={18} className="text-success" />}
              tone="success"
              value={profile.present_days}
              label="Present"
            />
            <StatCard
              id="staff-absent-days"
              icon={<XCircle size={18} className="text-danger" />}
              tone="danger"
              value={profile.absent_days}
              label="Absent"
            />
          </div>
        </div>

        {/* ── Estimated Salary ─────────────────────────────────── */}
        {profile.monthly_salary != null && (
          <Card id="staff-salary-card">
            <h3 className="text-label font-bold text-text-secondary uppercase tracking-[1px] mb-2">
              Estimated Salary
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary-light flex items-center justify-center flex-shrink-0">
                <IndianRupee size={18} className="text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary leading-none">
                  ₹{(estimatedSalary ?? 0).toLocaleString('en-IN')}
                </p>
                <p className="text-[0.65rem] text-text-muted mt-1">
                  ({profile.present_days}/{profile.total_working_days} days) ×
                  ₹{profile.monthly_salary.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* ── Actions ──────────────────────────────────────────── */}
        <div className="flex flex-col gap-3 pt-2 pb-6">
          <Button
            id="staff-view-attendance"
            variant="outline"
            leftIcon={<CalendarDays size={16} />}
            rightIcon={<ChevronRight size={14} />}
            onClick={() => navigate('/staff/attendance')}
          >
            View Full Attendance
          </Button>
          <Button
            id="staff-edit-salary"
            variant="primary"
            leftIcon={<Edit3 size={16} />}
            onClick={() => {
              setNewSalary(String(profile.monthly_salary ?? ''))
              setShowSalaryModal(true)
            }}
          >
            Edit Salary
          </Button>
          {profile.role !== 'OWNER' && (
            <Button
              id="staff-remove"
              variant="ghost"
              leftIcon={<Trash2 size={16} />}
              className="!text-danger hover:!bg-danger-light"
              onClick={() => setShowRemoveModal(true)}
            >
              Remove Staff
            </Button>
          )}
        </div>
      </div>

      {/* ── Edit Salary Modal ──────────────────────────────────── */}
      <Modal
        id="salary-modal"
        isOpen={showSalaryModal}
        onClose={() => setShowSalaryModal(false)}
        title="Edit Monthly Salary"
      >
        <div className="flex flex-col gap-4">
          <Input
            label="Monthly Salary (₹)"
            type="number"
            value={newSalary}
            onChange={(e) => setNewSalary(e.target.value)}
            leftIcon={<IndianRupee size={16} />}
            placeholder="e.g. 15000"
          />
          <Button
            id="salary-save-btn"
            isLoading={salaryMutation.isPending}
            onClick={() => {
              const val = Number(newSalary)
              if (!Number.isNaN(val) && val >= 0) {
                salaryMutation.mutate(val)
              }
            }}
          >
            Save
          </Button>
        </div>
      </Modal>

      {/* ── Remove Confirmation Modal ──────────────────────────── */}
      <Modal
        id="remove-modal"
        isOpen={showRemoveModal}
        onClose={() => setShowRemoveModal(false)}
        title="Remove Staff"
      >
        <div className="flex flex-col gap-4">
          <p className="text-sm text-text-secondary">
            Are you sure you want to remove{' '}
            <strong className="text-text">{profile.name}</strong> from your
            workshop? They will no longer be able to check in.
          </p>
          <div className="flex gap-3">
            <Button
              id="remove-cancel-btn"
              variant="outline"
              onClick={() => setShowRemoveModal(false)}
            >
              Cancel
            </Button>
            <Button
              id="remove-confirm-btn"
              variant="primary"
              className="!bg-danger hover:!bg-red-600"
              isLoading={removeMutation.isPending}
              onClick={() => removeMutation.mutate()}
            >
              Remove
            </Button>
          </div>
        </div>
      </Modal>
    </PageShell>
  )
}

// ── Time Block ────────────────────────────────────────────────────────────────

interface TimeBlockProps {
  label: string
  time: string | null
  variant: 'success' | 'default'
}

function TimeBlock({ label, time, variant }: TimeBlockProps): React.JSX.Element {
  const formatted = time ? formatTime(time) : '--:--'

  return (
    <div className="flex items-center gap-2.5 bg-bg rounded-xl px-3 py-2.5">
      <Clock
        size={16}
        className={variant === 'success' ? 'text-success' : 'text-text-muted'}
      />
      <div>
        <p className="text-[0.65rem] text-text-muted uppercase font-bold">{label}</p>
        <p
          className={[
            'text-sm font-bold',
            variant === 'success' && time ? 'text-success' : 'text-text-muted',
          ].join(' ')}
        >
          {formatted}
        </p>
      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  } catch {
    return '--:--'
  }
}
