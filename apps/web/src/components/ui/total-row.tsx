// TotalRow — bold divider + large total amount
//
// Amount is `text-value-xl` in `primary` — 05-ui-screens.md Screen 7 spec is
// explicit: "Grand Total (large, bold, blue)", and the type table maps "Hero
// stat / Total" to that token. Was raw `text-xl text-text` (1.25rem, ink, no
// semantic token) — smaller than the scale prescribes and not the accent
// colour money totals get everywhere else in the app.
import type React from 'react'

interface TotalRowProps {
  label?: string
  total: number
}

export function TotalRow({ label = 'Total', total }: TotalRowProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-between pt-3 mt-1 border-t-2 border-border">
      <span className="text-row-title font-bold text-text">{label}</span>
      <span className="text-value-xl font-bold text-primary tabular-nums">
        ₹{total.toLocaleString('en-IN')}
      </span>
    </div>
  )
}
