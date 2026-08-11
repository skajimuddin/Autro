// Topbar — sticky top navigation bar
import type React from 'react'
import { useNavigate } from 'react-router'
import { ArrowLeft } from 'lucide-react'

interface TopbarProps {
  title: string
  /** If true, shows a back arrow that navigates -1 */
  showBack?: boolean
  /** Optional right-side action element */
  rightAction?: React.ReactNode
}

export function Topbar({ title, showBack = false, rightAction }: TopbarProps): React.JSX.Element {
  const navigate = useNavigate()

  return (
    <header
      id="topbar"
      className="sticky top-0 z-40 bg-card border-b border-divider"
      style={{ boxShadow: 'var(--shadow-topbar)' }}
    >
      <div className="flex items-center h-14 px-4 gap-3">
        {/* Left: back button or spacer */}
        <div className="w-8 flex-shrink-0">
          {showBack && (
            <button
              id="topbar-back-btn"
              type="button"
              onClick={() => navigate(-1)}
              className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-bg transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft size={20} className="text-text" />
            </button>
          )}
        </div>

        {/* Center: title */}
        <h1 className="flex-1 text-center text-[1.2rem] font-semibold text-text leading-none truncate">
          {title}
        </h1>

        {/* Right: action */}
        <div className="w-8 flex-shrink-0 flex justify-end">
          {rightAction}
        </div>
      </div>
    </header>
  )
}
