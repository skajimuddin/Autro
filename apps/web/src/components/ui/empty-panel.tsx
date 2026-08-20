// EmptyPanel — what a card body shows when its query came back empty.
//
// Shared by the dashboard's panels and the vehicle list so "nothing here yet"
// reads the same everywhere instead of being re-centred by hand each time.
import type React from 'react'
import { Avatar, Button, Stack, Typography } from '@mui/material'

interface EmptyPanelProps {
  icon?: React.ReactNode
  title: string
  description?: string
  /** Label + handler for the one thing to do about it. */
  action?: { label: string; icon?: React.ReactNode; onClick: () => void }
  /** Tighter version for a narrow side panel. */
  dense?: boolean
}

export function EmptyPanel({
  icon,
  title,
  description,
  action,
  dense = false,
}: EmptyPanelProps): React.JSX.Element {
  return (
    <Stack alignItems="center" spacing={1.5} sx={{ py: dense ? 4 : 6, px: 3, textAlign: 'center' }}>
      {icon && (
        <Avatar sx={{ bgcolor: 'action.hover', color: 'text.disabled', width: 48, height: 48 }}>
          {icon}
        </Avatar>
      )}
      <Typography sx={{ fontSize: 14, fontWeight: 600 }}>{title}</Typography>
      {description && (
        <Typography sx={{ fontSize: 12.5, color: 'text.disabled', maxWidth: 320 }}>
          {description}
        </Typography>
      )}
      {action && (
        <Button
          variant="contained"
          size="small"
          startIcon={action.icon}
          onClick={action.onClick}
          sx={{ mt: 1 }}
        >
          {action.label}
        </Button>
      )}
    </Stack>
  )
}
