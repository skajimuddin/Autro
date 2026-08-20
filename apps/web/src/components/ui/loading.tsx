// Loading — skeleton shimmer for data fetching.
//
// Skeletons mirror the shape of what they replace (2026-08-20): rounded row
// cards for lists, a table row for the desktop vehicle table, a pill for the
// dashboard stat strip — so nothing shifts when real data lands.
import type React from 'react'

interface SkeletonProps {
  className?: string
}

function Skeleton({ className = '' }: SkeletonProps): React.JSX.Element {
  return <div className={`animate-pulse bg-divider rounded-full ${className}`} />
}

// ── Preset skeleton layouts ──────────────────────────────────────────────────

/** The row shape <Loading> repeats. Private: nothing needs one on its own. */
function ListItemSkeleton(): React.JSX.Element {
  return (
    <div className="flex items-center gap-3 p-2.5 rounded-[14px] border border-divider bg-card">
      <Skeleton className="w-12 h-12 flex-shrink-0 rounded-tile" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3.5 w-2/3" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}

/** Stat card skeleton — matches <StatCard>. */
export function StatCardSkeleton(): React.JSX.Element {
  return (
    <div className="bg-card rounded-card border border-divider p-4 shadow-[var(--shadow-card)]">
      <Skeleton className="w-9 h-9" />
      <Skeleton className="h-6 w-14 mt-2.5" />
      <Skeleton className="h-3 w-20 mt-2" />
    </div>
  )
}

/** Simple full-page spinner (fallback). Optional label sits under the spinner. */
export function FullPageSpinner({ label }: { label?: string }): React.JSX.Element {
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
    <div className="flex flex-col gap-2">
      {Array.from({ length: rows }).map((_, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: skeleton rows have no meaningful key
        <ListItemSkeleton key={i} />
      ))}
    </div>
  )
}
