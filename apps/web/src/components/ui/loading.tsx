// Loading — skeleton shimmer for data fetching
import type React from 'react'

interface SkeletonProps {
  className?: string
}

function Skeleton({ className = '' }: SkeletonProps): React.JSX.Element {
  return (
    <div
      className={`animate-pulse bg-divider ${className}`}
    />
  )
}

// ── Preset skeleton layouts ──────────────────────────────────────────────────

/** Generic horizontal list row skeleton */
export function ListItemSkeleton(): React.JSX.Element {
  return (
    <div className="flex items-center gap-3 px-3 py-3 border-b border-divider">
      <Skeleton className="w-14 h-14 flex-shrink-0" />
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
    <div className="bg-card rounded-card border border-divider p-4 shadow-[var(--shadow-card)]">
      <Skeleton className="h-2.5 w-20" />
      <Skeleton className="h-6 w-14 mt-2.5" />
    </div>
  )
}

/** Simple full-page spinner (fallback). Optional label sits under the spinner. */
export function FullPageSpinner({
  label,
}: {
  label?: string
}): React.JSX.Element {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-3 bg-bg">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin-fast" />
      {label && <p className="text-sm text-text-secondary">{label}</p>}
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
