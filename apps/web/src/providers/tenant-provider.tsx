import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { useAuth } from '@/providers/auth-provider'
import { apiFetch } from '@/lib/api'

// ── Types ─────────────────────────────────────────────────────────────────────

interface Tenant {
  id: string
  name: string
  owner_id: string
  phone: string
  address: string | null
  logo_url: string | null
  latitude: number | null
  longitude: number | null
  gps_radius_meters: number | null
  created_at: string
  updated_at: string
}

interface TenantContextValue {
  /** Current tenant, or null if not yet loaded / user has no garage */
  tenant: Tenant | null
  /** User's role in this tenant */
  role: 'OWNER' | 'STAFF' | null
  /** True while loading tenant data */
  isLoading: boolean
  /** True if an error occurred fetching the tenant */
  isError: boolean
  /** Refetch tenant data (call after creating a garage) */
  refetch: () => void
}

// ── Context ───────────────────────────────────────────────────────────────────

const TenantContext = createContext<TenantContextValue | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────────

interface TenantProviderProps {
  children: ReactNode
}

/**
 * TenantProvider — fetches the current user's garage and provides it
 * to the component tree via context.
 *
 * Only fetches if the user is authenticated (has a token from AuthContext).
 * Returns null tenant if the user has no garage yet → router redirects to /onboarding.
 */
export function TenantProvider({ children }: TenantProviderProps): React.JSX.Element {
  const { token } = useAuth()
  const [tenant, setTenant] = useState<Tenant | null>(null)
  const [role, setRole] = useState<'OWNER' | 'STAFF' | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState(false)

  const fetchTenant = useCallback(() => {
    if (!token) return

    setIsLoading(true)
    setIsError(false)

    apiFetch<{ tenant: Tenant; role: 'OWNER' | 'STAFF' }>('/tenants/mine')
      .then((data) => {
        setTenant(data.tenant)
        setRole(data.role)
      })
      .catch((err: unknown) => {
        // 404 = no garage yet → not an error, just no tenant
        const isNotFound =
          err instanceof Error && 'status' in err ? (err as { status?: number }).status === 404 : false
        if (isNotFound) {
          setTenant(null)
          setRole(null)
        } else {
          setIsError(true)
        }
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [token])

  useEffect(() => {
    fetchTenant()
  }, [fetchTenant])

  return (
    <TenantContext.Provider value={{ tenant, role, isLoading, isError, refetch: fetchTenant }}>
      {children}
    </TenantContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * useTenant — access tenant state from any component.
 * Must be used inside <TenantProvider>.
 */
export function useTenant(): TenantContextValue {
  const ctx = useContext(TenantContext)
  if (!ctx) {
    throw new Error('useTenant must be used inside <TenantProvider>')
  }
  return ctx
}
