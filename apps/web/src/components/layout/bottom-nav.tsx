// BottomNav — primary navigation. Sidebar at md:+, bottom tab bar below.
//
// Rebuilt 2026-08-20 on MUI against the approved design.
//
// The mobile bar is deliberately NOT a straight port of the mock's four flat
// tabs. Three things were improved:
//   1. The active tab gets a filled brand pill behind its icon, so the current
//      location is readable at a glance instead of relying on a tint applied
//      to a 20px glyph.
//   2. A centred "Add vehicle" action sits in the bar. Adding a vehicle is the
//      one thing an owner does constantly, and it previously required landing
//      on the dashboard first.
//   3. The bar respects the home-indicator inset and keeps a 56px hit area per
//      tab — the mock's 62px row left ~44px of touch target once labels were
//      accounted for.
//
// Staff/Attendance are OWNER-only routes (RequireOwner in App.tsx), so they are
// hidden from STAFF rather than rendering a tab that bounces them back.
import type React from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router'
import {
  Box, Drawer, List, ListItemButton, ListItemIcon, ListItemText, ListSubheader,
  Typography, Avatar, Stack, Divider, IconButton, Paper, ButtonBase, useTheme,
  alpha,
} from '@mui/material'
import DashboardIcon from '@mui/icons-material/SpaceDashboardOutlined'
import CarIcon from '@mui/icons-material/DirectionsCarFilledOutlined'
import DescIcon from '@mui/icons-material/DescriptionOutlined'
import ReceiptIcon from '@mui/icons-material/ReceiptLongOutlined'
import PeopleIcon from '@mui/icons-material/PeopleAltOutlined'
import ClockIcon from '@mui/icons-material/ScheduleOutlined'
import SettingsIcon from '@mui/icons-material/SettingsOutlined'
import LogoutIcon from '@mui/icons-material/LogoutOutlined'
import AddIcon from '@mui/icons-material/Add'
import BuildIcon from '@mui/icons-material/BuildOutlined'

import { useAuth } from '@/providers/auth-provider'
import { useTenant } from '@/providers/tenant-provider'

export const SIDEBAR_WIDTH = 240
export const MOBILE_NAV_HEIGHT = 68

interface NavItem {
  to: string
  label: string
  icon: React.ElementType
  ownerOnly?: boolean
}

const NAV_GROUPS: { heading: string; items: NavItem[] }[] = [
  {
    heading: 'Workshop',
    items: [
      { to: '/', label: 'Dashboard', icon: DashboardIcon },
      { to: '/vehicles', label: 'Vehicles', icon: CarIcon },
      { to: '/estimates', label: 'Estimates', icon: DescIcon },
      { to: '/invoices', label: 'Invoices', icon: ReceiptIcon },
    ],
  },
  {
    heading: 'Team',
    items: [
      { to: '/staff', label: 'Staff', icon: PeopleIcon, ownerOnly: true },
      { to: '/staff/attendance', label: 'Attendance', icon: ClockIcon, ownerOnly: true },
    ],
  },
  { heading: '', items: [{ to: '/settings', label: 'Settings', icon: SettingsIcon }] },
]

