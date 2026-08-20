// StageChip — a vehicle's stage in the workshop, wherever it is shown.
//
// The dashboard and the vehicle list used to map status → label → colour
// separately, and had already drifted: the list painted REPAIRING amber and
// NEW blue, the dashboard left both neutral. One component now, so a stage
// looks the same on every screen.
import type React from 'react'
import { Chip } from '@mui/material'
import type { VisitStatus } from '@autro/shared'

import { stageChipSx } from '@/theme'
import { STAGE_LABEL } from '@/lib/format'

export function StageChip({ status }: { status: VisitStatus }): React.JSX.Element {
  return <Chip size="small" label={STAGE_LABEL[status]} sx={stageChipSx(status)} />
}
