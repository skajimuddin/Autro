// Task 3.7 — Contact Picker API wrapper (progressive enhancement)
//
// The Contact Picker API (`navigator.contacts`) only exists on Chromium-based
// mobile browsers (Chrome/Edge on Android). Everywhere else — desktop, iOS
// Safari, Firefox — `navigator.contacts` is undefined. Every export here is
// guarded so callers can treat this as a pure enhancement, never a dependency.

interface ContactAddress {
  name?: string[]
  tel?: string[]
}

interface ContactsManager {
  select: (
    properties: Array<'name' | 'tel' | 'email' | 'address' | 'icon'>,
    options?: { multiple?: boolean }
  ) => Promise<ContactAddress[]>
}

declare global {
  interface Navigator {
    contacts?: ContactsManager
  }
}

export interface PickedContact {
  name: string
  phone: string
}

/** True only on browsers that implement the Contact Picker API. */
export function isContactPickerSupported(): boolean {
  return (
    typeof navigator !== 'undefined' &&
    'contacts' in navigator &&
    typeof window !== 'undefined' &&
    'ContactsManager' in window
  )
}

/**
 * Opens the device's native contact picker and resolves with the first
 * selected contact's name + phone number.
 *
 * Resolves `null` — never throws — when the browser doesn't support the API,
 * the user dismisses the picker, or they pick a contact with no name/phone.
 * Callers should treat `null` as "no-op", not an error.
 */
export async function pickContact(): Promise<PickedContact | null> {
  if (!isContactPickerSupported() || !navigator.contacts) return null

  try {
    const [contact] = await navigator.contacts.select(['name', 'tel'], {
      multiple: false,
    })
    if (!contact) return null

    const name = contact.name?.[0]?.trim() ?? ''
    const phone = contact.tel?.[0]?.trim() ?? ''
    if (!name && !phone) return null

    return { name, phone }
  } catch {
    // AbortError (user cancelled) or permission denial — not an error state.
    return null
  }
}