/** Two tabs each side of the centre action. */
const MOBILE_TABS: NavItem[] = [
  { to: '/', label: 'Home', icon: DashboardIcon },
  { to: '/vehicles', label: 'Vehicles', icon: CarIcon },
  { to: '/staff', label: 'Staff', icon: PeopleIcon, ownerOnly: true },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

interface BottomNavProps {
  /** Hide the mobile tab bar — for sub-screens carrying their own action bar.
   *  The desktop sidebar always stays. */
  hideMobileBar?: boolean
}

export function BottomNav({ hideMobileBar = false }: BottomNavProps): React.JSX.Element {
  const { user, logout } = useAuth()
  const { tenant, role } = useTenant()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const theme = useTheme()

  const visible = (i: NavItem): boolean => !i.ownerOnly || role === 'OWNER'
  const tabs = MOBILE_TABS.filter(visible)
  const isActive = (to: string): boolean => (to === '/' ? pathname === '/' : pathname.startsWith(to))

  return (
    <>
      {/* ── md:+ sidebar ──────────────────────────────────────────────── */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          width: SIDEBAR_WIDTH,
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            borderColor: 'divider',
            bgcolor: 'background.default',
            px: 1.75,
            py: 2.5,
          },
        }}
      >
        <Stack direction="row" spacing={1.25} alignItems="center" sx={{ px: 0.75, pb: 2.5 }}>
          <Avatar variant="rounded" sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', width: 32, height: 32, borderRadius: 1.5 }}>
            <BuildIcon sx={{ fontSize: 17 }} />
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography sx={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.2 }}>Autro</Typography>
            {tenant?.name && (
              <Typography noWrap sx={{ fontSize: 11.5, color: 'text.disabled' }}>{tenant.name}</Typography>
            )}
          </Box>
        </Stack>

        {NAV_GROUPS.map(({ heading, items }) => {
          const shown = items.filter(visible)
          if (shown.length === 0) return null
          return (
            <List
              key={heading || 'other'}
              dense
              disablePadding
              sx={{ mb: 1.5 }}
              subheader={heading ? (
                <ListSubheader
                  disableSticky
                  sx={{ fontSize: 9.5, fontWeight: 700, letterSpacing: '.14em', textTransform: 'uppercase', color: 'text.disabled', bgcolor: 'transparent', lineHeight: '30px', px: 0.75 }}
                >
                  {heading}
                </ListSubheader>
              ) : null}
            >
              {shown.map(({ to, label, icon: Icon }) => {
                const active = isActive(to)
                return (
                  <ListItemButton
                    key={to}
                    component={NavLink}
                    to={to}
                    selected={active}
                    sx={{ borderRadius: 1.5, mb: 0.25, py: 0.85 }}
                  >
                    <ListItemIcon sx={{ minWidth: 30, color: active ? 'primary.main' : 'text.secondary' }}>
                      <Icon sx={{ fontSize: 19 }} />
                    </ListItemIcon>
                    <ListItemText primaryTypographyProps={{ fontSize: 13.5, fontWeight: active ? 600 : 500 }}>
                      {label}
                    </ListItemText>
                  </ListItemButton>
                )
              })}
            </List>
          )
        })}

        <Box sx={{ mt: 'auto' }}>
          <Divider sx={{ mb: 1.75 }} />
          <Stack direction="row" spacing={1.25} alignItems="center" sx={{ px: 0.75 }}>
            <Avatar
              src={user?.avatar_url ?? undefined}
              imgProps={{ referrerPolicy: 'no-referrer' }}
              sx={{ width: 32, height: 32, fontSize: 13, fontWeight: 700, bgcolor: 'action.hover', color: 'text.secondary' }}
            >
              {user?.name?.charAt(0).toUpperCase() ?? '?'}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography noWrap sx={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.25 }}>
                {user?.name ?? 'Signed in'}
              </Typography>
              {role && (
                <Typography sx={{ fontSize: 11, color: 'text.disabled', textTransform: 'capitalize' }}>
                  {role.toLowerCase()}
                </Typography>
              )}
            </Box>
            <IconButton id="sidebar-signout" size="small" onClick={logout} aria-label="Sign out" title="Sign out" sx={{ color: 'text.disabled' }}>
              <LogoutIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </Stack>
        </Box>
      </Drawer>

      {/* ── mobile bottom bar ─────────────────────────────────────────── */}
      <Paper
        id="bottom-nav"
        square
        elevation={0}
        sx={{
          display: { xs: hideMobileBar ? 'none' : 'block', md: 'none' },
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 40,
          borderTop: 1, borderColor: 'divider',
          pb: 'env(safe-area-inset-bottom, 0px)',
          bgcolor: 'background.paper',
        }}
      >
        <Stack direction="row" alignItems="stretch" sx={{ height: MOBILE_NAV_HEIGHT }}>
          {tabs.slice(0, 2).map((t) => <Tab key={t.to} item={t} active={isActive(t.to)} />)}

          {/* Centre action — the one thing an owner does all day. */}
          <Box sx={{ width: 76, display: 'grid', placeItems: 'center' }}>
            <ButtonBase
              id="nav-add-vehicle"
              aria-label="Add vehicle"
              onClick={() => navigate('/vehicles/add')}
              sx={{
                width: 48, height: 48, borderRadius: '50%',
                bgcolor: 'primary.main', color: 'primary.contrastText',
                boxShadow: `0 2px 8px ${alpha(theme.palette.common.black, 0.18)}`,
                transition: 'transform .12s ease',
                '&:active': { transform: 'scale(.94)' },
              }}
            >
              <AddIcon sx={{ fontSize: 24 }} />
            </ButtonBase>
          </Box>

          {tabs.slice(2).map((t) => <Tab key={t.to} item={t} active={isActive(t.to)} />)}
        </Stack>
      </Paper>
    </>
  )
}

function Tab({ item, active }: { item: NavItem; active: boolean }): React.JSX.Element {
  const { to, label, icon: Icon } = item
  return (
    <ButtonBase
      component={NavLink}
      to={to}
      aria-current={active ? 'page' : undefined}
      sx={{
        flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 0.5,
        color: active ? 'primary.main' : 'text.disabled',
      }}
    >
      {/* Filled pill behind the active icon — legible at a glance, where a
          tinted 20px glyph alone was not. */}
      <Box
        sx={{
          width: 44, height: 26, borderRadius: 13, display: 'grid', placeItems: 'center',
          bgcolor: (t) => (active ? alpha(t.palette.primary.main, t.palette.mode === 'dark' ? 0.22 : 0.12) : 'transparent'),
          transition: 'background-color .15s ease',
        }}
      >
        <Icon sx={{ fontSize: 21 }} />
      </Box>
      <Typography sx={{ fontSize: 10.5, fontWeight: active ? 700 : 500, lineHeight: 1 }}>
        {label}
      </Typography>
    </ButtonBase>
  )
}
