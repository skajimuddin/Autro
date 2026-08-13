// QRScanner — camera QR scanner for staff check-in (Task 6.4).
//
// Replaces `window.prompt('Enter QR Token (Simulating scan):')`, which required
// staff to type a 32-character token by hand.
//
// html5-qrcode is ~300 KB, so it is pulled in with a dynamic import() rather than
// a static one. It only loads when a staff member actually opens the scanner, and
// stays out of the initial bundle.
//
// Decoded text is passed through verbatim: qr-display.tsx encodes the raw token
// and POST /attendance/checkin compares it with strict equality.
import { useEffect, useRef, useState } from 'react'
import type React from 'react'
import { X } from '@/components/ui/icons'

import { Button } from '@/components/ui/button'

const SCANNER_ELEMENT_ID = 'qr-scanner-region'

interface QRScannerProps {
  /** Called with the decoded token once, then the scanner stops */
  onScan: (token: string) => void
  /** Camera unavailable / permission denied */
  onError: (message: string) => void
  onCancel: () => void
}

export function QRScanner({
  onScan,
  onError,
  onCancel,
}: QRScannerProps): React.JSX.Element {
  const [isStarting, setIsStarting] = useState(true)
  // Latest callbacks without re-running the start effect
  const handlersRef = useRef({ onScan, onError })
  handlersRef.current = { onScan, onError }

  useEffect(() => {
    // Guards against React's double-invoked effects in development and against
    // a decode landing after unmount.
    let cancelled = false
    let scanner: { stop: () => Promise<void>; clear: () => void } | null = null

    void (async () => {
      try {
        const { Html5Qrcode } = await import('html5-qrcode')
        if (cancelled) return

        const instance = new Html5Qrcode(SCANNER_ELEMENT_ID)
        scanner = instance

        await instance.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 240, height: 240 } },
          (decodedText) => {
            if (cancelled) return
            cancelled = true
            // Stop before handing control back so the camera light goes out even
            // if the caller immediately unmounts us.
            void instance
              .stop()
              .catch(() => undefined)
              .finally(() => handlersRef.current.onScan(decodedText))
          },
          // Per-frame decode misses fire constantly and are not errors.
          undefined,
        )

        if (cancelled) {
          void instance.stop().catch(() => undefined)
          return
        }
        setIsStarting(false)
      } catch (err: unknown) {
        if (cancelled) return
        const message =
          err instanceof Error
            ? err.message
            : 'Could not start the camera. Check camera permissions.'
        handlersRef.current.onError(message)
      }
    })()

    return () => {
      cancelled = true
      if (scanner) {
        void scanner
          .stop()
          .then(() => scanner?.clear())
          .catch(() => undefined)
      }
    }
  }, [])

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center gap-5 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Scan attendance QR code"
    >
      <div
        id={SCANNER_ELEMENT_ID}
        className="w-full max-w-sm rounded-2xl overflow-hidden bg-black"
      />

      <p className="text-white text-sm font-medium text-center">
        {isStarting
          ? 'Starting camera…'
          : 'Point your camera at the workshop QR code'}
      </p>

      <Button
        id="qr-scanner-cancel"
        variant="outline"
        fullWidth={false}
        leftIcon={<X size={16} />}
        onClick={onCancel}
        className="bg-white"
      >
        Cancel
      </Button>
    </div>
  )
}
