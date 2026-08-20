// BottomNav — responsive primary navigation.
//
//   < 768px : fixed bottom tab bar
//   >= 768px: fixed left sidebar (224px) — brand block, grouped nav sections,
//             account chip with sign out
//
// One component, breakpoints only — no JS branch, no duplicate markup.
//
// Rebuilt 2026-08-20 for the rounded system. Three things the design mock
// showed are deliberately NOT here, because nothing in this app backs them:
// a notification bell (no notifications feature), a ⌘K search field (no
// command palette), and a workspace-switcher chevron (a user has exactly one
// garage — see tenant-provider). Dead controls are worse than fewer controls.
//
// Staff/Attendance are OWNER-only routes (see RequireOwner in App.tsx), so
// they are hidden for STAFF members instead of rendering a tab that bounces
// them back to the dashboard.
import type React from 'react'
import { NavLink } from 'react-router'
import {
  Home,
  Car,
  FileText,
  Receipt,
  Users,
  Clock,
  Settings,
  Wrench,
  LogOut,
} from '@/components/ui/icons'
import { useAuth } from '@/providers/auth-provider'
import { useTenant } from '@/providers/tenant-provider'

interface NavTab {
  to: string
  label: string
  icon: React.ElementType
  id: string
  /** OWNER-only destination */
  ownerOnly?: boolean
}

interface NavGroup {
  heading: string
  tabs: NavTab[]
}

/** Sidebar (md:+) — the full destination list, grouped. */
const NAV_GROUPS: NavGroup[] = [
  {
    heading: 'Main',
    tabs: [
      { to: '/', label: 'Dashboard', icon: Home, id: 'nav-home' },
      { to: '/vehicles', label: 'Vehicles', icon: Car, id: 'nav-vehicles' },
      { to: '/estimates', label: 'Estimates', icon: FileText, id: 'nav-estimates' },
      { to: '/invoices', label: 'Invoices', icon: Receipt, id: 'nav-invoices' },
    ],
  },
  {
    heading: 'Team',
    tabs: [
      { to: '/staff', label: 'Staff', icon: Users, id: 'nav-staff', ownerOnly: true },
      {
        to: '/staff/attendance',
        label: 'Attendance',
        icon: Clock,
        id: 'nav-attendance',
        ownerOnly: true,
      },
    ],
  },
  {
    heading: 'Other',
    tabs: [{ to: '/settings', label: 'Settings', icon: Settings, id: 'nav-settings' }],
  },
]

/** Mobile bar — the four (three for staff) most-used destinations. */
const MOBILE_TABS: NavTab[] = [
  { to: '/', label: 'Home', icon: Home, id: 'nav-m-home' },
  { to: '/vehicles', label: 'Vehicles', icon: Car, id: 'nav-m-vehicles' },
  { to: '/staff', label: 'Staff', icon: Users, id: 'nav-m-staff', ownerOnly: true },
  { to: '/settings', label: 'Settings', icon: Settings, id: 'nav-m-settings' },
]

interface BottomNavProps {
  /**
   * Hide the mobile tab bar (sub-screens with their own bottom action bar).
   * The desktop sidebar always renders: a detail screen on a 1360px window
   * still belongs inside the app shell, and hiding it made those pages look
   * like a different product.
   */
  hideMobileBar?: boolean
}

