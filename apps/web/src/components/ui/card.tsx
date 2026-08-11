// Card — white rounded-2xl container with soft shadow
import type React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  onClick?: () => void
  id?: string
}

export function Card({ children, className = '', onClick, id }: CardProps): React.JSX.Element {
  const clickable = Boolean(onClick)

  return (
    <div
      id={id}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onClick={onClick}
      onKeyDown={clickable ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick?.() } : undefined}
      className={[
        'bg-card rounded-card p-4',
        'shadow-[var(--shadow-card)]',
        clickable ? 'cursor-pointer active:scale-[0.99] transition-transform hover:shadow-md' : '',
        className,
      ].join(' ')}
    >
      {children}
    </div>
  )
}
