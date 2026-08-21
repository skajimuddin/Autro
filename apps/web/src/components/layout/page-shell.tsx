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
import { InstallBanner } from './install-banner'

interface PageShellProps {
  title: string
  /** Shorter title for the mobile app bar. */
  mobileTitle?: string
  /** Secondary line under the page title. */
  subtitle?: React.ReactNode
  showBack?: boolean
  rightAction?: React.ReactNode
  /** Right-side action for the mobile app bar, when it differs. Pass `null`
   *  for no action at all; omit it to reuse `rightAction`. */
  mobileAction?: React.ReactNode
  /** Second line of the mobile app bar, in place of the garage name. */
  mobileSubtitle?: string
  /**
   * Hide the MOBILE tab bar on this page — for sub-screens that carry their
   * own bottom action bar. The desktop sidebar always stays (2026-08-20):
   * detail screens used to drop out of the app shell entirely at md:+.
   */
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
  mobileTitle,
  subtitle,
  showBack = false,
  rightAction,
  mobileAction,
  mobileSubtitle,
  hideNav = false,
  wide = false,
  children,
}: PageShellProps): React.JSX.Element {
  return (
    <div className="min-h-dvh bg-bg">
      <BottomNav hideMobileBar={hideNav} />

      {/* Offset for the md:+ sidebar */}
      <div className="md:pl-[240px]">
        <Topbar
          title={title}
          mobileTitle={mobileTitle}
          mobileAction={mobileAction}
          mobileSubtitle={mobileSubtitle}
          subtitle={subtitle}
          wide={wide}
          showBack={showBack}
          rightAction={rightAction}
        />

        <InstallBanner />

        {/* pb clears the mobile bottom nav; not needed once nav is a sidebar */}
        <main
          className={[
            'animate-page-enter min-h-[calc(100dvh-3.5rem)]',
            hideNav ? 'pb-4' : 'pb-20 md:pb-8',
          ].join(' ')}
        >
          <div
            className={['mx-auto w-full', wide ? 'max-w-3xl lg:max-w-6xl' : 'max-w-3xl'].join(' ')}
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
