import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { getToken, clearToken, saveToken } from '@/lib/auth'
import { apiFetch } from '@/lib/api'

// ── Types ─────────────────────────────────────────────────────────────────────

interface AuthUser {
  id: string
  email: string
  name: string
  avatar_url: string | null
}

interface AuthContextValue {
  /** Null if not authenticated */
  user: AuthUser | null
  /** The JWT token, or null if not logged in */
  token: string | null
  /** True while verifying the token on initial load */
  isLoading: boolean
  /** Log out: clears token + user state */
  logout: () => void
  /** Called by the callback page after exchanging OAuth code */
  onLoginSuccess: (token: string, user: AuthUser) => void
}

// ── Context ───────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null)

// ── Provider ──────────────────────────────────────────────────────────────────

interface AuthProviderProps {
  children: ReactNode
}

/**
 * AuthProvider — wraps the app and manages authentication state.
 *
 * On mount, checks localStorage for an existing JWT and validates it
 * by fetching the user's garage (GET /tenants/mine). If the token is
 * invalid/expired, the user is logged out automatically.
 */
export function AuthProvider({ children }: AuthProviderProps): React.JSX.Element {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [token, setToken] = useState<string | null>(getToken)
  const [isLoading, setIsLoading] = useState(true)

  // On mount: verify token and hydrate user state
  useEffect(() => {
    const storedToken = getToken()

    if (!storedToken) {
      setIsLoading(false)
      return
    }

    // Validate the token by hitting a lightweight protected endpoint
    apiFetch<{
      user?: AuthUser
      token?: string
    }>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ token: storedToken }),
    })
      .then((data) => {
        if (data.token) {
          // Refresh the token in localStorage
          saveToken(data.token)
          setToken(data.token)
        }
        if (data.user) {
          setUser(data.user)
        }
      })
      .catch(() => {
        // Token is invalid/expired — clear it
        clearToken()
        setToken(null)
        setUser(null)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [])

  const logout = useCallback(() => {
    clearToken()
    setToken(null)
    setUser(null)
  }, [])

  const onLoginSuccess = useCallback((newToken: string, newUser: AuthUser) => {
    saveToken(newToken)
    setToken(newToken)
    setUser(newUser)
  }, [])

  return (
    <AuthContext.Provider value={{ user, token, isLoading, logout, onLoginSuccess }}>
      {children}
    </AuthContext.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * useAuth — access auth state from any component.
 * Must be used inside <AuthProvider>.
 */
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error('useAuth must be used inside <AuthProvider>')
  }
  return ctx
}
