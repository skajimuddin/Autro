// Topbar — sticky top bar.
//
// Restyled 2026-08-19 to match planning/design_handoff_autro_ui's flat page
// headers: `padding:var(--space-4);border-bottom:2px solid var(--color-
// divider);` with a left-aligned 24px/700 title (20px when a back button is
// present) — no shadow, never centred. Was a fixed 56px bar with a shadow and
// a mobile-centred title.
//   - z-30 so the fixed sidebar (z-40) stays above it
import type React from 'react'
import { useNavigate } from 'react-router'
import { ArrowLeft } from '@/components/ui/icons'

interface TopbarProps {
  title: string
  /** If true, shows a back arrow that navigates -1 */
  showBack?: boolean
  /** Optional right-side action element */
  rightAction?: React.ReactNode
}

export function Topbar({
  title,
  showBack = false,
  rightAction,
}: TopbarProps): React.JSX.Element {
  const navigate = useNavigate()

  return (
    <header
      id="topbar"
      className="sticky top-0 z-30 bg-bg border-b-2 border-divider"
    >
      <div className="flex items-center gap-3 px-4 py-4">
        {showBack && (
          <button
            id="topbar-back-btn"
            type="button"
            onClick={() => navigate(-1)}
            className="w-8 h-8 flex-shrink-0 flex items-center justify-center hover:bg-divider transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft size={18} className="text-text" />
          </button>
        )}

        <h1
          className={[
            'flex-1 font-bold text-text leading-none truncate',
            showBack ? 'text-[1.25rem]' : 'text-[1.5rem]',
          ].join(' ')}
        >
          {title}
        </h1>

        {rightAction && <div className="flex-shrink-0">{rightAction}</div>}
      </div>
    </header>
  )
}
