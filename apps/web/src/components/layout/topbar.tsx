// Topbar — sticky page header.
//
// Rounded system (2026-08-20): no bottom rule (the page ground carries the
// separation), rounded 36px action buttons, and an optional subtitle so
// detail screens can show a secondary line (e.g. a vehicle's model) without
// each page hand-rolling its own header.
import type React from 'react'
import { useNavigate } from 'react-router'
import { ArrowLeft } from '@/components/ui/icons'

interface TopbarProps {
  title: string
  /** Secondary line under the title. */
  subtitle?: string
  /** If true, shows a back arrow that navigates -1 */
  showBack?: boolean
  /** Optional right-side action element */
  rightAction?: React.ReactNode
}

export function Topbar({
  title,
  subtitle,
  showBack = false,
  rightAction,
}: TopbarProps): React.JSX.Element {
  const navigate = useNavigate()

  return (
    <header id="topbar" className="sticky top-0 z-30 bg-bg/90 backdrop-blur-sm">
      <div className="flex items-center gap-3 px-4 md:px-7 py-4">
        {showBack && (
          <button
            id="topbar-back-btn"
            type="button"
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex-shrink-0 flex items-center justify-center rounded-tile bg-card border border-divider shadow-[var(--shadow-card)] hover:border-border transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={17} className="text-text" />
          </button>
        )}

        <div className="flex-1 min-w-0">
          <h1
            className={[
              'font-extrabold text-text leading-tight truncate tracking-[-0.01em]',
              showBack ? 'text-[1.25rem]' : 'text-[1.375rem]',
            ].join(' ')}
          >
            {title}
          </h1>
          {subtitle && (
            <p className="text-row-sub text-text-secondary truncate mt-0.5">{subtitle}</p>
          )}
        </div>

        {rightAction && <div className="flex-shrink-0">{rightAction}</div>}
      </div>
    </header>
  )
}
