// Accept Invitation — staff invite acceptance flow
import { useParams, useNavigate } from 'react-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  Building2,
  Users,
  User,
  Shield,
  LogIn,
} from '@/components/ui/icons'

import { apiFetch } from '@/lib/api'
import { useAuth } from '@/providers/auth-provider'
import { useTenant } from '@/providers/tenant-provider'
import { MobileContainer } from '@/components/layout/mobile-container'
import {
  Card,
  Button,
  EmptyState,
  useToast,
  ToastContainer,
} from '@/components/ui'
import { FullPageSpinner } from '@/components/ui/loading'
import { config } from '@/lib/config'

// ── Types ─────────────────────────────────────────────────────────────────────

interface InviteDetails {
  garage_name: string
  role: string
  invited_by: string
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED'
}

// ── Invite Accept Page ────────────────────────────────────────────────────────

export default function InviteAcceptPage(): React.JSX.Element {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()
  const { user, token: authToken } = useAuth()
  const { refetch: refetchTenant } = useTenant()
  const { toasts, showToast, dismissToast } = useToast()

  const { data: invite, isLoading, isError } = useQuery<InviteDetails>({
    queryKey: ['invite', token],
    queryFn: () => apiFetch<InviteDetails>(`/staff/invite/${token}`),
    enabled: Boolean(token),
  })

  const acceptMutation = useMutation({
    mutationFn: () =>
      apiFetch(`/staff/invite/${token}/accept`, {
        method: 'POST',
      }),
    onSuccess: () => {
      showToast('success', 'Invitation accepted!')
      refetchTenant()
      setTimeout(() => navigate('/checkin'), 800)
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to accept invitation')
    },
  })

  const handleSignIn = () => {
    const googleAuthUrl =
      `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${config.googleClientId}` +
      `&redirect_uri=${encodeURIComponent(`${window.location.origin}/auth/callback`)}` +
      `&response_type=code` +
      `&scope=${encodeURIComponent('openid email profile')}` +
      `&state=${encodeURIComponent(`/invite/${token}`)}`
    window.location.href = googleAuthUrl
  }

  if (isLoading) return <FullPageSpinner />

  if (isError || !invite) {
    return (
      <MobileContainer>
        <div className="min-h-dvh flex items-center justify-center p-4">
          <EmptyState
            icon={<Users size={28} />}
            title="Invalid invitation"
            description="This invite link may have expired or been revoked"
          />
        </div>
      </MobileContainer>
    )
  }

  if (invite.status === 'ACCEPTED') {
    return (
      <MobileContainer>
        <div className="min-h-dvh flex items-center justify-center p-4">
          <Card className="!p-6 text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 bg-success-light flex items-center justify-center">
                <Users size={28} className="text-success" />
              </div>
              <div>
                <p className="text-base font-bold text-text">Already accepted</p>
                <p className="text-sm text-text-muted mt-1">
                  You've already joined {invite.garage_name}
                </p>
              </div>
              <Button
                size="sm"
                fullWidth={false}
                onClick={() => navigate('/checkin')}
              >
                Go to Check-In
              </Button>
            </div>
          </Card>
        </div>
      </MobileContainer>
    )
  }

  if (invite.status === 'REVOKED') {
    return (
      <MobileContainer>
        <div className="min-h-dvh flex items-center justify-center p-4">
          <EmptyState
            icon={<Shield size={28} />}
            title="Invite revoked"
            description="This invitation has been revoked by the owner"
          />
        </div>
      </MobileContainer>
    )
  }

  return (
    <MobileContainer>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="min-h-dvh flex items-center justify-center p-4">
        <Card className="!p-6 w-full">
          <div className="flex flex-col items-center gap-5 text-center">
            {/* Garage Icon */}
            <div className="w-20 h-20 bg-primary-light flex items-center justify-center">
              <Building2 size={36} className="text-primary" />
            </div>

            {/* Invite Info */}
            <div>
              <p className="text-sm text-text-muted">You've been invited to join</p>
              <h2 className="text-xl font-bold text-text mt-1">
                {invite.garage_name}
              </h2>
            </div>

            {/* Details */}
            <div className="w-full flex flex-col gap-2">
              <div className="flex items-center gap-3 bg-bg px-4 py-3">
                <Shield size={16} className="text-text-secondary" />
                <div className="text-left">
                  <p className="text-[0.65rem] text-text-muted uppercase font-bold">
                    Role
                  </p>
                  <p className="text-sm font-semibold text-text capitalize">
                    {invite.role.toLowerCase()}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 bg-bg px-4 py-3">
                <User size={16} className="text-text-secondary" />
                <div className="text-left">
                  <p className="text-[0.65rem] text-text-muted uppercase font-bold">
                    Invited by
                  </p>
                  <p className="text-sm font-semibold text-text">
                    {invite.invited_by}
                  </p>
                </div>
              </div>
            </div>

            {/* Action */}
            {authToken && user ? (
              <div className="w-full flex flex-col gap-3">
                <div className="flex items-center gap-2 bg-bg px-3 py-2 text-left">
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt=""
                      className="w-8 h-8 object-cover"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-primary-light flex items-center justify-center">
                      <User size={14} className="text-primary" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-text truncate">
                      {user.name}
                    </p>
                    <p className="text-[0.6rem] text-text-muted truncate">
                      {user.email}
                    </p>
                  </div>
                </div>

                <Button
                  id="invite-accept-btn"
                  isLoading={acceptMutation.isPending}
                  onClick={() => acceptMutation.mutate()}
                >
                  Accept Invitation
                </Button>
              </div>
            ) : (
              <Button
                id="invite-signin-btn"
                leftIcon={<LogIn size={18} />}
                onClick={handleSignIn}
              >
                Sign in with Google to Accept
              </Button>
            )}
          </div>
        </Card>
      </div>
    </MobileContainer>
  )
}
