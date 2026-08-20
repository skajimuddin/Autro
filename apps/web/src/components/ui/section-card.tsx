// SectionCard — the app's one panel: hairline card, titled header, rule.
//
// Every panel on the dashboard and the vehicle screens is this shape, and
// each one used to re-declare the same px/py and the same 14px/600 title.
import type React from 'react'
import { Card, Divider, Stack, Typography } from '@mui/material'

interface SectionCardProps {
  /** Header title. Omit for a card with no header rule. */
  title?: string
  /** Right-hand side of the header — a link button, a count, a chip. */
  action?: React.ReactNode
  /** Sits under the header row, above the rule — a progress bar, a filter row.
   *  Above the rule so it reads as part of the heading, not part of the body. */
  headerExtra?: React.ReactNode
  /** Pad the body. Off for cards whose body is a table or a row list, which
   *  bring their own padding so their dividers reach the card edges. */
  padded?: boolean
  id?: string
  children: React.ReactNode
}

export function SectionCard({
  title,
  action,
  headerExtra,
  padded = false,
  id,
  children,
}: SectionCardProps): React.JSX.Element {
  return (
    <Card id={id} sx={{ overflow: 'hidden' }}>
      {title && (
        <>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={1.5}
            sx={{ px: 2.25, py: 1.75, minHeight: 52 }}
          >
            <Typography variant="subtitle2">{title}</Typography>
            {action}
          </Stack>
          {headerExtra}
          <Divider />
        </>
      )}
      {padded ? <div style={{ padding: '16px 18px' }}>{children}</div> : children}
    </Card>
  )
}
