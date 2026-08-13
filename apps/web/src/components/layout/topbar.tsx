// Topbar — sticky top bar.
//
// Amended 2026-08-13:
//   - inline boxShadow style replaced with a Tailwind arbitrary value (no inline
//     style props — see AGENTS.md "CODE STYLE / CSS")
//   - title is centred on mobile but left-aligned at md:+, where a centred title
//     reads as off-centre next to the sidebar
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
      className="sticky top-0 z-30 bg-card border-b border-divider shadow-[var(--shadow-topbar)]"
    >
      <div className="flex items-center h-14 px-4 gap-3">
        {/* Left: back button or spacer. Spacer is only needed to balance the
            centred mobile title, so it collapses at md:+ when there is no back
            button and the title is left-aligned. */}
        <div className={showBack ? 'w-8 flex-shrink-0' : 'w-8 flex-shrink-0 md:hidden'}>
          {showBack && (
            <button
              id="topbar-back-btn"
              type="button"
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-bg transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft size={20} strokeWidth={2.5} className="text-text" />
            </button>
          )}
        </div>

        {/* Center on mobile, left-aligned at md:+ */}
        <h1 className="flex-1 text-center md:text-left text-[1.2rem] font-semibold text-text leading-none truncate">
          {title}
        </h1>

        {/* Right: action */}
        <div className="w-8 flex-shrink-0 flex justify-end">{rightAction}</div>
      </div>
    </header>
  )
}
