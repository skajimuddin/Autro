// EmptyState — illustration + message when a list is empty
import type React from 'react'

interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps): React.JSX.Element {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 px-6 text-center">
      {icon && (
        <div className="w-16 h-16 rounded-2xl bg-bg flex items-center justify-center text-text-muted">
          {icon}
        </div>
      )}
      <p className="text-base font-semibold text-text">{title}</p>
      {description && (
        <p className="text-sm text-text-muted max-w-[260px] leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}
