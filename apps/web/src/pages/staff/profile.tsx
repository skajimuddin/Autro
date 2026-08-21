// Staff profile — one member: today, this month, pay, and the two things an
// owner can do about them.
//
// Migrated 2026-08-20 onto the MUI design system.
//
// The estimated salary is derived, and it says so: present days over working
// days times the monthly figure. It is shown only when a salary is actually set
// — a ₹0 estimate for someone with no salary on record would read as a fact
// rather than a blank.
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Avatar, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  Divider, Stack, Typography,
} from '@mui/material'
import { alpha } from '@mui/material/styles'
import CalendarIcon from '@mui/icons-material/CalendarMonthOutlined'
import EditIcon from '@mui/icons-material/EditOutlined'
import DeleteIcon from '@mui/icons-material/DeleteOutlineRounded'
import PersonIcon from '@mui/icons-material/PersonOutline'
import ChevronRightIcon from '@mui/icons-material/ChevronRightRounded'

import { apiFetch } from '@/lib/api'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import { SectionCard } from '@/components/ui/section-card'
import { EmptyPanel } from '@/components/ui/empty-panel'
import { Kicker } from '@/components/ui/kicker'
import { Field } from '@/components/ui/field'
import { useToast, ToastContainer } from '@/components/ui/toast'
import { FullPageSpinner } from '@/components/ui/loading'
import { inr, formatTime } from '@/lib/format'

interface StaffProfile {
  id: string
  user_id: string
  name: string
  email: string
  avatar_url: string | null
  role: 'OWNER' | 'STAFF'
  monthly_salary: number | null
  check_in_at: string | null
  check_out_at: string | null
  present_days: number
  absent_days: number
  total_working_days: number
}

