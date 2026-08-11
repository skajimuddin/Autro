// PageShell — combines MobileContainer + Topbar + scrollable content + BottomNav
import type React from 'react'
import { MobileContainer } from './mobile-container'
import { Topbar } from './topbar'
import { BottomNav } from './bottom-nav'

interface PageShellProps {
  title: string
  showBack?: boolean
  rightAction?: React.ReactNode
  /** Pass true to hide BottomNav on this page (e.g. modals, detail sheets) */
  hideNav?: boolean
  children: React.ReactNode
}

export function PageShell({
  title,
  showBack = false,
  rightAction,
  hideNav = false,
  children,
}: PageShellProps): React.JSX.Element {
  return (
    <MobileContainer>
      <Topbar title={title} showBack={showBack} rightAction={rightAction} />

      {/* Scrollable content area — pb-16 leaves room for BottomNav */}
      <main
        className={[
          'animate-page-enter overflow-y-auto',
          hideNav ? 'pb-4' : 'pb-20',
        ].join(' ')}
        style={{ minHeight: 'calc(100dvh - 56px)' }}
      >
        {children}
      </main>

      {!hideNav && <BottomNav />}
    </MobileContainer>
  )
}
