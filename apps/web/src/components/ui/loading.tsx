// Loading — skeleton shimmer for data fetching
import type React from 'react'

interface SkeletonProps {
  className?: string
}

function Skeleton({ className = '' }: SkeletonProps): React.JSX.Element {
  return (
    <div
      className={`animate-pulse rounded bg-divider ${className}`}
    />
  )
}

// ── Preset skeleton layouts ──────────────────────────────────────────────────

/** Generic horizontal list row skeleton */
export function ListItemSkeleton(): React.JSX.Element {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-divider">
      <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}

/** Generic stat card skeleton */
export function StatCardSkeleton(): React.JSX.Element {
  return (
    <div className="bg-card rounded-card p-4 flex items-center gap-3 shadow-[var(--shadow-card)]">
      <Skeleton className="w-10 h-10 rounded-xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-3 w-24" />
      </div>
    </div>
  )
}

/** Simple full-page spinner (fallback) */
export function FullPageSpinner(): React.JSX.Element {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-bg">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin-fast" />
    </div>
  )
}

/** Generic block skeleton for flexible use */
export function Loading({ rows = 4 }: { rows?: number }): React.JSX.Element {
  return (
    <div>
      {Array.from({ length: rows }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: skeleton rows have no meaningful key
        <ListItemSkeleton key={i} />
      ))}
    </div>
  )
}
