// PriceRow — item name + ₹ price on a single row (for estimates/invoices)
import type React from 'react'

interface PriceRowProps {
  name: string
  price: number
  quantity?: number
  className?: string
}

export function PriceRow({ name, price, quantity, className = '' }: PriceRowProps): React.JSX.Element {
  return (
    <div className={`flex items-baseline justify-between py-1.5 border-b border-divider last:border-b-0 ${className}`}>
      <div className="flex-1 min-w-0 truncate">
        <span className="text-detail text-text">{name}</span>
        {quantity != null && quantity > 1 && (
          <span className="text-row-sub text-text-muted ml-1.5">× {quantity}</span>
        )}
      </div>
      <span className="text-detail font-semibold text-text ml-4 flex-shrink-0 whitespace-nowrap">
        ₹{price.toLocaleString('en-IN')}
      </span>
    </div>
  )
}
