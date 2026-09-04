// Settings → Attendance & payroll — the weekly-off pattern and how a
// present/absent count turns into a payout.
//
// Existed only as an implicit assumption before this page: attendance and
// staff routes treated every calendar day as a working day, so a mechanic
// present every day the garage was actually open still showed under 100% in
// a garage closed on Sundays. This is the owner's own configuration now, not
// a rule baked into the code — different workshops run different weeks and
// different payroll conventions, and the app should not decide that for them.
import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Box, Button, Chip, Stack, TextField, Typography } from '@mui/material'
import { alpha } from '@mui/material/styles'
import { WEEKDAY_LABEL, type SalaryBasis } from '@autro/shared'

import { apiFetch } from '@/lib/api'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import { SectionCard } from '@/components/ui/section-card'
import { SegmentedControl } from '@/components/ui/segmented-control'
import { useToast, ToastContainer } from '@/components/ui/toast'
import { FullPageSpinner } from '@/components/ui/loading'

const WEEKDAYS = [0, 1, 2, 3, 4, 5, 6]
const SHORT_LABEL: Record<number, string> = { 0: 'Su', 1: 'Mo', 2: 'Tu', 3: 'We', 4: 'Th', 5: 'Fr', 6: 'Sa' }

const BASIS_OPTIONS: { value: SalaryBasis; label: string }[] = [
  { value: 'ACTUAL_WORKING_DAYS', label: 'Working days' },
  { value: 'CALENDAR_DAYS', label: 'Calendar days' },
  { value: 'FIXED_DIVISOR', label: 'Fixed divisor' },
]

const BASIS_EXPLANATION: Record<SalaryBasis, string> = {
  ACTUAL_WORKING_DAYS:
    'Pay is present days ÷ the days this month that fall on your working weekdays (set below). A full month at the garage always reads as 100%, whatever the month.',
  CALENDAR_DAYS:
    'Pay is present days ÷ every day in the month, including weekly offs. A month with more Sundays lowers the same attendance record.',
  FIXED_DIVISOR:
    'Pay is present days ÷ a number you fix (commonly 26 or 30), the same every month regardless of how many days it actually has.',
}

export default function SettingsPayrollPage(): React.JSX.Element {
  const { tenant, refetch } = useTenant()
  const { toasts, showToast, dismissToast } = useToast()

  const [workDays, setWorkDays] = useState<number[]>(tenant?.work_days ?? [1, 2, 3, 4, 5, 6])
  const [basis, setBasis] = useState<SalaryBasis>(tenant?.salary_basis ?? 'ACTUAL_WORKING_DAYS')
  const [fixedDivisor, setFixedDivisor] = useState(String(tenant?.salary_fixed_divisor ?? 30))

  const mutation = useMutation({
    mutationFn: (data: Record<string, unknown>) =>
      apiFetch(`/tenants/${tenant?.id}`, { method: 'PATCH', body: JSON.stringify(data), tenantId: tenant?.id }),
    onSuccess: () => {
      showToast('success', 'Payroll settings saved')
      refetch()
    },
    onError: (err: Error) => showToast('error', err.message || 'Failed to save'),
  })

  const toggleDay = (day: number): void => {
    setWorkDays((prev) => {
      const next = prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
      // At least one working day — an all-off week can't compute a rate.
      return next.length > 0 ? next : prev
    })
  }

  const save = (): void => {
    const divisor = Number(fixedDivisor)
    mutation.mutate({
      work_days: workDays,
      salary_basis: basis,
      salary_fixed_divisor:
        basis === 'FIXED_DIVISOR' && Number.isFinite(divisor) && divisor > 0 ? Math.round(divisor) : null,
    })
  }

  if (!tenant) return <FullPageSpinner />

  return (
    <PageShell title="Attendance & payroll" mobileTitle="Payroll" showBack hideNav>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />

      <Box sx={{ px: { xs: 2, md: 3.5 }, pb: 4, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <SectionCard id="settings-workdays-card" title="Working days" padded>
          <Typography sx={{ fontSize: 12, color: 'text.secondary', mb: 1.5 }}>
            Days the workshop is open. Staff aren't expected to check in on the rest, and these are
            the days counted as "working days" for the calculation below.
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {WEEKDAYS.map((day) => {
              const active = workDays.includes(day)
              return (
                <Chip
                  key={day}
                  id={`settings-workday-${day}`}
                  label={SHORT_LABEL[day]}
                  onClick={() => toggleDay(day)}
                  title={WEEKDAY_LABEL[day]}
                  sx={(t) => ({
                    width: 42,
                    fontWeight: 700,
                    bgcolor: active ? t.palette.primary.main : alpha(t.palette.text.primary, 0.06),
                    color: active ? t.palette.primary.contrastText : 'text.secondary',
                    '&:hover': { bgcolor: active ? t.palette.primary.dark : alpha(t.palette.text.primary, 0.1) },
                  })}
                />
              )
            })}
          </Stack>
        </SectionCard>

        <SectionCard id="settings-salary-basis-card" title="Salary calculation" padded>
          <Stack spacing={2}>
            <SegmentedControl
              id="settings-salary-basis"
              aria-label="Salary calculation basis"
              options={BASIS_OPTIONS}
              value={basis}
              onChange={setBasis}
            />
            <Typography sx={{ fontSize: 12, color: 'text.secondary', lineHeight: 1.7 }}>
              {BASIS_EXPLANATION[basis]}
            </Typography>

            {basis === 'FIXED_DIVISOR' && (
              <TextField
                id="settings-fixed-divisor"
                label="Divide by"
                type="number"
                size="small"
                value={fixedDivisor}
                onChange={(e) => setFixedDivisor(e.target.value)}
                inputProps={{ min: 1, max: 31 }}
                sx={{ maxWidth: 160 }}
              />
            )}
          </Stack>
        </SectionCard>

        <Button
          id="settings-payroll-save-btn"
          variant="contained"
          disabled={mutation.isPending}
          onClick={save}
          sx={{ alignSelf: 'flex-start', minWidth: 150 }}
        >
          {mutation.isPending ? 'Saving…' : 'Save changes'}
        </Button>
      </Box>
    </PageShell>
  )
}
