// Card — rounded surface: 16px radius, hairline border + soft shadow.
//
// The border and the shadow work together on purpose (2026-08-20): on a light
// ground a shadow-only card reads hazy, a border-only card reads hard.
import type React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  id?: string
  /** Heavier shadow — for the one "important" card on a screen (totals, QR). */
  elevated?: boolean
}

export function Card({
  children,
  className = '',
  onClick,
  id,
  elevated = false,
}: CardProps): React.JSX.Element {
  const clickable = Boolean(onClick)

  return (
    <div
      id={id}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        clickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick?.()
            }
          : undefined
      }
      className={[
        'bg-card rounded-card border border-divider p-4',
        elevated ? 'shadow-[var(--shadow-elev-md)]' : 'shadow-[var(--shadow-card)]',
        clickable
          ? 'cursor-pointer active:scale-[0.99] transition-transform hover:border-border'
          : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}
