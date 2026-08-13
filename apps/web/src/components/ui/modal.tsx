// Modal — bottom sheet on mobile, centred dialog at md:+
//
// Known gap (not addressed here): no focus trap and focus is not restored to the
// trigger on close. Worth fixing before launch.
import { useEffect } from 'react'
import type React from 'react'
import { X } from '@/components/ui/icons'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  id?: string
}

export function Modal({ isOpen, onClose, title, children, id }: ModalProps): React.JSX.Element | null {
  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Dismiss on Escape key
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 z-40 animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom sheet on mobile, centred dialog at md:+ — one element, breakpoints
          only. Amended 2026-08-13 (was a fixed max-w-[414px] bottom sheet at all
          widths). */}
      <div
        id={id}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={[
          'fixed z-50 bg-card shadow-2xl',
          // Mobile: full-width sheet anchored to the bottom
          'bottom-0 left-0 right-0 rounded-t-[24px] animate-slide-in-top',
          'pb-[env(safe-area-inset-bottom,16px)]',
          // md+: centred dialog
          'md:inset-auto md:top-1/2 md:left-1/2 md:right-auto md:bottom-auto',
          'md:-translate-x-1/2 md:-translate-y-1/2',
          'md:w-full md:max-w-lg md:rounded-card md:animate-fade-in',
        ].join(' ')}
      >
        {/* Drag handle — mobile sheet affordance only */}
        <div className="flex justify-center pt-3 pb-1 md:hidden">
          <div className="w-10 h-1 rounded-full bg-divider" />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-5 py-3 md:pt-5 border-b border-divider">
            <h2 className="text-base font-semibold text-text">{title}</h2>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center text-text-muted hover:bg-bg transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="px-5 py-4 overflow-y-auto max-h-[70dvh]">
          {children}
        </div>
      </div>
    </>
  )
}
