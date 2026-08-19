// Add Staff — invite form with link generation
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation } from '@tanstack/react-query'
import {
  User,
  IndianRupee,
  Link2,
  Copy,
  Share2,
  Check,
} from '@/components/ui/icons'

import { apiFetch } from '@/lib/api'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import {
  Card,
  Button,
  Input,
  useToast,
  ToastContainer,
} from '@/components/ui'

// ── Form Schema ───────────────────────────────────────────────────────────────

const inviteSchema = z.object({
  name: z.string().min(1, 'Staff name is required').max(100),
  monthly_salary: z.string().optional(),
})

type InviteForm = z.infer<typeof inviteSchema>

interface InviteResponse {
  /** Site-relative path, e.g. "/invite/<token>" */
  invite_url: string
}

// ── Staff Add Page ────────────────────────────────────────────────────────────

export default function StaffAddPage(): React.JSX.Element {
  const { tenant } = useTenant()
  const { toasts, showToast, dismissToast } = useToast()
  const [inviteUrl, setInviteUrl] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InviteForm>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      name: '',
      monthly_salary: '',
    },
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
      // The API returns a site-relative path. Copy/share need an absolute URL —
      // a bare "/invite/abc" pasted into WhatsApp is not something a staff
      // member can open.
      setInviteUrl(new URL(res.invite_url, window.location.origin).toString())
      showToast('success', 'Invite link generated')
    },
    onError: (err: Error) => {
      showToast('error', err.message || 'Failed to generate invite')
    },
  })

  const onSubmit = handleSubmit((data) => {
    mutation.mutate(data)
  })

  const handleCopy = async () => {
    if (!inviteUrl) return
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setCopied(true)
      showToast('success', 'Link copied to clipboard')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      showToast('error', 'Failed to copy')
    }
  }

  const handleShare = async () => {
    if (!inviteUrl) return
    const text = `Join ${tenant?.name ?? 'our autro'} as staff:`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Autro Staff',
          text,
          url: inviteUrl,
        })
        return
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('Native share failed', err)
        } else {
          return // User cancelled
        }
      }
    }

    const whatsappText = `${text} ${inviteUrl}`
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(whatsappText)}`
    window.open(whatsappUrl, '_blank', 'noopener')
  }

  return (
    <PageShell title="Add Staff" showBack hideNav>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <div className="p-4 md:p-6 flex flex-col gap-5">
        {!inviteUrl ? (
          /* ── Invite Form ─────────────────────────────────────── */
          <Card id="staff-invite-form-card">
            <form onSubmit={onSubmit} className="flex flex-col gap-4">
              <Input
                label="Staff Name"
                placeholder="Enter staff member's name"
                leftIcon={<User size={16} />}
                error={errors.name?.message}
                required
                {...register('name')}
              />

              <Input
                label="Monthly Salary"
                placeholder="e.g. 15000"
                type="number"
                leftIcon={<IndianRupee size={16} />}
                error={errors.monthly_salary?.message}
                hint="Optional — used for salary calculation"
                {...register('monthly_salary')}
              />

              <Button
                id="staff-generate-invite"
                type="submit"
                isLoading={mutation.isPending}
                leftIcon={<Link2 size={16} />}
              >
                Generate Invite Link
              </Button>
            </form>
          </Card>
        ) : (
          /* ── Invite Generated ────────────────────────────────── */
          <Card id="staff-invite-result-card">
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-success-light flex items-center justify-center flex-shrink-0">
                  <Link2 size={22} className="text-success" />
                </div>
                <div>
                  <p className="text-base font-bold text-text">
                    Invite Link Ready
                  </p>
                  <p className="text-xs text-text-muted mt-0.5">
                    Share this link with your staff member
                  </p>
                </div>
              </div>

              {/* Link Preview */}
              <div className="bg-bg p-3 border border-border">
                <p className="text-xs text-text-secondary break-all font-mono leading-relaxed">
                  {inviteUrl}
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-3">
                <Button
                  id="staff-copy-link"
                  variant="outline"
                  leftIcon={copied ? <Check size={16} /> : <Copy size={16} />}
                  onClick={handleCopy}
                >
                  {copied ? 'Copied!' : 'Copy Link'}
                </Button>
                <Button
                  id="staff-share-whatsapp"
                  variant="primary"
                  leftIcon={<Share2 size={16} />}
                  onClick={handleShare}
                >
                  Share on WhatsApp
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </PageShell>
  )
}
