// Settings hub — one row per section, each its own page.
//
// This used to be a single form (profile + garage + a GPS button + sign out).
// It grew: payroll rules, PDF customisation and the location gate each need
// enough room (and enough explanation) that cramming them into one page
// would either bury them or turn Settings into an endless scroll. So this is
// now a menu — index.tsx picks a section, every section owns its own screen,
// save and validation.
import type React from 'react'
import { Avatar, Box, List, ListItemButton, ListItemIcon, ListItemText, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import ChevronRightIcon from '@mui/icons-material/ChevronRightRounded'
import StorefrontIcon from '@mui/icons-material/StorefrontOutlined'
import PlaceIcon from '@mui/icons-material/PlaceOutlined'
import PayrollIcon from '@mui/icons-material/PaidOutlined'
import PdfIcon from '@mui/icons-material/PictureAsPdfOutlined'
import QrIcon from '@mui/icons-material/QrCode2Rounded'
import AccountIcon from '@mui/icons-material/PersonOutlineRounded'
import MailIcon from '@mui/icons-material/MailOutlineRounded'
import { useNavigate } from 'react-router'

import { useAuth } from '@/providers/auth-provider'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import { SectionCard } from '@/components/ui/section-card'

interface SettingsRow {
  to: string
  icon: React.ElementType
  title: string
  subtitle: string
  /** Hidden from STAFF — the API rejects them on these anyway (garage-level
   *  config, or the requireOwner-gated attendance QR). */
  ownerOnly?: boolean
}

const ROWS: SettingsRow[] = [
  { to: '/settings/garage', icon: StorefrontIcon, title: 'Garage details', subtitle: 'Name, phone, address, logo' },
  { to: '/settings/location', icon: PlaceIcon, title: 'Workshop location', subtitle: 'GPS check-in geofence' },
  { to: '/settings/payroll', icon: PayrollIcon, title: 'Attendance & payroll', subtitle: 'Weekly offs, salary calculation' },
  { to: '/settings/pdf', icon: PdfIcon, title: 'Invoice & estimate PDFs', subtitle: 'Logo, terms, document numbering' },
  { to: '/settings/qr', icon: QrIcon, title: 'QR code', subtitle: 'Attendance check-in code', ownerOnly: true },
  { to: '/settings/account', icon: AccountIcon, title: 'Account', subtitle: 'Your profile, sign out' },
]

export default function SettingsHubPage(): React.JSX.Element {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { tenant, role } = useTenant()
  const rows = ROWS.filter((r) => !r.ownerOnly || role === 'OWNER')

  return (
    <PageShell title="Settings">
      <Box sx={{ px: { xs: 2, md: 3.5 }, pb: 4, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <SectionCard id="settings-identity-card" padded>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar
              src={user?.avatar_url ?? undefined}
              imgProps={{ referrerPolicy: 'no-referrer' }}
              variant="rounded"
              sx={{ width: 52, height: 52, borderRadius: 2, fontSize: 18, fontWeight: 600 }}
            >
              {user?.name?.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography noWrap sx={{ fontSize: 15.5, fontWeight: 700 }}>
                {tenant?.name ?? user?.name ?? 'Signed in'}
              </Typography>
              <Stack direction="row" alignItems="center" spacing={0.75} sx={{ mt: 0.25 }}>
                <MailIcon sx={{ fontSize: 13, color: 'text.disabled' }} />
                <Typography noWrap sx={{ fontSize: 12, color: 'text.disabled' }}>
                  {user?.email ?? ''}
                  {role && ` · ${role === 'OWNER' ? 'Owner' : 'Staff'}`}
                </Typography>
              </Stack>
            </Box>
          </Stack>
        </SectionCard>

        <SectionCard id="settings-menu" padded={false}>
          <List disablePadding>
            {rows.map(({ to, icon: Icon, title, subtitle }, i) => (
              <ListItemButton
                key={to}
                id={`settings-row-${to.split('/').pop()}`}
                onClick={() => void navigate(to)}
                sx={{
                  py: 1.5,
                  px: 2.25,
                  borderTop: i === 0 ? 0 : 1,
                  borderColor: 'divider',
                }}
              >
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <Box
                    sx={(t) => ({
                      width: 34,
                      height: 34,
                      borderRadius: 1.5,
                      display: 'grid',
                      placeItems: 'center',
                      bgcolor: alpha(t.palette.primary.main, 0.1),
                      color: 'primary.main',
                    })}
                  >
                    <Icon sx={{ fontSize: 18 }} />
                  </Box>
                </ListItemIcon>
                <ListItemText
                  primary={title}
                  secondary={subtitle}
                  primaryTypographyProps={{ fontSize: 13.5, fontWeight: 600 }}
                  secondaryTypographyProps={{ fontSize: 11.5 }}
                />
                <ChevronRightIcon sx={{ fontSize: 18, color: 'text.disabled', flexShrink: 0 }} />
              </ListItemButton>
            ))}
          </List>
        </SectionCard>
      </Box>
    </PageShell>
  )
}
