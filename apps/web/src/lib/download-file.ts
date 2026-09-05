/**
 * Save a Blob to disk via a temporary anchor.
 *
 * The anchor is attached to the document before clicking (some browsers ignore
 * clicks on detached nodes) and the object URL is revoked on the next tick —
 * revoking synchronously can cancel the download mid-flight.
 *
 * Shared by every generated download (invoice/estimate PDFs, the printable
 * attendance QR) so they can't drift on this.
 */
export function triggerDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = filename
  anchor.style.display = 'none'
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
