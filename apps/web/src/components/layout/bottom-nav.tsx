// BottomNav — responsive primary navigation.
//
//   < 768px : fixed bottom bar, 4 icon+label tabs
//   >= 768px: fixed left sidebar (w-60) with brand header and horizontal tabs
//
// Same component, breakpoints only — no JS, no duplicate markup.
// Amended 2026-08-13; see "Responsive Layout" in planning/final/05-ui-screens.md.
import type React from 'react'
import { NavLink } from 'react-router'
import { Home, Car, Users, Settings, Wrench } from '@/components/ui/icons'

interface NavTab {
  to: string
  label: string
  icon: React.ElementType
  id: string
}

const TABS: NavTab[] = [
  { to: '/',         label: 'Home',     icon: Home,     id: 'nav-home' },
  { to: '/vehicles', label: 'Vehicles', icon: Car,      id: 'nav-vehicles' },
  { to: '/staff',    label: 'Staff',    icon: Users,    id: 'nav-staff' },
  { to: '/settings', label: 'Settings', icon: Settings, id: 'nav-settings' },
]

export function BottomNav(): React.JSX.Element {
  return (
    <nav
      id="bottom-nav"
      className={[
        'fixed z-40 bg-card border-divider',
        // Mobile: bottom bar spanning full width. env() keeps it clear of the
        // home indicator on notched phones.
        'bottom-0 left-0 right-0 border-t pb-[env(safe-area-inset-bottom,0px)]',
        // md+: left sidebar, full height
        'md:top-0 md:right-auto md:h-dvh md:w-60 md:border-t-0 md:border-r md:flex md:flex-col md:pb-0',
      ].join(' ')}
    >
      {/* Brand header — sidebar only */}
      <div className="hidden md:flex items-center gap-2.5 h-14 px-5 border-b border-divider flex-shrink-0">
        <Wrench size={20} strokeWidth={2.5} className="text-primary" />
        <span className="font-bold text-text">Workshop</span>
      </div>

      <div className="flex items-stretch h-16 md:h-auto md:flex-col md:gap-1 md:p-3">
        {TABS.map(({ to, label, icon: Icon, id }) => (
          <NavLink
            key={to}
            to={to}
            id={id}
            end={to === '/'}
            className={({ isActive }) =>
              [
                'flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors',
                // md+: horizontal row inside the sidebar
                'md:flex-none md:flex-row md:justify-start md:gap-3 md:h-11 md:px-3 md:rounded-xl',
                isActive
                  ? 'text-primary md:bg-primary-light'
                  : 'text-text-muted hover:text-text-secondary md:hover:bg-bg',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={22}
                  strokeWidth={isActive ? 2.5 : 1.8}
                  className="md:w-5 md:h-5 flex-shrink-0"
                />
                <span className="text-[0.65rem] md:text-sm font-medium leading-none">
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
