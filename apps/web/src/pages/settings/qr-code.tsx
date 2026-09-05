// Settings → QR code — the one code staff scan to check in, moved here from
// the Attendance page: it's a setup task done once (then rarely touched),
// not something that belongs mixed in with today's attendance log.
//
// The token is static until regenerated — same code every day — which is
// exactly why it's printable: download it once as an A4 PDF, stick it up at
// the entrance, and staff scan the wall rather than a phone screen.
import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  Skeleton, Stack, Typography,
} from '@mui/material'
import DownloadIcon from '@mui/icons-material/DownloadRounded'
import RefreshIcon from '@mui/icons-material/RefreshRounded'
import QrIcon from '@mui/icons-material/QrCode2Rounded'

import { apiFetch } from '@/lib/api'
import { useTenant } from '@/providers/tenant-provider'
import { downloadAttendanceQrPdf } from '@/lib/qr-pdf'
import { PageShell } from '@/components/layout/page-shell'
import { SectionCard } from '@/components/ui/section-card'
import { QRDisplay } from '@/components/domain/qr-display'
import { useToast, ToastContainer } from '@/components/ui/toast'

interface QRData {
  qr_token: string
}

export default function SettingsQrCodePage(): React.JSX.Element {
  const { tenant } = useTenant()
  const queryClient = useQueryClient()
  const { toasts, showToast, dismissToast } = useToast()
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  const { data: qr, isLoading } = useQuery<QRData>({
    queryKey: ['attendance', 'qr', tenant?.id],
    queryFn: () => apiFetch<QRData>('/attendance/qr', { tenantId: tenant?.id }),
    enabled: Boolean(tenant?.id),
  })

  const regenerate = useMutation({
    mutationFn: () => apiFetch('/attendance/qr/regenerate', { method: 'POST', tenantId: tenant?.id }),
    onSuccess: () => {
      setConfirmOpen(false)
      showToast('success', 'QR code regenerated — reprint and replace any copy on the wall')
      queryClient.invalidateQueries({ queryKey: ['attendance', 'qr'] })
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to regenerate QR'),
  })

  const downloadPdf = async (): Promise<void> => {
    if (!tenant || !qr?.qr_token) return
    setIsDownloading(true)
    try {
      await downloadAttendanceQrPdf(tenant.name, qr.qr_token)
    } catch (err: unknown) {
      showToast('error', err instanceof Error ? err.message : 'Could not generate the PDF')
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <PageShell title="QR code" mobileTitle="QR code" showBack hideNav>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <Box sx={{ px: { xs: 2, md: 3.5 }, pb: 4, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <SectionCard id="qr-code-card" padded>
          <Stack alignItems="center" spacing={2} textAlign="center">
            {isLoading ? (
              <Skeleton variant="rounded" width={208} height={208} />
            ) : qr?.qr_token ? (
              <QRDisplay id="settings-qr" token={qr.qr_token} size={208} />
            ) : (
              <Box
                sx={{
                  width: 208, height: 208, display: 'grid', placeItems: 'center',
                  bgcolor: 'action.hover', borderRadius: 2, color: 'text.disabled',
                }}
              >
                <QrIcon sx={{ fontSize: 48 }} />
              </Box>
            )}

            <Typography sx={{ fontSize: 12.5, color: 'text.secondary', lineHeight: 1.6, maxWidth: 320 }}>
              Staff scan this from inside the Autro app to check in and out. It's the same code
              every day until you regenerate it — download it once, print it, and stick it up at
              the entrance.
            </Typography>
          </Stack>
        </SectionCard>

        <Stack spacing={1.5}>
          <Button
            id="qr-download-pdf"
            variant="contained"
            startIcon={<DownloadIcon />}
            disabled={isDownloading || !qr?.qr_token}
            onClick={() => void downloadPdf()}
            sx={{ height: 46 }}
          >
            {isDownloading ? 'Preparing PDF…' : 'Download as PDF (A4)'}
          </Button>
          <Button
            id="qr-regenerate-btn"
            variant="outlined"
            startIcon={<RefreshIcon />}
            disabled={!qr?.qr_token}
            onClick={() => setConfirmOpen(true)}
            sx={{ height: 46 }}
          >
            Regenerate
          </Button>
        </Stack>
      </Box>

      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontSize: 16, fontWeight: 700 }}>Regenerate the QR code?</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ borderRadius: 2, fontSize: 12.5 }}>
            Any copy already printed and stuck on the wall will stop working immediately. You'll
            need to download and print the new one.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setConfirmOpen(false)}>Cancel</Button>
          <Button
            id="qr-regenerate-confirm"
            variant="contained"
            color="warning"
            disabled={regenerate.isPending}
            onClick={() => regenerate.mutate()}
          >
            {regenerate.isPending ? 'Regenerating…' : 'Regenerate'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageShell>
  )
}
