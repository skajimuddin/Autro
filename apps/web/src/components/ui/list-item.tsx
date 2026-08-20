// ListItem — rounded row card: tinted thumbnail tile + title + subtitle +
// right content.
//
// Rounded system (2026-08-20): each row is its own 14px-radius surface in a
// gapped stack, replacing the divider-separated flat rows. Rows read as
// tappable objects on a phone, which is where this component is used.
import type React from 'react'
import { ChevronRight } from '@/components/ui/icons'

interface ListItemProps {
  leftSlot?: React.ReactNode
  title: string
  subtitle?: string
  rightSlot?: React.ReactNode
  showChevron?: boolean
  onClick?: () => void
  id?: string
}

export function ListItem({
  leftSlot,
  title,
  subtitle,
  rightSlot,
  showChevron = true,
  onClick,
  id,
}: ListItemProps): React.JSX.Element {
  return (
    <div
      id={id}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick()
            }
          : undefined
      }
      className={[
        'flex items-center gap-3 bg-card p-2.5 rounded-[14px] border border-divider',
        'shadow-[var(--shadow-card)]',
        onClick ? 'cursor-pointer hover:border-border active:scale-[0.99] transition-all' : '',
      ].join(' ')}
    >
      {leftSlot && (
        <div className="w-12 h-12 flex-shrink-0 rounded-tile bg-subtle flex items-center justify-center text-text-muted">
          {leftSlot}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-row-title font-semibold text-text truncate">{title}</p>
        {subtitle && <p className="text-row-sub text-text-secondary truncate mt-0.5">{subtitle}</p>}
      </div>

      {rightSlot && <div className="flex-shrink-0">{rightSlot}</div>}
      {showChevron && !rightSlot && onClick && (
        <ChevronRight size={16} className="text-text-faint flex-shrink-0" />
      )}
    </div>
  )
}
