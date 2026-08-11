// MobileContainer — max-w-[414px] centered shell
import type React from 'react'

interface MobileContainerProps {
  children: React.ReactNode
  className?: string
}

export function MobileContainer({ children, className = '' }: MobileContainerProps): React.JSX.Element {
  return (
    <div className="min-h-dvh bg-bg flex justify-center">
      <div className={`w-full max-w-[414px] relative ${className}`}>
        {children}
      </div>
    </div>
  )
}
