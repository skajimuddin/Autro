// StatCard — icon + number + label metric card
import type React from 'react'

interface StatCardProps {
  icon: React.ReactNode
  value: string | number
  label: string
  iconBg?: string
  id?: string
}

export function StatCard({ icon, value, label, iconBg = 'bg-primary-light', id }: StatCardProps): React.JSX.Element {
  return (
    <div
      id={id}
      className="bg-card rounded-card p-4 flex items-center gap-3 shadow-[var(--shadow-card)]"
    >
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xl font-bold text-text leading-none">{value}</p>
        <p className="text-xs text-text-muted mt-0.5 truncate">{label}</p>
      </div>
    </div>
  )
}
