// TotalRow — bold divider + large total amount
import type React from 'react'

interface TotalRowProps {
  label?: string
  total: number
}

export function TotalRow({ label = 'Total', total }: TotalRowProps): React.JSX.Element {
  return (
    <div className="flex items-center justify-between pt-3 mt-1 border-t-2 border-border">
      <span className="text-base font-bold text-text">{label}</span>
      <span className="text-xl font-bold text-text">
        ₹{total.toLocaleString('en-IN')}
      </span>
    </div>
  )
}
