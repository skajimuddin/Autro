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
import type React from 'react'
import { QRCodeSVG } from 'qrcode.react'

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
  return (
    // White padding supplies the quiet zone scanners need, so marginSize is 0.
    <div
      id={id}
      className="bg-white p-3 border border-border inline-flex items-center justify-center"
    >
      <QRCodeSVG
        value={token}
        size={size}
        level="M"
        marginSize={0}
        bgColor="#ffffff"
        fgColor="#0f172a"
        title="Attendance QR code"
      />
    </div>
  )
}
