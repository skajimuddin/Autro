// BottomNav — fixed 4-tab navigation
import type React from 'react'
import { NavLink } from 'react-router'
import { Home, Car, Users, Settings } from 'lucide-react'

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
      className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[414px] z-40 bg-card border-t border-divider"
      style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-stretch h-16">
        {TABS.map(({ to, label, icon: Icon, id }) => (
          <NavLink
            key={to}
            to={to}
            id={id}
            end={to === '/'}
            className={({ isActive }) =>
              [
                'flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors',
                isActive ? 'text-primary' : 'text-text-muted hover:text-text-secondary',
              ].join(' ')
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                <span className="text-[0.65rem] font-medium leading-none">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
