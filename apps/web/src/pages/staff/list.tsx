// Staff List — staff directory with attendance badges
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import {
  Plus,
  Users,
  QrCode,
  User,
  Clock,
} from '@/components/ui/icons'

import { apiFetch } from '@/lib/api'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import {
  Card,
  Badge,
  Button,
  SearchBar,
  EmptyState,
  Loading,
} from '@/components/ui'
import { useState } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'NOT_YET'

interface StaffMember {
  id: string
  user_id: string
  name: string
  email: string
  avatar_url: string | null
  role: 'OWNER' | 'STAFF'
  monthly_salary: number | null
  attendance_status: AttendanceStatus
  check_in_at: string | null
}

interface StaffListResponse {
  staff: StaffMember[]
}

// ── Attendance Badge Config ───────────────────────────────────────────────────

const ATTENDANCE_BADGE: Record<AttendanceStatus, { variant: 'success' | 'danger' | 'default'; label: string }> = {
  PRESENT: { variant: 'success', label: 'Present' },
  ABSENT: { variant: 'danger', label: 'Absent' },
  NOT_YET: { variant: 'default', label: 'Not yet' },
}

// ── Staff List Page ───────────────────────────────────────────────────────────

export default function StaffListPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { tenant } = useTenant()
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery<StaffListResponse>({
    queryKey: ['staff', tenant?.id],
    queryFn: () =>
      apiFetch<StaffListResponse>('/staff', {
        tenantId: tenant?.id,
      }),
    enabled: Boolean(tenant?.id),
  })

  const allStaff = data?.staff ?? []
  const filtered = search.trim()
    ? allStaff.filter((s) =>
        s.name.toLowerCase().includes(search.toLowerCase()),
      )
    : allStaff

  return (
    <PageShell
      title="Staff"
      showBack
      wide
      rightAction={
        <button
          id="staff-qr-btn"
          type="button"
          onClick={() => navigate('/staff/attendance')}
          className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-bg transition-colors"
          aria-label="QR Attendance"
        >
          <QrCode size={20} className="text-primary" />
        </button>
      }
    >
      <div className="p-4 md:p-6 flex flex-col gap-4">
        {/* ── Search ───────────────────────────────────────────── */}
        <SearchBar
          id="staff-search"
          value={search}
          onChange={setSearch}
          placeholder="Search staff…"
        />

        {/* ── Staff List ───────────────────────────────────────── */}
        {isLoading ? (
          <Loading rows={4} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Users size={28} />}
            title={search ? 'No matching staff' : 'No staff members'}
            description={
              search
                ? 'Try a different name'
                : 'Invite staff to join your autro'
            }
          />
        ) : (
          <>
            {/* Mobile / Tablet grid (hidden on lg and up) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 lg:hidden">
              {filtered.map((member) => (
                <StaffCard key={member.id} member={member} />
              ))}
            </div>

            {/* Desktop table (visible on lg and up) */}
            <div className="hidden lg:block bg-card rounded-card shadow-[var(--shadow-card)] overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-bg/50 border-b border-border">
                    <th className="py-4 px-5 text-label font-bold text-text-secondary uppercase tracking-wide">Name</th>
                    <th className="py-4 px-5 text-label font-bold text-text-secondary uppercase tracking-wide">Role</th>
                    <th className="py-4 px-5 text-label font-bold text-text-secondary uppercase tracking-wide">Status</th>
                    <th className="py-4 px-5 text-label font-bold text-text-secondary uppercase tracking-wide">Check In</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((member) => {
                    const badge = ATTENDANCE_BADGE[member.attendance_status]
                    return (
                      <tr
                        key={member.id}
                        onClick={() => navigate(`/staff/${member.id}`)}
                        className="hover:bg-bg/50 cursor-pointer transition-colors border-b border-border last:border-0"
                      >
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3">
                            {member.avatar_url ? (
                              <img src={member.avatar_url} alt={member.name} className="w-8 h-8 rounded-lg object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-primary-light flex items-center justify-center">
                                <User size={14} className="text-primary" />
                              </div>
                            )}
                            <span className="text-row-title font-bold text-text">{member.name}</span>
                          </div>
                        </td>
                        <td className="py-4 px-5 text-row-sub text-text-secondary capitalize">{member.role.toLowerCase()}</td>
                        <td className="py-4 px-5">
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </td>
                        <td className="py-4 px-5 text-row-sub text-text-secondary">
                          {member.check_in_at ? formatTime(member.check_in_at) : '—'}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ── Add Staff FAB ────────────────────────────────────── */}
        <div className="pt-2 pb-4">
          <Button
            id="staff-add-btn"
            leftIcon={<Plus size={18} />}
            onClick={() => navigate('/staff/add')}
          >
            Add Staff
          </Button>
        </div>
      </div>
    </PageShell>
  )
}

// ── Staff Card ────────────────────────────────────────────────────────────────

function StaffCard({ member }: { member: StaffMember }): React.JSX.Element {
  const navigate = useNavigate()
  const badge = ATTENDANCE_BADGE[member.attendance_status]

  return (
    <Card
      id={`staff-${member.id}`}
      onClick={() => navigate(`/staff/${member.id}`)}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        {member.avatar_url ? (
          <img
            src={member.avatar_url}
            alt={member.name}
            className="w-11 h-11 rounded-xl object-cover flex-shrink-0"
            referrerPolicy="no-referrer"
          />
        ) : (
          <div className="w-11 h-11 rounded-xl bg-primary-light flex items-center justify-center flex-shrink-0">
            <User size={18} className="text-primary" />
          </div>
        )}

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-row-title font-bold text-text truncate">
              {member.name}
            </p>
            <Badge variant={badge.variant}>{badge.label}</Badge>
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-text-muted capitalize">
              {member.role.toLowerCase()}
            </span>
            {member.check_in_at && (
              <span className="flex items-center gap-0.5 text-[0.65rem] text-success">
                <Clock size={10} />
                {formatTime(member.check_in_at)}
              </span>
            )}
          </div>
        </div>
      </div>
    </Card>
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
