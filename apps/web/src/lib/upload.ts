// Photo upload — the one path a picture takes from a phone to a vehicle.
//
// Three steps that always go together: shrink the file, ask the API to sign a
// PUT, upload straight to R2. The Add Vehicle form and the vehicle detail
// screen both add photos, and the sequence is written once here so they cannot
// disagree about it (the detail screen previously had an Add photo button with
// nothing behind it at all).
import { apiFetch } from '@/lib/api'
import { compressImage } from '@/lib/image'

interface PresignResponse {
  upload_url: string
  /** Where the object will be readable once the PUT lands — this is what gets
   *  stored against the vehicle. */
  public_url: string
}

/**
 * Uploads one image and resolves with its public URL.
 *
 * Throws on failure — callers surface that to the owner rather than leaving a
 * photo silently missing.
 */
export async function uploadVehiclePhoto(
  file: File,
  tenantId: string | undefined,
): Promise<string> {
  // A modern phone camera produces 4–8 MB per shot. Compression is best-effort:
  // a browser without canvas/webp support still gets the photo uploaded.
  let payload = file
  try {
    payload = await compressImage(file)
  } catch (err) {
    console.error('Image compression failed, uploading the original', err)
  }

  const presigned = await apiFetch<PresignResponse>('/upload/presign', {
    method: 'POST',
    body: JSON.stringify({
      filename: payload.name || 'photo.jpg',
      content_type: payload.type || 'image/jpeg',
    }),
    tenantId,
  })

  const res = await fetch(presigned.upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': payload.type || 'image/jpeg' },
    body: payload,
  })

  if (!res.ok) {
    throw new Error('Could not upload the photo. Check your connection and try again.')
  }

  return presigned.public_url
}
