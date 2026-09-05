// Customer profile — one customer, every vehicle they've brought in, and
// what they're worth lifetime.
//
// Reached from a vehicle's detail screen (tapping the customer card) — there
// is no standalone customer list yet, because a customer only exists today
// as whoever is attached to a vehicle. Every figure here comes from
// GET /customers/:id, which computes them from paid invoices and visits, not
// a running total that could drift from what the rest of the app shows.
import { useParams, useNavigate } from 'react-router'
import { useQuery } from '@tanstack/react-query'
import { Avatar, Box, Button, Divider, Stack, Typography } from '@mui/material'
import PhoneIcon from '@mui/icons-material/LocalPhoneOutlined'
import PersonIcon from '@mui/icons-material/PersonOutline'
import CarIcon from '@mui/icons-material/DirectionsCarFilledOutlined'
import ChevronRightIcon from '@mui/icons-material/ChevronRightRounded'
import type { VisitStatus } from '@autro/shared'

import { apiFetch } from '@/lib/api'
import { useTenant } from '@/providers/tenant-provider'
import { PageShell } from '@/components/layout/page-shell'
import { SectionCard } from '@/components/ui/section-card'
import { EmptyPanel } from '@/components/ui/empty-panel'
import { StageChip } from '@/components/ui/stage-chip'
import { Kicker } from '@/components/ui/kicker'
import { FullPageSpinner } from '@/components/ui/loading'
import { inr, formatFullDate } from '@/lib/format'

interface CustomerVehicle {
  id: string
  registration_number: string
  name: string | null
  status: VisitStatus | null
}

interface CustomerDetail {
  id: string
  name: string
  phone: string
  customer_since: string
  vehicle_count: number
  visit_count: number
  total_spent: number
  unpaid_count: number
  vehicles: CustomerVehicle[]
}

export default function CustomerDetailsPage(): React.JSX.Element {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { tenant } = useTenant()

  const { data: customer, isLoading, isError } = useQuery<CustomerDetail>({
    queryKey: ['customer', id],
    queryFn: () => apiFetch<CustomerDetail>(`/customers/${id}`, { tenantId: tenant?.id }),
    enabled: Boolean(id && tenant?.id),
  })

  if (isLoading) return <FullPageSpinner />

  if (isError || !customer) {
    return (
      <PageShell title="Customer" showBack hideNav>
        <Box sx={{ px: { xs: 2, md: 3.5 } }}>
          <EmptyPanel
            icon={<PersonIcon />}
            title="Customer not found"
            description="They may have been removed, or the link is out of date"
            action={{ label: 'Back to vehicles', onClick: () => navigate('/vehicles') }}
          />
        </Box>
      </PageShell>
    )
  }

  return (
    <PageShell title={customer.name} mobileTitle={customer.name} showBack hideNav>
      <Box sx={{ px: { xs: 2, md: 3.5 }, pb: 4, display: 'flex', flexDirection: 'column', gap: 2.5 }}>
        <SectionCard id="customer-profile-header" padded>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ width: 56, height: 56, fontSize: 20, fontWeight: 600 }}>
              {customer.name.charAt(0).toUpperCase()}
            </Avatar>
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography noWrap sx={{ fontSize: 17, fontWeight: 700 }}>{customer.name}</Typography>
              <Typography sx={{ fontSize: 13, color: 'text.disabled', fontVariantNumeric: 'tabular-nums', mt: 0.25 }}>
                {customer.phone}
              </Typography>
              <Typography sx={{ fontSize: 11.5, color: 'text.disabled', mt: 0.25 }}>
                Customer since {formatFullDate(customer.customer_since)}
              </Typography>
            </Box>
          </Stack>
          <Button
            id="customer-call-btn"
            variant="outlined"
            fullWidth
            startIcon={<PhoneIcon />}
            href={`tel:${customer.phone}`}
            sx={{ mt: 2, borderColor: 'divider', color: 'text.primary' }}
          >
            Call {customer.name.split(' ')[0]}
          </Button>
        </SectionCard>

        <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1.5 }}>
          <Stat label="Vehicles" value={customer.vehicle_count} />
          <Stat label="Total spent" value={inr(customer.total_spent)} hero />
          <Stat
            label="Unpaid"
            value={customer.unpaid_count}
            warn={customer.unpaid_count > 0}
          />
        </Box>

        <SectionCard title="Vehicles" padded={false}>
          {customer.vehicles.length === 0 ? (
            <EmptyPanel dense icon={<CarIcon />} title="No vehicles on record" />
          ) : (
            customer.vehicles.map((v, i) => (
              <Box key={v.id}>
                {i > 0 && <Divider />}
                <Stack
                  direction="row"
                  alignItems="center"
                  spacing={1.5}
                  onClick={() => navigate(`/vehicles/${v.id}`)}
                  sx={{ px: 2.25, py: 1.75, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                >
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography noWrap sx={{ fontSize: 13.5, fontWeight: 600 }}>
                      {v.registration_number}
                    </Typography>
                    {v.name && (
                      <Typography noWrap sx={{ fontSize: 11.5, color: 'text.disabled' }}>
                        {v.name}
                      </Typography>
                    )}
                  </Box>
                  {v.status && <StageChip status={v.status} />}
                  <ChevronRightIcon sx={{ fontSize: 18, color: 'text.disabled', flexShrink: 0 }} />
                </Stack>
              </Box>
            ))
          )}
        </SectionCard>
      </Box>
    </PageShell>
  )
}

function Stat({
  label,
  value,
  hero = false,
  warn = false,
}: {
  label: string
  value: string | number
  hero?: boolean
  warn?: boolean
}): React.JSX.Element {
  return (
    <Box sx={{ border: 1, borderColor: 'divider', borderRadius: 3, p: 1.75, bgcolor: 'background.paper' }}>
      <Kicker>{label}</Kicker>
      <Typography
        noWrap
        sx={{
          fontSize: hero ? 20 : 22,
          fontWeight: 700,
          mt: 0.5,
          fontVariantNumeric: 'tabular-nums',
          color: warn ? 'error.main' : hero ? 'primary.main' : 'text.primary',
        }}
      >
        {value}
      </Typography>
    </Box>
  )
}
