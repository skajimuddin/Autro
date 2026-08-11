// Staff Attendance — QR display for owners
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  QrCode,
  RefreshCw,
  Users,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react'

import { apiFetch } from '@/lib/api'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import {
  Card,
  Button,
  StatCard,
  EmptyState,
  Badge,
  useToast,
  ToastContainer,
} from '@/components/ui'
import { StatCardSkeleton } from '@/components/ui/loading'

// ── Types ─────────────────────────────────────────────────────────────────────

interface QRData {
  token: string
}

interface AttendanceEntry {
  member_id: string
  name: string
  avatar_url: string | null
  check_in_at: string | null
  check_out_at: string | null
  status: 'PRESENT' | 'ABSENT'
}

interface TodayAttendance {
  present: number
  absent: number
  entries: AttendanceEntry[]
}

// ── Attendance Page ───────────────────────────────────────────────────────────

export default function StaffAttendancePage(): React.JSX.Element {
  const { tenant } = useTenant()
  const queryClient = useQueryClient()
  const { toasts, showToast, dismissToast } = useToast()

  const { data: qr, isLoading: qrLoading } = useQuery<QRData>({
    queryKey: ['attendance', 'qr', tenant?.id],
    queryFn: () =>
      apiFetch<QRData>('/attendance/qr', { tenantId: tenant?.id }),
    enabled: Boolean(tenant?.id),
  })

  const { data: today, isLoading: todayLoading } = useQuery<TodayAttendance>({
    queryKey: ['attendance', 'today', tenant?.id],
    queryFn: () =>
      apiFetch<TodayAttendance>('/attendance/today', {
        tenantId: tenant?.id,
      }),
    enabled: Boolean(tenant?.id),
    refetchInterval: 30_000,
  })

  const regenerateMutation = useMutation({
    mutationFn: () =>
      apiFetch('/attendance/qr/regenerate', {
        method: 'POST',
        tenantId: tenant?.id,
      }),
    onSuccess: () => {
      showToast('success', 'QR code regenerated')
      queryClient.invalidateQueries({
        queryKey: ['attendance', 'qr'],
      })
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to regenerate QR')
    },
  })

  return (
    <PageShell title="Staff Attendance" showBack hideNav>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="p-4 flex flex-col gap-5">
        {/* ── QR Code Card ─────────────────────────────────────── */}
        <Card id="attendance-qr-card" className="!p-6">
          <div className="flex flex-col items-center gap-4 text-center">
            {qrLoading ? (
              <div className="w-48 h-48 rounded-2xl bg-divider animate-pulse" />
            ) : qr?.token ? (
              <QRCodeDisplay token={qr.token} />
            ) : (
              <div className="w-48 h-48 rounded-2xl bg-bg flex items-center justify-center">
                <QrCode size={48} className="text-text-muted" />
              </div>
            )}

            <div>
              <p className="text-sm font-semibold text-text">
                Staff can scan this QR to check in
              </p>
              <p className="text-xs text-text-muted mt-1">
                Works only when staff is at the workshop location
              </p>
            </div>
          </div>
        </Card>

        {/* ── Regenerate Button ─────────────────────────────────── */}
        <Button
          id="attendance-regenerate-qr"
          variant="outline"
          leftIcon={<RefreshCw size={16} />}
          isLoading={regenerateMutation.isPending}
          onClick={() => regenerateMutation.mutate()}
        >
          Regenerate QR
        </Button>

        {/* ── Today's Stats ────────────────────────────────────── */}
        <div>
          <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">
            Today
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {todayLoading ? (
              <>
                <StatCardSkeleton />
                <StatCardSkeleton />
              </>
            ) : (
              <>
                <StatCard
                  id="attendance-present"
                  icon={<CheckCircle2 size={18} className="text-success" />}
                  iconBg="bg-success-light"
                  value={today?.present ?? 0}
                  label="Present"
                />
                <StatCard
                  id="attendance-absent"
                  icon={<XCircle size={18} className="text-danger" />}
                  iconBg="bg-danger-light"
                  value={today?.absent ?? 0}
                  label="Absent"
                />
              </>
            )}
          </div>
        </div>

        {/* ── Today's Attendance List ──────────────────────────── */}
        <section>
          <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">
            Attendance Log
          </h3>
          {todayLoading ? (
            <Card className="!p-4">
              <div className="space-y-3">
                {[0, 1, 2].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-divider animate-pulse" />
                    <div className="flex-1 space-y-1.5">
                      <div className="h-3 w-24 rounded bg-divider animate-pulse" />
                      <div className="h-2.5 w-16 rounded bg-divider animate-pulse" />
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ) : !today?.entries.length ? (
            <EmptyState
              icon={<Users size={24} />}
              title="No attendance yet"
              description="Staff attendance will appear here"
            />
          ) : (
            <Card className="!p-0 overflow-hidden">
              {today.entries.map((entry) => (
                <AttendanceRow key={entry.member_id} entry={entry} />
              ))}
            </Card>
          )}
        </section>
      </div>
    </PageShell>
  )
}

// ── QR Code Display ───────────────────────────────────────────────────────────
// Renders a visual QR placeholder (actual QR rendering requires qrcode.react lib)

function QRCodeDisplay({ token }: { token: string }): React.JSX.Element {
  return (
    <div className="w-48 h-48 rounded-2xl bg-card border-2 border-border flex flex-col items-center justify-center gap-2 p-4">
      <QrCode size={64} className="text-text" />
      <p className="text-[0.55rem] text-text-muted font-mono break-all text-center leading-tight">
        {token.slice(0, 12)}…
      </p>
    </div>
  )
}

// ── Attendance Row ────────────────────────────────────────────────────────────

function AttendanceRow({
  entry,
}: {
  entry: AttendanceEntry
}): React.JSX.Element {
  const isPresent = entry.status === 'PRESENT'

  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-divider last:border-b-0">
      <div className="w-9 h-9 rounded-xl bg-primary-light flex items-center justify-center flex-shrink-0">
        <Users size={14} className="text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text truncate">{entry.name}</p>
        <div className="flex items-center gap-2 mt-0.5">
          {entry.check_in_at && (
            <span className="flex items-center gap-0.5 text-[0.65rem] text-success">
              <Clock size={10} />
              {formatTime(entry.check_in_at)}
            </span>
          )}
          {entry.check_out_at && (
            <span className="flex items-center gap-0.5 text-[0.65rem] text-text-muted">
              <Clock size={10} />
              {formatTime(entry.check_out_at)}
            </span>
          )}
        </div>
      </div>
      <Badge variant={isPresent ? 'success' : 'danger'}>
        {isPresent ? 'Present' : 'Absent'}
      </Badge>
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
