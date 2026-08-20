// Staff List — staff directory with attendance badges
//
// Rebuilt 2026-08-19: one flat thin-divider row list at every width instead
// of a separate mobile-card / desktop-table pair. See DESIGN.md.
import { useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Plus, Users, QrCode, User, ChevronRight } from '@/components/ui/icons'

import { apiFetch } from '@/lib/api'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import { Badge, Button, SearchBar, EmptyState, Loading } from '@/components/ui'
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

const ATTENDANCE_BADGE: Record<
  AttendanceStatus,
  { variant: 'success' | 'danger' | 'default'; label: string }
> = {
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
    ? allStaff.filter((s) => s.name.toLowerCase().includes(search.toLowerCase()))
    : allStaff

  return (
    <PageShell
      title="Staff"
      showBack
      rightAction={
        <button
          id="staff-qr-btn"
          type="button"
          onClick={() => navigate('/staff/attendance')}
          className="w-9 h-9 rounded-tile bg-card border border-divider flex items-center justify-center hover:border-border transition-colors"
          aria-label="QR Attendance"
        >
          <QrCode size={18} className="text-primary" />
        </button>
      }
    >
      <div className="p-4 md:p-6 flex flex-col gap-4">
        <SearchBar
          id="staff-search"
          value={search}
          onChange={setSearch}
          placeholder="Search staff…"
        />

        {isLoading ? (
          <Loading rows={4} />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Users size={28} />}
            title={search ? 'No matching staff' : 'No staff members'}
            description={search ? 'Try a different name' : 'Invite staff to join your autro'}
          />
        ) : (
          <div className="flex flex-col gap-2">
            {filtered.map((member) => {
              const badge = ATTENDANCE_BADGE[member.attendance_status]
              return (
                <button
                  key={member.id}
                  id={`staff-${member.id}`}
                  type="button"
                  onClick={() => navigate(`/staff/${member.id}`)}
                  className="w-full flex items-center gap-3 p-2.5 rounded-[14px] bg-card border border-divider shadow-[var(--shadow-card)] text-left cursor-pointer hover:border-border active:scale-[0.99] transition-all"
                >
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.name}
                      className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary-light flex items-center justify-center flex-shrink-0">
                      <User size={20} className="text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-row-title font-semibold text-text truncate">{member.name}</p>
                    <p className="text-row-sub text-text-muted truncate mt-0.5 capitalize">
                      {member.role.toLowerCase()}
                      {member.check_in_at ? ` · In ${formatTime(member.check_in_at)}` : ''}
                    </p>
                  </div>
                  <Badge variant={badge.variant}>{badge.label}</Badge>
                  <ChevronRight
                    size={16}
                    className="text-text-muted flex-shrink-0 hidden md:block"
                  />
                </button>
              )
            })}
          </div>
        )}

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
