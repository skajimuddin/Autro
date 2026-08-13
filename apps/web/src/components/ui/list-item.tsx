// ListItem — clickable row: icon/avatar + title + subtitle + right content
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
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick() } : undefined}
      className={[
        // py-4 (16px) matches planning/demo-ui .list-item padding; was py-3.
        'flex items-center gap-3 bg-card px-4 py-4',
        'border-b border-divider last:border-b-0',
        onClick ? 'cursor-pointer active:bg-bg transition-colors' : '',
      ].join(' ')}
    >
      {/* Left: icon or avatar */}
      {leftSlot && (
        <div className="flex-shrink-0">{leftSlot}</div>
      )}

      {/* Center: title + subtitle.
          Demo: .list-item-title 1.1rem/700, .list-item-sub 0.9rem secondary.
          Was text-sm/600 + text-xs muted — noticeably smaller and fainter. */}
      <div className="flex-1 min-w-0">
        <p className="text-row-title font-bold text-text truncate">{title}</p>
        {subtitle && (
          <p className="text-row-sub text-text-secondary truncate mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {/* Right: custom slot or chevron */}
      {rightSlot && <div className="flex-shrink-0">{rightSlot}</div>}
      {showChevron && !rightSlot && onClick && (
        <ChevronRight size={18} strokeWidth={2.5} className="text-text-muted flex-shrink-0" />
      )}
    </div>
  )
}
