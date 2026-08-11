import { config } from '@/lib/config'
import { getToken } from '@/lib/auth'

/**
 * Typed API error shape returned by the Workshop backend.
 */
interface ApiError {
  error: {
    code: string
    message: string
  }
}

/**
 * Thrown when the API returns a non-2xx response.
 */
export class ApiRequestError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
  ) {
    super(message)
    this.name = 'ApiRequestError'
  }
}

/**
 * Core fetch wrapper for the Workshop API.
 *
 * - Automatically prefixes `config.apiBaseUrl`
 * - Attaches the JWT Bearer token from localStorage (if present)
 * - Attaches X-Tenant-ID header (if tenantId is provided)
 * - Throws `ApiRequestError` on non-2xx responses
 * - Returns parsed JSON on success
 *
 * @param path     API path (e.g. "/vehicles", "/tenants/mine")
 * @param options  Standard fetch options + optional tenantId
 */
export async function apiFetch<T>(
  path: string,
  options: RequestInit & { tenantId?: string } = {},
): Promise<T> {
  const { tenantId, ...fetchOptions } = options

  const headers = new Headers(fetchOptions.headers)
  headers.set('Content-Type', 'application/json')

  const token = getToken()
  if (token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  if (tenantId) {
    headers.set('X-Tenant-ID', tenantId)
  }

  const res = await fetch(`${config.apiBaseUrl}${path}`, {
    ...fetchOptions,
    headers,
  })

  if (!res.ok) {
    let code = 'UNKNOWN_ERROR'
    let message = `HTTP ${res.status}`

    try {
      const data = (await res.json()) as ApiError
      code = data.error?.code ?? code
      message = data.error?.message ?? message
    } catch {
      // If response isn't JSON, keep default error message
    }

    throw new ApiRequestError(code, message, res.status)
  }

  // Handle empty responses (204 No Content)
  if (res.status === 204) {
    return undefined as T
  }

  return res.json() as Promise<T>
}