export default function StaffProfilePage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { tenant } = useTenant()
  const queryClient = useQueryClient()
  const { toasts, showToast, dismissToast } = useToast()

  const [salaryOpen, setSalaryOpen] = useState(false)
  const [removeOpen, setRemoveOpen] = useState(false)
  const [newSalary, setNewSalary] = useState('')

  const { data: profile, isLoading, isError } = useQuery<StaffProfile>({
    queryKey: ['staff', id],
    queryFn: () => apiFetch<StaffProfile>(`/staff/${id}`, { tenantId: tenant?.id }),
    enabled: Boolean(id && tenant?.id),
  })

  const salaryMutation = useMutation({
    mutationFn: (salary: number) =>
      apiFetch(`/staff/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ monthly_salary: salary }),
        tenantId: tenant?.id,
      }),
    onSuccess: () => {
      showToast('success', 'Salary updated')
      setSalaryOpen(false)
      queryClient.invalidateQueries({ queryKey: ['staff', id] })
      // The staff list prints the same salary.
      queryClient.invalidateQueries({ queryKey: ['staff'] })
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to update salary'),
  })

  const removeMutation = useMutation({
    mutationFn: () => apiFetch(`/staff/${id}`, { method: 'DELETE', tenantId: tenant?.id }),
    onSuccess: () => {
      showToast('success', 'Staff member removed')
      void navigate('/staff')
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to remove staff'),
  })

  if (isLoading) return <FullPageSpinner />

  if (isError || !profile) {
    return (
      <PageShell title="Staff" mobileTitle="Staff" showBack hideNav>
        <Box sx={{ px: { xs: 2, md: 3.5 } }}>
          <EmptyPanel
            icon={<PersonIcon />}
            title="Staff member not found"
            description="They may have been removed from the garage"
            action={{ label: 'Back to staff', onClick: () => void navigate('/staff') }}
          />
        </Box>
      </PageShell>
    )
  }

  const estimatedSalary =
    profile.monthly_salary != null && profile.total_working_days > 0
      ? Math.round((profile.present_days / profile.total_working_days) * profile.monthly_salary)
      : null

  return (
    <PageShell title={profile.name} mobileTitle={profile.name} showBack hideNav>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <Box sx={{ px: { xs: 2, md: 3.5 }, pb: 4, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <SectionCard id="staff-profile-header" padded>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar
              src={profile.avatar_url ?? undefined}
              imgProps={{ referrerPolicy: 'no-referrer' }}
              sx={{ width: 64, height: 64, fontSize: 24, fontWeight: 600 }}
            >
              {profile.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
              <Typography noWrap sx={{ fontSize: 18, fontWeight: 700 }}>{profile.name}</Typography>
              <Typography noWrap sx={{ fontSize: 12.5, color: 'text.disabled' }}>{profile.email}</Typography>
              <Typography sx={{ fontSize: 12, color: 'text.secondary', textTransform: 'capitalize', mt: 0.25 }}>
                {profile.role.toLowerCase()}
              </Typography>
            </Box>
          </Stack>
        </SectionCard>

        <SectionCard id="staff-today-attendance" title="Today" padded>
          <Stack direction="row" spacing={3}>
            <Box sx={{ flex: 1 }}>
              <Kicker>In</Kicker>
              <Typography sx={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: profile.check_in_at ? 'success.main' : 'text.disabled' }}>
                {formatTime(profile.check_in_at)}
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box sx={{ flex: 1 }}>
              <Kicker>Out</Kicker>
              <Typography sx={{ fontSize: 18, fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: profile.check_out_at ? 'text.primary' : 'text.disabled' }}>
                {formatTime(profile.check_out_at)}
              </Typography>
            </Box>
          </Stack>
        </SectionCard>

        <SectionCard title="This month" padded>
          <Stack direction="row" spacing={3}>
            <Box sx={{ flex: 1 }}>
              <Kicker>Present</Kicker>
              <Typography sx={{ fontSize: 26, fontWeight: 700, color: 'success.main', fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>
                {profile.present_days}
              </Typography>
            </Box>
            <Divider orientation="vertical" flexItem />
            <Box sx={{ flex: 1 }}>
              <Kicker>Absent</Kicker>
              <Typography sx={{ fontSize: 26, fontWeight: 700, fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>
                {profile.absent_days}
              </Typography>
            </Box>
          </Stack>
        </SectionCard>

        {profile.monthly_salary != null && (
          <SectionCard id="staff-salary-card" title="Estimated salary" padded>
            <Typography sx={{ fontSize: 30, fontWeight: 700, color: 'primary.main', lineHeight: 1.1, fontVariantNumeric: 'tabular-nums' }}>
              {inr(estimatedSalary ?? 0)}
            </Typography>
            <Typography sx={{ fontSize: 12, color: 'text.disabled', mt: 0.75 }}>
              {profile.present_days} of {profile.total_working_days} working days ×{' '}
              {inr(profile.monthly_salary)} monthly
            </Typography>
          </SectionCard>
        )}

        <Stack spacing={1.5}>
          <Button
            id="staff-edit-salary"
            variant="contained"
            startIcon={<EditIcon />}
            onClick={() => {
              setNewSalary(String(profile.monthly_salary ?? ''))
              setSalaryOpen(true)
            }}
          >
            Edit salary
          </Button>
          <Button
            id="staff-view-attendance"
            variant="outlined"
            startIcon={<CalendarIcon />}
            endIcon={<ChevronRightIcon />}
            onClick={() => void navigate('/staff/attendance')}
          >
            View full attendance
          </Button>
          {profile.role !== 'OWNER' && (
            <Button
              id="staff-remove"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={() => setRemoveOpen(true)}
              sx={{ alignSelf: 'flex-start' }}
            >
              Remove from garage
            </Button>
          )}
        </Stack>
      </Box>

      <Dialog id="salary-modal" open={salaryOpen} onClose={() => setSalaryOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontSize: 16, fontWeight: 700 }}>Edit monthly salary</DialogTitle>
        <DialogContent>
          <Field
            id="salary-input"
            label="Monthly salary (₹)"
            type="number"
            inputMode="numeric"
            autoFocus
            value={newSalary}
            onChange={(e) => setNewSalary(e.target.value)}
            placeholder="15000"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setSalaryOpen(false)}>Cancel</Button>
          <Button
            id="salary-save-btn"
            variant="contained"
            disabled={salaryMutation.isPending || Number.isNaN(Number(newSalary)) || Number(newSalary) < 0}
            onClick={() => salaryMutation.mutate(Number(newSalary))}
          >
            {salaryMutation.isPending ? 'Saving…' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog id="remove-modal" open={removeOpen} onClose={() => setRemoveOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontSize: 16, fontWeight: 700 }}>Remove {profile.name}?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontSize: 13.5, color: 'text.secondary', lineHeight: 1.7 }}>
            They will no longer be able to check in. Their past attendance stays on record.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button id="remove-cancel-btn" onClick={() => setRemoveOpen(false)}>Cancel</Button>
          <Button
            id="remove-confirm-btn"
            variant="contained"
            color="error"
            disabled={removeMutation.isPending}
            onClick={() => removeMutation.mutate()}
            sx={(t) => ({ bgcolor: t.palette.error.main, '&:hover': { bgcolor: alpha(t.palette.error.main, 0.85) } })}
          >
            {removeMutation.isPending ? 'Removing…' : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageShell>
  )
}
