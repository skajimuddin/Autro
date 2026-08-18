// Task 3.7 — Contact Picker button (progressive enhancement)
//
// Screen 5 spec: "Customer Name + contact picker icon (shown only on
// supported browsers)". Renders null on any browser without the Contact
// Picker API, so unsupported browsers see nothing — no dead button, no
// layout shift from a disabled state.
import { useState, useCallback } from 'react'
import type React from 'react'

import { Loader2, Smartphone } from '@/components/ui/icons'
import { isContactPickerSupported, pickContact, type PickedContact } from '@/lib/contacts'

interface ContactPickerProps {
  onSelect: (contact: PickedContact) => void
}

export function ContactPicker({ onSelect }: ContactPickerProps): React.JSX.Element | null {
  const [isPicking, setIsPicking] = useState(false)

  const handleClick = useCallback(async () => {
    setIsPicking(true)
    try {
      const contact = await pickContact()
      if (contact) onSelect(contact)
    } finally {
      setIsPicking(false)
    }
  }, [onSelect])

  if (!isContactPickerSupported()) return null

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPicking}
      aria-label="Fill from contacts"
      title="Fill from contacts"
      className="shrink-0 h-[54px] w-[54px] flex items-center justify-center rounded-input border border-border bg-card text-text-muted hover:text-primary hover:border-primary transition-colors disabled:opacity-50"
    >
      {isPicking ? (
        <Loader2 size={18} className="animate-spin-fast" />
      ) : (
        <Smartphone size={18} />
      )}
    </button>
  )
}
