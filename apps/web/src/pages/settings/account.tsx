// Settings → Account — who's signed in, and the way out.
import { Avatar, Box, Button, Stack, Typography } from '@mui/material'
import MailIcon from '@mui/icons-material/MailOutlineRounded'
import LogoutIcon from '@mui/icons-material/LogoutRounded'

import { useAuth } from '@/providers/auth-provider'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import { SectionCard } from '@/components/ui/section-card'

export default function SettingsAccountPage(): React.JSX.Element {
  const { user, logout } = useAuth()
  const { role } = useTenant()

  return (
    <PageShell title="Account" mobileTitle="Account" showBack hideNav>
      <Box sx={{ px: { xs: 2, md: 3.5 }, pb: 4, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <SectionCard id="account-profile-card" title="Your profile" padded>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar
              src={user?.avatar_url ?? undefined}
              imgProps={{ referrerPolicy: 'no-referrer' }}
              variant="rounded"
              sx={{ width: 56, height: 56, borderRadius: 2, fontSize: 20, fontWeight: 600 }}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography noWrap sx={{ fontSize: 16, fontWeight: 700 }}>
                {user?.name ?? 'Signed in'}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 0.25 }}>
                <MailIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                <Typography noWrap sx={{ fontSize: 12.5, color: 'text.disabled' }}>
                  {user?.email ?? ''}
                </Typography>
              </Stack>
              {role && (
                <Typography sx={{ fontSize: 12, color: 'text.secondary', textTransform: 'capitalize', mt: 0.25 }}>
                  {role.toLowerCase()}
                </Typography>
              )}
            </Box>
          </Stack>
        </SectionCard>

        <Button
          id="settings-sign-out"
          color="error"
          startIcon={<LogoutIcon />}
          onClick={logout}
          sx={{ alignSelf: 'flex-start' }}
        >
          Sign out
        </Button>
      </Box>
    </PageShell>
  )
}
