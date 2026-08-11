// Staff Check-In — QR scan + GPS check-in/out for staff
import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ScanLine,
  MapPin,
  CheckCircle2,
  XCircle,
  LogOut,
  CalendarDays,
} from 'lucide-react'

import { apiFetch } from '@/lib/api'
import { useAuth } from '@/providers/auth-provider'
import { MobileContainer } from '@/components/layout/mobile-container'
import { Topbar } from '@/components/layout/topbar'
import {
  Card,
  Button,
  StatCard,
  useToast,
  ToastContainer,
} from '@/components/ui'

// ── Types ─────────────────────────────────────────────────────────────────────

interface MyTodayAttendance {
  check_in_at: string | null
  check_out_at: string | null
  status: 'PRESENT' | 'ABSENT' | null
}

interface MonthlySummary {
  present: number
  absent: number
}

type CheckinState = 'not_checked_in' | 'checked_in' | 'done'

// ── Check-In Page ─────────────────────────────────────────────────────────────

export default function StaffCheckinPage(): React.JSX.Element {
  const { user, logout } = useAuth()
  const queryClient = useQueryClient()
  const { toasts, showToast, dismissToast } = useToast()
  const [isGettingLocation, setIsGettingLocation] = useState(false)

  // Fetch today's attendance status
  const { data: myToday } = useQuery<MyTodayAttendance>({
    queryKey: ['attendance', 'my-today'],
    queryFn: () => apiFetch<MyTodayAttendance>('/attendance/my-today'),
    refetchInterval: 10_000,
  })

  // Fetch monthly summary
  const { data: monthly } = useQuery<MonthlySummary>({
    queryKey: ['attendance', 'monthly-self'],
    queryFn: () => {
      const now = new Date()
      const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
      return apiFetch<MonthlySummary>(`/attendance/monthly?month=${month}`)
    },
  })

  // Determine current state
  const getCheckinState = (): CheckinState => {
    if (!myToday) return 'not_checked_in'
    if (myToday.check_in_at && myToday.check_out_at) return 'done'
    if (myToday.check_in_at) return 'checked_in'
    return 'not_checked_in'
  }
  const state = getCheckinState()

  // Check-in mutation
  const checkinMutation = useMutation({
    mutationFn: (data: { qr_token: string; latitude: number; longitude: number }) =>
      apiFetch('/attendance/checkin', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      showToast('success', 'Checked in successfully')
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Check-in failed')
    },
  })

  // Check-out mutation
  const checkoutMutation = useMutation({
    mutationFn: (data: { latitude: number; longitude: number }) =>
      apiFetch('/attendance/checkout', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      showToast('success', 'Checked out successfully')
      queryClient.invalidateQueries({ queryKey: ['attendance'] })
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Check-out failed')
    },
  })

  // Handle check-in (simplified — real implementation would open QR scanner)
  const handleCheckin = useCallback(() => {
    setIsGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsGettingLocation(false)
        // In production, this token comes from scanning the QR code
        const token = window.prompt('Enter QR Token (Simulating scan):')
        if (!token) {
          showToast('error', 'Check-in cancelled')
          return
        }
        checkinMutation.mutate({
          qr_token: token,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      () => {
        setIsGettingLocation(false)
        showToast('error', 'Could not get your location. Please enable GPS.')
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }, [showToast, checkinMutation])

  // Handle check-out
  const handleCheckout = useCallback(() => {
    setIsGettingLocation(true)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsGettingLocation(false)
        checkoutMutation.mutate({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
      },
      () => {
        setIsGettingLocation(false)
        showToast('error', 'Could not get your location. Please enable GPS.')
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }, [checkoutMutation, showToast])

  const firstName = user?.name?.split(' ')[0] ?? 'Staff'

  return (
    <MobileContainer>
      <Topbar
        title="Check In"
        rightAction={
          <button
            id="checkin-logout"
            type="button"
            onClick={logout}
            className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-bg transition-colors"
            aria-label="Sign out"
          >
            <LogOut size={18} className="text-text-muted" />
          </button>
        }
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <main className="animate-page-enter p-4 flex flex-col gap-5" style={{ minHeight: 'calc(100dvh - 56px)' }}>
        {/* ── Greeting ──────────────────────────────────────────── */}
        <div id="checkin-greeting">
          <h2 className="text-xl font-bold text-text">
            Hi, {firstName}
          </h2>
          <p className="text-sm text-text-muted mt-0.5">
            Welcome to your workshop
          </p>
        </div>

        {/* ── Check-in/out Action ──────────────────────────────── */}
        <Card id="checkin-action-card" className="!p-6">
          {state === 'not_checked_in' && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-20 h-20 rounded-full bg-primary-light flex items-center justify-center">
                <ScanLine size={36} className="text-primary" />
              </div>
              <div>
                <p className="text-base font-bold text-text">Ready to check in?</p>
                <p className="text-xs text-text-muted mt-1">
                  Scan the QR code at your workshop
                </p>
              </div>
              <Button
                id="checkin-scan-btn"
                leftIcon={<ScanLine size={18} />}
                isLoading={isGettingLocation || checkinMutation.isPending}
                onClick={handleCheckin}
              >
                Check In
              </Button>
            </div>
          )}

          {state === 'checked_in' && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-20 h-20 rounded-full bg-success-light flex items-center justify-center">
                <CheckCircle2 size={36} className="text-success" />
              </div>
              <div>
                <p className="text-base font-bold text-text">Checked in</p>
                <p className="text-sm text-success font-semibold mt-1">
                  {myToday?.check_in_at
                    ? formatTime(myToday.check_in_at)
                    : '--:--'}
                </p>
              </div>
              <Button
                id="checkout-btn"
                variant="outline"
                leftIcon={<MapPin size={16} />}
                isLoading={isGettingLocation || checkoutMutation.isPending}
                onClick={handleCheckout}
              >
                Check Out
              </Button>
            </div>
          )}

          {state === 'done' && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="w-20 h-20 rounded-full bg-success-light flex items-center justify-center">
                <CheckCircle2 size={36} className="text-success" />
              </div>
              <div>
                <p className="text-base font-bold text-text">Done for today</p>
                <div className="flex items-center gap-4 mt-2">
                  <div className="text-center">
                    <p className="text-[0.65rem] text-text-muted uppercase font-bold">
                      IN
                    </p>
                    <p className="text-sm font-bold text-success">
                      {myToday?.check_in_at
                        ? formatTime(myToday.check_in_at)
                        : '--:--'}
                    </p>
                  </div>
                  <div className="w-px h-6 bg-divider" />
                  <div className="text-center">
                    <p className="text-[0.65rem] text-text-muted uppercase font-bold">
                      OUT
                    </p>
                    <p className="text-sm font-bold text-text">
                      {myToday?.check_out_at
                        ? formatTime(myToday.check_out_at)
                        : '--:--'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* ── Monthly Summary ──────────────────────────────────── */}
        <section>
          <h3 className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3 flex items-center gap-1.5">
            <CalendarDays size={13} />
            This Month
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              id="checkin-present-days"
              icon={<CheckCircle2 size={18} className="text-success" />}
              iconBg="bg-success-light"
              value={monthly?.present ?? 0}
              label="Present"
            />
            <StatCard
              id="checkin-absent-days"
              icon={<XCircle size={18} className="text-danger" />}
              iconBg="bg-danger-light"
              value={monthly?.absent ?? 0}
              label="Absent"
            />
          </div>
        </section>
      </main>
    </MobileContainer>
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
