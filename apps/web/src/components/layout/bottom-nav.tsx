// BottomNav — responsive primary navigation.
//
//   < 768px : fixed bottom bar, 4 icon+label tabs
//   >= 768px: fixed left sidebar (220px) with brand header and horizontal tabs
//
// Same component, breakpoints only — no JS, no duplicate markup.
// Restyled 2026-08-19 to match planning/design_handoff_autro_ui: active
// sidebar item gets a 3px accent left border + accent-100 background (the
// handoff's literal nav markup), 2px top border on the mobile bar (was 1px),
// zero radius on the active-state chip (was rounded-xl).
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
        'bottom-0 left-0 right-0 border-t-2 pb-[env(safe-area-inset-bottom,0px)]',
        // md+: left sidebar, full height
        'md:top-0 md:right-auto md:h-dvh md:w-[220px] md:border-t-0 md:border-r-2 md:flex md:flex-col md:pb-0',
      ].join(' ')}
    >
      {/* Brand header — sidebar only */}
      <div className="hidden md:flex items-center gap-2.5 h-14 px-4 border-b-2 border-divider flex-shrink-0">
        <Wrench size={18} className="text-primary" />
        <span className="font-bold text-text">Autro</span>
      </div>

      <div className="flex items-stretch h-16 md:h-auto md:flex-col md:pt-2">
        {TABS.map(({ to, label, icon: Icon, id }) => (
          <NavLink
            key={to}
            to={to}
            id={id}
            end={to === '/'}
            className={({ isActive }) =>
              [
                'flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors',
                // md+: horizontal row inside the sidebar, 3px accent left
                // border on the active item (the handoff's literal treatment)
                'md:flex-none md:flex-row md:justify-start md:gap-2.5 md:h-11 md:px-4 md:border-l-[3px]',
                isActive
                  ? 'text-primary md:bg-primary-light md:border-l-primary'
                  : 'text-text-muted hover:text-text-secondary md:hover:bg-bg md:border-l-transparent',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={20}
                  strokeWidth={isActive ? 2.25 : 1.75}
                  className="md:w-4 md:h-4 flex-shrink-0"
                />
                <span className="text-[0.65rem] md:text-row-sub font-medium leading-none">
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
