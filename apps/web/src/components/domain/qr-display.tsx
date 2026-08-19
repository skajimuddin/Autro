// QRDisplay — renders the scannable attendance QR code (Task 6.3).
//
// PAYLOAD: the raw token string, nothing else. `POST /attendance/checkin`
// compares the submitted `qr_token` against the stored token with strict equality
// (apps/api/src/routes/attendance.ts:89), so the scanner in Task 6.4 can post the
// decoded text verbatim with no parsing step.
//
// A deep link (e.g. /checkin?token=…) was considered and rejected: /checkin sits
// behind RequireAuth, so scanning with a phone's native camera would only bounce
// an unauthenticated visitor to the login page. Staff scan from inside the app.
//
// Replaces the placeholder that rendered a decorative Lucide <QrCode> icon and
// the first 12 characters of the token — which was not scannable, meaning
// attendance could not work at all.
import React, { useEffect, useRef } from 'react'
import QRCodeStyling from 'qr-code-styling'

interface QRDisplayProps {
  /** The raw attendance token from GET /attendance/qr */
  token: string
  /** Rendered edge length in px */
  size?: number
  id?: string
}

export function QRDisplay({
  token,
  size = 208,
  id,
}: QRDisplayProps): React.JSX.Element {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return

    const qrCode = new QRCodeStyling({
      width: size,
      height: size,
      type: 'svg',
      data: token,
      image: '/icon-192.png',
      dotsOptions: {
        color: '#0f172a', // --color-text
        type: 'extra-rounded',
      },
      cornersSquareOptions: {
        color: '#2563eb', // --color-primary
        type: 'extra-rounded',
      },
      cornersDotOptions: {
        color: '#0f172a', // --color-text
        type: 'dot',
      },
      backgroundOptions: {
        color: '#ffffff',
      },
      imageOptions: {
        crossOrigin: 'anonymous',
        margin: 5,
        imageSize: 0.25, // <= 25% of QR area as requested
      },
      qrOptions: {
        errorCorrectionLevel: 'H',
      },
    })

    // Clear any existing QR code before appending
    ref.current.innerHTML = ''
    qrCode.append(ref.current)
  }, [token, size])

  return (
    // White padding supplies the quiet zone scanners need
    <div
      id={id}
      ref={ref}
      className="bg-white p-3 border border-border inline-flex items-center justify-center"
    />
  )
}
