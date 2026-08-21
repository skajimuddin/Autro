// InstallBanner — one-line prompt, directly under the header, to add Autro
// to the home screen. Rendered once from PageShell, so every page carries it.
//
// Two install paths exist and neither is optional to support:
//   - Chromium (Android, desktop Chrome/Edge, Samsung Internet) fires
//     `beforeinstallprompt`. We capture and hold it, then drive the native
//     install sheet from our own button.
//   - iOS Safari never fires that event — Apple has no programmatic install
//     API. "Add to Home Screen" only exists in the Share sheet, so there the
//     same button opens a small popover with the two steps instead of doing
//     nothing.
// Everywhere else (Firefox, already-installed, no signal either way) this
// renders nothing rather than guess.
//
// A dismissal is remembered per browser (localStorage) so it never asks twice.
import { useEffect, useState } from 'react'
import type React from 'react'
import { Box, Typography, Button, IconButton, Popover, Fade } from '@mui/material'
import CloseIcon from '@mui/icons-material/CloseRounded'
import IosShareIcon from '@mui/icons-material/IosShareRounded'
import AddToHomeScreenIcon from '@mui/icons-material/AddToHomeScreenRounded'

const DISMISSED_KEY = 'autro-install-dismissed'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function isStandalone(): boolean {
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    // iOS's own non-standard flag — display-mode: standalone isn't reliable there.
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  )
}

function isIos(): boolean {
  const ua = window.navigator.userAgent
  // iPadOS 13+ reports as "Macintosh"; a touch-capable Mac is the tell.
  return /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

export function InstallBanner(): React.JSX.Element | null {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null)
  const [ios, setIos] = useState(false)
  const [visible, setVisible] = useState(false)
  const [anchor, setAnchor] = useState<HTMLElement | null>(null)

  useEffect(() => {
    if (isStandalone() || localStorage.getItem(DISMISSED_KEY) === '1') return

    if (isIos()) {
      setIos(true)
      setVisible(true)
      return
    }

    const onBeforeInstall = (event: Event) => {
      event.preventDefault()
      setDeferred(event as BeforeInstallPromptEvent)
      setVisible(true)
    }
    const onInstalled = () => {
      localStorage.setItem(DISMISSED_KEY, '1')
      setVisible(false)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)
    window.addEventListener('appinstalled', onInstalled)
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const dismiss = (): void => {
    localStorage.setItem(DISMISSED_KEY, '1')
    setVisible(false)
    setAnchor(null)
  }

  const handleInstallClick = async (event: React.MouseEvent<HTMLElement>): Promise<void> => {
    if (ios) {
      setAnchor(event.currentTarget)
      return
    }
    if (!deferred) return
    await deferred.prompt()
    const { outcome } = await deferred.userChoice
    if (outcome === 'accepted') localStorage.setItem(DISMISSED_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <Fade in>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          px: 2,
          py: 0.875,
          bgcolor: 'action.hover',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <AddToHomeScreenIcon sx={{ fontSize: 17, color: 'text.secondary', flexShrink: 0 }} />

        <Typography noWrap sx={{ flex: 1, fontSize: 13, color: 'text.secondary' }}>
          Install Autro for a faster, full-screen experience
        </Typography>

        <Button
          size="small"
          variant="text"
          onClick={handleInstallClick}
          sx={{ fontSize: 13, fontWeight: 700, flexShrink: 0, minWidth: 0, px: 1 }}
        >
          Install
        </Button>

        <IconButton
          size="small"
          onClick={dismiss}
          aria-label="Dismiss install prompt"
          sx={{ flexShrink: 0, color: 'text.disabled' }}
        >
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>

        <Popover
          open={Boolean(anchor)}
          anchorEl={anchor}
          onClose={() => setAnchor(null)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        >
          <Box sx={{ px: 2, py: 1.5, maxWidth: 240 }}>
            <Typography sx={{ fontSize: 13, lineHeight: 1.6 }}>
              Tap <IosShareIcon sx={{ fontSize: 15, verticalAlign: 'middle', mx: 0.25 }} /> in the
              toolbar, then <strong>Add to Home Screen</strong>.
            </Typography>
          </Box>
        </Popover>
      </Box>
    </Fade>
  )
}
