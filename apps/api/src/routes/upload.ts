import { Hono } from 'hono'
import { AwsClient } from 'aws4fetch'
import { z } from 'zod'
import type { Env, Variables } from '@/env'
import { validateR2Env } from '@/env'

const uploadRouter = new Hono<{ Bindings: Env; Variables: Variables }>()

// This is a photo upload endpoint — vehicle condition photos, nothing else.
// The extension in the R2 key is derived from this map, never from the
// caller-supplied filename: a filename's "extension" is just whatever
// follows the last dot, and an attacker who controls that string controls
// a chunk of the object key (e.g. `filename: '../../x'` → ext `../../x`).
// Content-type is restricted to the same set so the bucket can't be used to
// host arbitrary files (an HTML upload served back with an attacker-chosen
// content-type is a stored-XSS vector on the R2 public host).
const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
}

const PresignRequestSchema = z.object({
  content_type: z.enum(
    Object.keys(EXTENSION_BY_CONTENT_TYPE) as [string, ...string[]],
    { message: 'content_type must be one of: ' + Object.keys(EXTENSION_BY_CONTENT_TYPE).join(', ') },
  ),
})

uploadRouter.post('/presign', async (c) => {
  // Without this, absent R2 credentials produce a URL signed with `undefined`
  // that fails opaquely at PUT time on the client. Fail here instead.
  validateR2Env(c.env)

  const tenantId = c.get('tenantId')
  const body = await c.req.json().catch(() => null)
  const parsed = PresignRequestSchema.safeParse(body)

  if (!parsed.success) {
    return c.json(
      { error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message } },
      400,
    )
  }

  const ext = EXTENSION_BY_CONTENT_TYPE[parsed.data.content_type]
  const fileKey = `${tenantId}/${crypto.randomUUID()}.${ext}`

  const aws = new AwsClient({
    accessKeyId: c.env.R2_ACCESS_KEY_ID,
    secretAccessKey: c.env.R2_SECRET_ACCESS_KEY,
  })

  const url = new URL(
    `https://${c.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${c.env.R2_BUCKET_NAME}/${fileKey}`,
  )

  const signedRequest = await aws.sign(url.toString(), {
    method: 'PUT',
    headers: {
      'Content-Type': parsed.data.content_type,
    },
    aws: { signQuery: true },
  })

  return c.json({
    upload_url: signedRequest.url,
    // Where the object will be readable once the PUT lands. This is what the
    // client stores against the vehicle, so it comes from configuration —
    // a bucket host baked into the source outlives the bucket.
    public_url: `${c.env.R2_PUBLIC_URL.replace(/\/$/, '')}/${fileKey}`,
  })
})

export default uploadRouter
