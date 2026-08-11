import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'

/**
 * TanStack Query client with sensible defaults for this app.
 *
 * - staleTime: 60s — data is fresh for 1 minute before auto-refetch
 * - retry: 1 — on failure, retry once
 * - refetchOnWindowFocus: true — refetch when tab becomes active
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
})

interface QueryProviderProps {
  children: ReactNode
}

/**
 * Wraps the application with TanStack Query's QueryClientProvider.
 * Must be an ancestor of any component that uses useQuery/useMutation.
 */
export function QueryProvider({ children }: QueryProviderProps): React.JSX.Element {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
}
