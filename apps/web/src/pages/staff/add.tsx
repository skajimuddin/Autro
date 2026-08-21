// Add staff — generate an invite link and get it to the person.
//
// Migrated 2026-08-20 onto the MUI design system. Two states in one card: the
// form, then the generated link. They do not coexist — once a link exists, the
// form has done its job and showing both would invite generating a second one
// by accident.
//
// Sharing is what this screen is for. The link is generated on the owner's
// phone and has to reach a mechanic on WhatsApp, so native share is tried
// first and wa.me is the fallback.
import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import { Box, Button, Stack, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import LinkIcon from '@mui/icons-material/LinkRounded'
import CopyIcon from '@mui/icons-material/ContentCopyRounded'
import CheckIcon from '@mui/icons-material/CheckRounded'
import ShareIcon from '@mui/icons-material/IosShareRounded'

import { apiFetch } from '@/lib/api'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import { SectionCard } from '@/components/ui/section-card'
import { Field } from '@/components/ui/field'
import { useToast, ToastContainer } from '@/components/ui/toast'

const inviteSchema = z.object({
  name: z.string().trim().min(1, 'Staff name is required').max(100, 'Name is too long'),
  monthly_salary: z.string().optional(),
})

type InviteForm = z.infer<typeof inviteSchema>

interface InviteResponse {
  /** Site-relative path, e.g. "/invite/<token>" */
  invite_url: string
}

export default function StaffAddPage(): React.JSX.Element {
  const { tenant } = useTenant()
  const { toasts, showToast, dismissToast } = useToast()
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const { control, handleSubmit } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { name: '', monthly_salary: '' },
  })

  const mutation = useMutation({
    mutationFn: (data: InviteForm) =>
      apiFetch<InviteResponse>('/staff/invite', {
        method: 'POST',
        body: JSON.stringify({
          name: data.name,
          monthly_salary: data.monthly_salary ? Number(data.monthly_salary) : null,
        }),
        tenantId: tenant?.id,
      }),
    onSuccess: (res) => {
      // The API returns a site-relative path. Copy and share need an absolute
      // URL — a bare "/invite/abc" pasted into WhatsApp opens nothing.
      setInviteUrl(new URL(res.invite_url, window.location.origin).toString())
      showToast('success', 'Invite link generated')
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to generate invite'),
  })

  const copy = async (): Promise<void> => {
    if (!inviteUrl) return
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      showToast('success', 'Link copied')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      showToast('error', 'Could not copy the link')
    }
  }

  const share = async (): Promise<void> => {
    if (!inviteUrl) return
    const text = `Join ${tenant?.name ?? 'our workshop'} as staff:`

    if (navigator.share) {
      try {
        await navigator.share({ title: 'Join as staff', text, url: inviteUrl })
        return
      } catch (err) {
        // A cancelled share is not a failure — do not fall through to WhatsApp.
        if ((err as Error).name === 'AbortError') return
      }
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(`${text} ${inviteUrl}`)}`, '_blank', 'noopener')
  }

  return (
    <PageShell title="Add staff" mobileTitle="Add staff" showBack hideNav>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <Box sx={{ px: { xs: 2, md: 3.5 }, pb: 4 }}>
        {!inviteUrl ? (
          <SectionCard id="staff-invite-form-card" title="Invite a staff member" padded>
            <Box component="form" onSubmit={handleSubmit((d) => mutation.mutate(d))}>
              <Stack spacing={2.5}>
                <Controller
                  name="name"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field
                      {...field}
                      id="staff-name"
                      label="Staff name"
                      required
                      placeholder="Suresh Patil"
                      error={fieldState.error?.message}
                    />
                  )}
                />

                <Controller
                  name="monthly_salary"
                  control={control}
                  render={({ field, fieldState }) => (
                    <Field
                      {...field}
                      id="staff-salary"
                      label="Monthly salary"
                      helper="Optional — used for salary calculation"
                      type="number"
                      inputMode="numeric"
                      placeholder="15000"
                      error={fieldState.error?.message}
                    />
                  )}
                />

                <Button
                  id="staff-generate-invite"
                  type="submit"
                  variant="contained"
                  startIcon={<LinkIcon />}
                  disabled={mutation.isPending}
                  sx={{ alignSelf: 'flex-start', minWidth: 190 }}
                >
                  {mutation.isPending ? 'Generating…' : 'Generate invite link'}
                </Button>
              </Stack>
            </Box>
          </SectionCard>
        ) : (
          <SectionCard id="staff-invite-result-card" padded>
            <Stack spacing={2.5}>
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Box
                  sx={{
                    width: 44, height: 44, borderRadius: '50%', display: 'grid', placeItems: 'center',
                    bgcolor: (t) => alpha(t.palette.success.main, 0.14), color: 'success.main', flexShrink: 0,
                  }}
                >
                  <LinkIcon />
                </Box>
                <Box>
                  <Typography sx={{ fontSize: 15.5, fontWeight: 700 }}>Invite link ready</Typography>
                  <Typography sx={{ fontSize: 12.5, color: 'text.disabled', mt: 0.25 }}>
                    Send this to your staff member — it signs them in and joins them to the garage
                  </Typography>
                </Box>
              </Stack>

              <Box
                sx={{
                  bgcolor: 'action.hover', borderRadius: 1.5, p: 1.5,
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  fontSize: 12, color: 'text.secondary', wordBreak: 'break-all', lineHeight: 1.7,
                }}
              >
                {inviteUrl}
              </Box>

              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                <Button
                  id="staff-share-whatsapp"
                  variant="contained"
                  startIcon={<ShareIcon />}
                  onClick={() => void share()}
                  sx={{ flex: 1 }}
                >
                  Share
                </Button>
                <Button
                  id="staff-copy-link"
                  variant="outlined"
                  startIcon={copied ? <CheckIcon /> : <CopyIcon />}
                  onClick={() => void copy()}
                  sx={{ flex: 1 }}
                >
                  {copied ? 'Copied' : 'Copy link'}
                </Button>
              </Stack>
            </Stack>
          </SectionCard>
        )}
      </Box>
    </PageShell>
  )
}
