// MobileContainer — centered page frame for standalone screens.
//
// Used by pages that sit OUTSIDE the main app shell and have no sidebar:
// staff check-in, invite acceptance, auth. PageShell has its own responsive
// shell (see page-shell.tsx) and deliberately does not use this.
//
// Amended 2026-08-13: the old hard `max-w-[414px]` cap is gone — see
// "Responsive Layout" in planning/final/05-ui-screens.md.
import type React from 'react'

interface MobileContainerProps {
  children: React.ReactNode
  className?: string
}

export function MobileContainer({
  children,
  className = '',
}: MobileContainerProps): React.JSX.Element {
  return (
    <div className="min-h-dvh bg-bg flex justify-center">
      <div className={`w-full max-w-md md:max-w-lg relative ${className}`}>
        {children}
      </div>
    </div>
  )
}
