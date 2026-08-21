// Accept invitation — the screen a staff member lands on from an invite link.
//
// Migrated 2026-08-20 onto the MUI design system. One card on the page ground,
// centred at every width: this is opened on a phone from a WhatsApp message,
// and it has exactly one decision on it.
//
// Four states, all reachable: invalid/expired link, already accepted, revoked,
// and the live invite — which itself splits on whether the visitor is signed
// in yet, because accepting needs an identity to attach the membership to.
import { useParams, useNavigate } from 'react-router'
import { useQuery, useMutation } from '@tanstack/react-query'
import { Avatar, Box, Button, Card, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import GarageIcon from '@mui/icons-material/StorefrontOutlined'
import ShieldIcon from '@mui/icons-material/VerifiedUserOutlined'
import PersonIcon from '@mui/icons-material/PersonOutline'
import LoginIcon from '@mui/icons-material/LoginRounded'
import CheckIcon from '@mui/icons-material/CheckCircleOutlineRounded'
import BlockIcon from '@mui/icons-material/BlockRounded'
import LinkOffIcon from '@mui/icons-material/LinkOffRounded'

import { apiFetch } from '@/lib/api'
import { redirectToGoogleLogin } from '@/lib/auth'
import { useAuth } from '@/providers/auth-provider'
import { useTenant } from '@/providers/tenant-provider'
import { EmptyPanel } from '@/components/ui/empty-panel'
import { Kicker } from '@/components/ui/kicker'
import { useToast, ToastContainer } from '@/components/ui/toast'
import { FullPageSpinner } from '@/components/ui/loading'

interface InviteDetails {
  garage_name: string
  role: string
  invited_by: string
  status: 'PENDING' | 'ACCEPTED' | 'REVOKED'
}

/** Every state on this screen is one centred card on the page ground. */
function Frame({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default', display: 'grid', placeItems: 'center', p: 2 }}>
      <Card sx={{ width: '100%', maxWidth: 420, p: 3 }}>{children}</Card>
    </Box>
  )
}

function DetailRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }): React.JSX.Element {
  return (
    <Stack direction="row" alignItems="center" spacing={1.5} sx={{ bgcolor: 'action.hover', borderRadius: 1.5, px: 2, py: 1.25 }}>
      <Box sx={{ color: 'text.secondary', display: 'grid', placeItems: 'center' }}>{icon}</Box>
      <Box sx={{ minWidth: 0, textAlign: 'left' }}>
        <Kicker>{label}</Kicker>
        <Typography noWrap sx={{ fontSize: 13.5, fontWeight: 600, textTransform: label === 'Role' ? 'capitalize' : 'none' }}>
          {value}
        </Typography>
      </Box>
    </Stack>
  )
}

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
    mutationFn: () => apiFetch(`/staff/invite/${token}/accept`, { method: 'POST' }),
    onSuccess: () => {
      showToast('success', 'Invitation accepted')
      refetchTenant()
      setTimeout(() => void navigate('/checkin'), 800)
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to accept invitation'),
  })

  /** Google consent, carrying this invite path as `state` so the callback
   *  returns the visitor here rather than to the dashboard. */
  const signIn = (): void => redirectToGoogleLogin(`/invite/${token}`)

  if (isLoading) return <FullPageSpinner />

  if (isError || !invite) {
    return (
      <Frame>
        <EmptyPanel
          icon={<LinkOffIcon />}
          title="Invalid invitation"
          description="This invite link may have expired or been revoked"
        />
      </Frame>
    )
  }

  if (invite.status === 'ACCEPTED') {
    return (
      <Frame>
        <EmptyPanel
          icon={<CheckIcon />}
          title="Already accepted"
          description={`You have already joined ${invite.garage_name}`}
          action={{ label: 'Go to check-in', onClick: () => void navigate('/checkin') }}
        />
      </Frame>
    )
  }

  if (invite.status === 'REVOKED') {
    return (
      <Frame>
        <EmptyPanel
          icon={<BlockIcon />}
          title="Invite revoked"
          description="This invitation has been revoked by the owner"
        />
      </Frame>
    )
  }

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <Frame>
        <Stack alignItems="center" spacing={2.5} textAlign="center">
          <Box
            sx={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              display: 'grid',
              placeItems: 'center',
              bgcolor: (t) => alpha(t.palette.primary.main, 0.12),
              color: 'primary.main',
            }}
          >
            <GarageIcon sx={{ fontSize: 32 }} />
          </Box>

          <Box>
            <Typography sx={{ fontSize: 13, color: 'text.disabled' }}>
              You have been invited to join
            </Typography>
            <Typography sx={{ fontSize: 20, fontWeight: 700, mt: 0.5, letterSpacing: '-.015em' }}>
              {invite.garage_name}
            </Typography>
          </Box>

          <Stack spacing={1} sx={{ width: '100%' }}>
            <DetailRow icon={<ShieldIcon sx={{ fontSize: 18 }} />} label="Role" value={invite.role.toLowerCase()} />
            <DetailRow icon={<PersonIcon sx={{ fontSize: 18 }} />} label="Invited by" value={invite.invited_by} />
          </Stack>

          {authToken && user ? (
            <Stack spacing={1.5} sx={{ width: '100%' }}>
              {/* Whose account the membership will attach to — worth showing,
                  since a staff member may be signed in as someone else. */}
              <Stack
                direction="row"
                alignItems="center"
                spacing={1.25}
                sx={{ bgcolor: 'action.hover', borderRadius: 1.5, px: 1.5, py: 1, textAlign: 'left' }}
              >
                <Avatar
                  src={user.avatar_url ?? undefined}
                  imgProps={{ referrerPolicy: 'no-referrer' }}
                  sx={{ width: 32, height: 32, fontSize: 13, fontWeight: 600 }}
                >
                  {user.name?.charAt(0).toUpperCase()}
                </Avatar>
                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Typography noWrap sx={{ fontSize: 12.5, fontWeight: 600 }}>{user.name}</Typography>
                  <Typography noWrap sx={{ fontSize: 11, color: 'text.disabled' }}>{user.email}</Typography>
                </Box>
              </Stack>

              <Button
                id="invite-accept-btn"
                variant="contained"
                fullWidth
                disabled={acceptMutation.isPending}
                onClick={() => acceptMutation.mutate()}
                sx={{ height: 46 }}
              >
                {acceptMutation.isPending ? 'Accepting…' : 'Accept invitation'}
              </Button>
            </Stack>
          ) : (
            <Button
              id="invite-signin-btn"
              variant="contained"
              fullWidth
              startIcon={<LoginIcon />}
              onClick={signIn}
              sx={{ height: 46 }}
            >
              Sign in with Google to accept
            </Button>
          )}
        </Stack>
      </Frame>
    </>
  )
}
