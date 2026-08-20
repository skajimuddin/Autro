// Topbar — sticky page header, in two forms.
//
//   < md : an app bar. Brand tile + page title + garage name + action, with a
//          hairline rule. On a phone the sidebar is hidden, so without this the
//          app carries no brand mark and no garage name anywhere on screen.
//   >= md: the page header. Large title + subtitle + action, no rule — the
//          page ground carries the separation.
//
// Added 2026-08-20 after the mobile app bar was found missing from the
// dashboard: mobile had been routed through the desktop header, which renders
// a greeting and no branding.
import type React from 'react'
import { useNavigate } from 'react-router'
import { Box, Avatar, Typography, IconButton } from '@mui/material'
import BuildIcon from '@mui/icons-material/BuildOutlined'
import ArrowBackIcon from '@mui/icons-material/ArrowBackRounded'

import { useTenant } from '@/providers/tenant-provider'

interface TopbarProps {
  title: string
  /** Shorter title for the mobile app bar — the desktop header often carries a
   *  greeting ("Good afternoon, Ravi") where the app bar wants the page name. */
  mobileTitle?: string
  /** Match the content column width so the title lines up with the page. */
  wide?: boolean
  /** Secondary line under the title, desktop only. Accepts a node so a page can
   *  style it — the dashboard uses an uppercase, letter-spaced line, while
   *  detail screens want plain sentence case for a vehicle model. */
  subtitle?: React.ReactNode
  /** If true, shows a back arrow that navigates -1 */
  showBack?: boolean
  /** Optional right-side action element */
  rightAction?: React.ReactNode
  /** Right-side action for the mobile app bar, when it differs from desktop.
   *  Pass `null` for a bar with no action at all — a list page whose add
   *  button already sits in the mobile tab bar does not want a second one
   *  crowding a 62px bar. Only `undefined` falls back to `rightAction`. */
  mobileAction?: React.ReactNode
  /** Second line of the mobile app bar. Defaults to the garage name, which is
   *  what a top-level screen wants; a sub-screen passes the thing it is about
   *  (a vehicle's model), because by then you know which garage you are in. */
  mobileSubtitle?: string
}

export function Topbar({
  title,
  mobileTitle,
  subtitle,
  wide = false,
  showBack = false,
  rightAction,
  mobileAction,
  mobileSubtitle,
}: TopbarProps): React.JSX.Element {
  const navigate = useNavigate()
  const { tenant } = useTenant()

  // `??` would treat an explicit null as "not given" and fall back.
  const resolvedMobileAction = mobileAction === undefined ? rightAction : mobileAction

  return (
    <>
      {/* ── mobile app bar ───────────────────────────────────────────── */}
      <Box
        id="topbar-mobile"
        component="header"
        sx={{
          display: { xs: 'flex', md: 'none' },
          position: 'sticky',
          top: 0,
          zIndex: 30,
          alignItems: 'center',
          gap: 1.25,
          px: 2,
          minHeight: 62,
          bgcolor: 'background.default',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        {showBack ? (
          <IconButton
            id="topbar-back-btn"
            onClick={() => navigate(-1)}
            aria-label="Go back"
            size="small"
            sx={{ ml: -0.75, color: 'text.primary' }}
          >
            <ArrowBackIcon sx={{ fontSize: 21 }} />
          </IconButton>
        ) : (
          <Avatar
            variant="rounded"
            sx={{
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              width: 30,
              height: 30,
              borderRadius: 1.25,
              flexShrink: 0,
            }}
          >
            <BuildIcon sx={{ fontSize: 16 }} />
          </Avatar>
        )}

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography noWrap sx={{ fontSize: 14.5, fontWeight: 700, lineHeight: 1.2 }}>
            {mobileTitle ?? title}
          </Typography>
          {(mobileSubtitle ?? tenant?.name) && (
            <Typography noWrap sx={{ fontSize: 11.5, color: 'text.disabled', lineHeight: 1.3 }}>
              {mobileSubtitle ?? tenant?.name}
            </Typography>
          )}
        </Box>

        {resolvedMobileAction && <Box sx={{ flexShrink: 0 }}>{resolvedMobileAction}</Box>}
      </Box>

      {/* ── md:+ page header ─────────────────────────────────────────── */}
      <Box
        id="topbar"
        component="header"
        sx={{
          display: { xs: 'none', md: 'block' },
          position: 'sticky',
          top: 0,
          zIndex: 30,
          bgcolor: 'background.default',
        }}
      >
        {/* The bar spans the full width, but its CONTENT sits in the same
            max-width column as the page body — otherwise the title drifts left
            of the content on wide screens, where the body is centred. */}
        <Box
          sx={{
            mx: 'auto',
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            px: 3.5,
            py: 2.5,
            maxWidth: wide ? { md: 768, lg: 1152 } : 768,
          }}
        >
          {showBack && (
            <IconButton
              onClick={() => navigate(-1)}
              aria-label="Go back"
              sx={{
                flexShrink: 0,
                border: 1,
                borderColor: 'divider',
                borderRadius: 1.5,
                color: 'text.primary',
              }}
            >
              <ArrowBackIcon sx={{ fontSize: 19 }} />
            </IconButton>
          )}

          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              noWrap
              component="h1"
              sx={{
                fontWeight: 700,
                letterSpacing: '-.022em',
                lineHeight: 1.2,
                fontSize: showBack ? 20 : 27,
              }}
            >
              {title}
            </Typography>
            {subtitle &&
              (typeof subtitle === 'string' ? (
                <Typography noWrap sx={{ fontSize: 12.5, color: 'text.secondary', mt: 0.25 }}>
                  {subtitle}
                </Typography>
              ) : (
                <Box sx={{ mt: 0.5, minWidth: 0 }}>{subtitle}</Box>
              ))}
          </Box>

          {rightAction && <Box sx={{ flexShrink: 0 }}>{rightAction}</Box>}
        </Box>
      </Box>
    </>
  )
}
