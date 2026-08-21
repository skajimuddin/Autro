// Loading — skeleton shimmer for the screens still on Tailwind.
//
// Migrated screens use MUI's <Skeleton> directly, so this shrinks as they go:
// the row-list skeleton left with /staff, and what remains is the stat-card
// shape /staff/attendance draws and the full-page spinner route guards use.
import type React from 'react'

interface SkeletonProps {
  className?: string
}

function Skeleton({ className = '' }: SkeletonProps): React.JSX.Element {
  return <div className={`animate-pulse bg-divider rounded-full ${className}`} />
}

// ── Preset skeleton layouts ──────────────────────────────────────────────────

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