export function BottomNav({ hideMobileBar = false }: BottomNavProps): React.JSX.Element {
  const { user, logout } = useAuth()
  const { tenant, role } = useTenant()

  const canSee = (tab: NavTab): boolean => !tab.ownerOnly || role === 'OWNER'
  const mobileTabs = MOBILE_TABS.filter(canSee)

  return (
    <>
      {/* ── Mobile: bottom tab bar ─────────────────────────────────────── */}
      <nav
        id="bottom-nav"
        className={[
          'md:hidden fixed z-40 bottom-0 left-0 right-0',
          hideMobileBar ? 'hidden' : '',
          'bg-card border-t border-divider pb-[env(safe-area-inset-bottom,0px)]',
        ].join(' ')}
      >
        <div className="flex items-stretch h-16">
          {mobileTabs.map(({ to, label, icon: Icon, id }) => (
            <NavLink
              key={to}
              to={to}
              id={id}
              end={to === '/'}
              className={({ isActive }) =>
                [
                  'flex-1 flex flex-col items-center justify-center gap-1 transition-colors',
                  isActive ? 'text-primary' : 'text-text-muted',
                ].join(' ')
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} strokeWidth={isActive ? 2.4 : 1.8} />
                  <span
                    className={[
                      'text-[0.65rem] leading-none',
                      isActive ? 'font-bold' : 'font-medium',
                    ].join(' ')}
                  >
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* ── md:+ : left sidebar ────────────────────────────────────────── */}
      <nav
        id="sidebar-nav"
        className="hidden md:flex fixed z-40 top-0 left-0 h-dvh w-[224px] flex-col bg-card border-r border-divider p-3"
      >
        {/* Brand + garage name */}
        <div className="flex items-center gap-2.5 p-2">
          <div className="w-8 h-8 rounded-[9px] bg-primary flex items-center justify-center flex-shrink-0">
            <Wrench size={16} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-row-title font-bold text-text leading-tight">Autro</p>
            {tenant?.name && (
              <p className="text-[0.6875rem] text-text-muted truncate leading-tight">
                {tenant.name}
              </p>
            )}
          </div>
        </div>

        {/* Grouped destinations */}
        <div className="flex flex-col gap-4 mt-5 overflow-y-auto">
          {NAV_GROUPS.map((group) => {
            const tabs = group.tabs.filter(canSee)
            if (tabs.length === 0) return null
            return (
              <div key={group.heading}>
                <p className="text-[0.65rem] font-bold uppercase tracking-[0.06em] text-text-muted px-2 pb-1.5">
                  {group.heading}
                </p>
                <div className="flex flex-col gap-0.5">
                  {tabs.map(({ to, label, icon: Icon, id }) => (
                    <NavLink
                      key={to}
                      to={to}
                      id={id}
                      end={to === '/'}
                      className={({ isActive }) =>
                        [
                          'flex items-center gap-2.5 h-[38px] px-2.5 rounded-[10px] transition-colors',
                          isActive
                            ? 'bg-primary text-white shadow-[var(--shadow-primary)]'
                            : 'text-text-secondary hover:bg-subtle hover:text-text',
                        ].join(' ')
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            size={16}
                            strokeWidth={isActive ? 2.2 : 1.8}
                            className="flex-shrink-0"
                          />
                          <span
                            className={[
                              'text-row-title',
                              isActive ? 'font-semibold' : 'font-medium',
                            ].join(' ')}
                          >
                            {label}
                          </span>
                        </>
                      )}
                    </NavLink>
                  ))}
                </div>
              </div>
            )
          })}
        </div>

        {/* Account chip */}
        <div className="mt-auto flex items-center gap-2.5 p-2 rounded-tile border border-divider">
          {user?.avatar_url ? (
            <img
              src={user.avatar_url}
              alt=""
              className="w-8 h-8 rounded-full flex-shrink-0 object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary-light text-primary-hover flex items-center justify-center flex-shrink-0 text-row-sub font-bold">
              {user?.name?.charAt(0).toUpperCase() ?? '?'}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-row-sub font-semibold text-text truncate leading-tight">
              {user?.name ?? 'Signed in'}
            </p>
            {role && (
              <p className="text-[0.6875rem] text-text-muted capitalize leading-tight">
                {role.toLowerCase()}
              </p>
            )}
          </div>
          <button
            id="sidebar-signout"
            type="button"
            onClick={logout}
            className="w-7 h-7 rounded-full flex items-center justify-center text-text-muted hover:bg-subtle hover:text-danger transition-colors flex-shrink-0"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut size={15} />
          </button>
        </div>
      </nav>
    </>
  )
}
