// Card — flat bordered container, hairline shadow (elevated variant for the
// handoff's `.card.elev-md` — invoice total, attendance QR, dashboard hero).
//
// Restyled 2026-08-19: zero radius, thin divider-colour border added (a flat
// white card on a near-white #f1f5f9 ground needs a border to read as a
// surface, not just a shadow), padding down to 16px (space-4) matching the
// handoff's stat/content card padding. Was rounded-2xl, shadow-only, 20px pad.
import type React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  id?: string
  /** Slightly heavier shadow — for cards meant to read as "the important one" on a screen (totals, QR). */
  elevated?: boolean
}

export function Card({ children, className = '', onClick, id, elevated = false }: CardProps): React.JSX.Element {
  const clickable = Boolean(onClick)

  return (
    <div
      id={id}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.() } : undefined}
      className={[
        'bg-card rounded-card border border-divider p-4',
        elevated ? 'shadow-[var(--shadow-elev-md)]' : 'shadow-[var(--shadow-card)]',
        clickable ? 'cursor-pointer active:scale-[0.99] transition-transform hover:border-border' : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}
