// ListItem — flat divided row: square thumbnail slot + title + subtitle +
// right content. Matches planning/design_handoff_autro_ui's repeated row
// pattern (dashboard "Recent vehicles", vehicles list, attendance rows): a
// 56px bordered square, `row-title` (14px/600) + `row-sub` (12px/55%
// opacity), 1px bottom divider — not a per-row Card. Restyled 2026-08-19;
// was a padded, individually-bordered card row.
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
        'flex items-center gap-3 bg-card px-3 py-3',
        'border-b border-divider last:border-b-0',
        onClick ? 'cursor-pointer active:bg-bg transition-colors' : '',
      ].join(' ')}
    >
      {leftSlot && (
        <div className="w-14 h-14 flex-shrink-0 border-2 border-divider flex items-center justify-center text-text/30">
          {leftSlot}
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-row-title font-semibold text-text truncate">{title}</p>
        {subtitle && (
          <p className="text-row-sub text-text-secondary/70 truncate mt-0.5">
            {subtitle}
          </p>
        )}
      </div>

      {rightSlot && <div className="flex-shrink-0">{rightSlot}</div>}
      {showChevron && !rightSlot && onClick && (
        <ChevronRight size={16} className="text-text-muted flex-shrink-0" />
      )}
    </div>
  )
}
