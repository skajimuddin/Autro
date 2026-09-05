// Printable attendance QR — one A4 page meant to be printed and taped up at
// the workshop entrance. Deliberately separate from lib/pdf.ts: this isn't a
// business document (no owner PDF-template customisation applies to it) and
// it needs the QR rendered as a raster image rather than the numbers/text
// those documents are built from.
import { createElement as el } from 'react'
import QRCodeStyling from 'qr-code-styling'
import { BRAND } from '@/theme'
import { triggerDownload } from '@/lib/download-file'

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Could not read the generated QR code'))
    reader.readAsDataURL(blob)
  })
}

/**
 * Renders the token as a high-resolution PNG matching QRDisplay's look —
 * 800px so it stays sharp printed several inches across, larger than
 * anything shown on screen.
 */
async function qrCodeDataUrl(token: string): Promise<string> {
  const qr = new QRCodeStyling({
    width: 800,
    height: 800,
    type: 'canvas',
    data: token,
    image: '/icon-192.png',
    dotsOptions: { color: '#0f172a', type: 'extra-rounded' },
    cornersSquareOptions: { color: BRAND.light, type: 'extra-rounded' },
    cornersDotOptions: { color: '#0f172a', type: 'dot' },
    backgroundOptions: { color: '#ffffff' },
    imageOptions: { crossOrigin: 'anonymous', margin: 10, imageSize: 0.25 },
    qrOptions: { errorCorrectionLevel: 'H' },
  })

  const raw = await qr.getRawData('png')
  if (!(raw instanceof Blob)) {
    throw new Error('Could not generate the QR code image')
  }
  return blobToDataUrl(raw)
}

/**
 * Builds and downloads a single A4 page: the garage name, a large QR code,
 * and a one-line instruction — sized to print and stick on a wall.
 */
export async function downloadAttendanceQrPdf(garageName: string, token: string): Promise<void> {
  const { pdf, Document, Page, Text, View, Image, StyleSheet } = await import('@react-pdf/renderer')
  const qrDataUrl = await qrCodeDataUrl(token)

  const s = StyleSheet.create({
    page: {
      padding: 56,
      fontFamily: 'Helvetica',
      alignItems: 'center',
      justifyContent: 'center',
    },
    kicker: {
      fontSize: 11,
      color: '#64748b',
      letterSpacing: 2,
      textTransform: 'uppercase',
      fontFamily: 'Helvetica-Bold',
      marginBottom: 10,
    },
    title: {
      fontSize: 26,
      fontFamily: 'Helvetica-Bold',
      color: '#0f172a',
      textAlign: 'center',
      marginBottom: 32,
    },
    qrBox: {
      width: 320,
      height: 320,
      padding: 16,
      borderWidth: 1,
      borderColor: '#e2e8f0',
      borderRadius: 12,
    },
    qrImage: { width: '100%', height: '100%' },
    instruction: {
      fontSize: 13,
      color: '#334155',
      textAlign: 'center',
      marginTop: 36,
      lineHeight: 1.6,
      maxWidth: 320,
    },
    footer: {
      position: 'absolute',
      bottom: 40,
      fontSize: 9,
      color: '#94a3b8',
    },
  })

  const doc = el(
    Document,
    { title: `${garageName} — Attendance QR` },
    el(
      Page,
      { size: 'A4', style: s.page },
      el(Text, { style: s.kicker }, 'Scan to check in / check out'),
      el(Text, { style: s.title }, garageName),
      el(View, { style: s.qrBox }, el(Image, { src: qrDataUrl, style: s.qrImage })),
      el(
        Text,
        { style: s.instruction },
        'Open Autro on your phone, tap Check in, and scan this code. It only works while standing inside the workshop.',
      ),
      el(Text, { style: s.footer }, 'Autro · display this near the entrance'),
    ),
  )

  const blob = await pdf(doc).toBlob()
  const slug = garageName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'garage'
  triggerDownload(blob, `attendance-qr-${slug}.pdf`)
}
