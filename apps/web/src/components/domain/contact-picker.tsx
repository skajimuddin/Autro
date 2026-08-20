// ContactPicker — fill the customer's name and number from the phone's
// address book, on the browsers that can.
//
// Renders null where the Contact Picker API doesn't exist (desktop, iOS
// Safari, Firefox), so unsupported browsers see nothing rather than a button
// that does nothing.
import { useCallback, useState } from 'react'
import type React from 'react'
import { Button, CircularProgress } from '@mui/material'
import ContactsIcon from '@mui/icons-material/ContactPhoneOutlined'

import { isContactPickerSupported, pickContact, type PickedContact } from '@/lib/contacts'

interface ContactPickerProps {
  onSelect: (contact: PickedContact) => void
}

export function ContactPicker({ onSelect }: ContactPickerProps): React.JSX.Element | null {
  const [picking, setPicking] = useState(false)

  const handleClick = useCallback(async () => {
    setPicking(true)
    try {
      const contact = await pickContact()
      if (contact) onSelect(contact)
    } finally {
      setPicking(false)
    }
  }, [onSelect])

  if (!isContactPickerSupported()) return null

  return (
    <Button
      size="small"
      disabled={picking}
      onClick={() => void handleClick()}
      startIcon={picking ? <CircularProgress size={13} /> : <ContactsIcon sx={{ fontSize: 15 }} />}
      // Sits in a field's label row, so it has to be smaller than a real
      // button and carry no weight of its own.
      sx={{ height: 22, minWidth: 0, px: 0.5, fontSize: 12 }}
    >
      Contacts
    </Button>
  )
}
