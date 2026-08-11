// Toast — slide in from top, auto-dismiss
import { useEffect, useState } from 'react'
import type React from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

type ToastVariant = 'success' | 'error'

export interface ToastMessage {
  id: string
  variant: ToastVariant
  message: string
}

interface ToastItemProps {
  toast: ToastMessage
  onDismiss: (id: string) => void
}

function ToastItem({ toast, onDismiss }: ToastItemProps): React.JSX.Element {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 3500)
    return () => clearTimeout(timer)
  }, [toast.id, onDismiss])

  const isSuccess = toast.variant === 'success'

  return (
    <div
      role="alert"
      aria-live="polite"
      className={[
        'flex items-center gap-3 px-4 py-3 rounded-card text-sm font-medium shadow-lg animate-slide-in-top',
        isSuccess
          ? 'bg-success text-white'
          : 'bg-danger text-white',
      ].join(' ')}
    >
      {isSuccess ? <CheckCircle size={18} className="flex-shrink-0" /> : <XCircle size={18} className="flex-shrink-0" />}
      <span className="flex-1">{toast.message}</span>
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        className="text-white/80 hover:text-white transition-colors flex-shrink-0"
        aria-label="Dismiss"
      >
        <X size={16} />
      </button>
    </div>
  )
}

// ── Toast Container (render at root) ──────────────────────────────────────────
interface ToastContainerProps {
  toasts: ToastMessage[]
  onDismiss: (id: string) => void
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps): React.JSX.Element {
  return (
    <div
      id="toast-container"
      aria-label="Notifications"
      className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 w-[calc(100%-2rem)] max-w-[380px]"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  )
}

// ── useToast hook ─────────────────────────────────────────────────────────────
export function useToast(): {
  toasts: ToastMessage[]
  showToast: (variant: ToastVariant, message: string) => void
  dismissToast: (id: string) => void
} {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const showToast = (variant: ToastVariant, message: string) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, variant, message }])
  }

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }

  return { toasts, showToast, dismissToast }
}
