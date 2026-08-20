// Kicker — the small uppercase label above a figure or a block of detail.
//
// Same treatment as the dashboard's stat labels, so a card on the vehicle
// screen and a tile on the dashboard introduce their content identically.
import type React from 'react'
import { Typography } from '@mui/material'

export function Kicker({ children }: { children: React.ReactNode }): React.JSX.Element {
  return (
    <Typography
      sx={{
        fontSize: 10.5,
        fontWeight: 700,
        letterSpacing: '.13em',
        textTransform: 'uppercase',
        color: 'text.disabled',
      }}
    >
      {children}
    </Typography>
  )
}
