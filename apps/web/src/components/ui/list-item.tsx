// ListItem — clickable row: icon/avatar + title + subtitle + right content
import type React from 'react'
import { ChevronRight } from 'lucide-react'

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
        'flex items-center gap-3 bg-card px-4 py-3',
        'border-b border-divider last:border-b-0',
        onClick ? 'cursor-pointer active:bg-bg transition-colors' : '',
      ].join(' ')}
    >
      {/* Left: icon or avatar */}
      {leftSlot && (
        <div className="flex-shrink-0">{leftSlot}</div>
      )}

      {/* Center: title + subtitle */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text truncate">{title}</p>
        {subtitle && (
          <p className="text-xs text-text-muted truncate mt-0.5">{subtitle}</p>
        )}
      </div>

      {/* Right: custom slot or chevron */}
      {rightSlot && <div className="flex-shrink-0">{rightSlot}</div>}
      {showChevron && !rightSlot && onClick && (
        <ChevronRight size={16} className="text-text-muted flex-shrink-0" />
      )}
    </div>
  )
}
