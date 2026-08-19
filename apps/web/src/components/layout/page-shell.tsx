// PageShell — responsive app shell: nav + Topbar + scrollable content.
//
// Nav is a bottom bar on phones and a left sidebar at md:+ (see bottom-nav.tsx),
// so the content is offset by the sidebar width at md:+ and centred within the
// remaining space.
//
// Amended 2026-08-13:
//   - dropped the max-w-[414px] MobileContainer wrapper
//   - removed `overflow-y-auto` from <main>. It made <main> the scroll container
//     while <Topbar> uses `sticky top-0`, so the sticky header never worked
//     correctly. The page now scrolls on the body and sticky behaves.
import type React from 'react'

import { Topbar } from './topbar'
import { BottomNav } from './bottom-nav'

interface PageShellProps {
  title: string
  showBack?: boolean
  rightAction?: React.ReactNode
  /** Pass true to hide the nav on this page (e.g. modals, detail sheets) */
  hideNav?: boolean
  /**
   * Opt into a wider content column at lg:+. For list/table pages only.
   * Detail and form pages keep the narrower default, because a two-column stat
   * grid stretched across 1024px reads badly.
   */
  wide?: boolean
  children: React.ReactNode
}

export function PageShell({
  title,
  showBack = false,
  rightAction,
  hideNav = false,
  wide = false,
  children,
}: PageShellProps): React.JSX.Element {
  return (
    <div className="min-h-dvh bg-bg">
      {!hideNav && <BottomNav />}

      {/* Offset for the md:+ sidebar */}
      <div className={hideNav ? '' : 'md:pl-[220px]'}>
        <Topbar title={title} showBack={showBack} rightAction={rightAction} />

        {/* pb clears the mobile bottom nav; not needed once nav is a sidebar */}
        <main
          className={[
            'animate-page-enter min-h-[calc(100dvh-3.5rem)]',
            hideNav ? 'pb-4' : 'pb-20 md:pb-8',
          ].join(' ')}
        >
          <div
            className={[
              'mx-auto w-full',
              wide ? 'max-w-3xl lg:max-w-6xl' : 'max-w-3xl',
            ].join(' ')}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
