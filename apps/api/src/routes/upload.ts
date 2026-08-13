import { Hono } from 'hono'
import { AwsClient } from 'aws4fetch'
import { z } from 'zod'
import type { Env, Variables } from '@/env'
import { validateR2Env } from '@/env'

const uploadRouter = new Hono<{ Bindings: Env; Variables: Variables }>()

const PresignRequestSchema = z.object({
  filename: z.string().min(1),
  content_type: z.string().min(1),
})

uploadRouter.post('/presign', async (c) => {
  // Without this, absent R2 credentials produce a URL signed with `undefined`
  // that fails opaquely at PUT time on the client. Fail here instead.
  validateR2Env(c.env)

  const tenantId = c.get('tenantId')
  const body = await c.req.json().catch(() => null)
  const parsed = PresignRequestSchema.safeParse(body)
  
  if (!parsed.success) {
    return c.json({ error: { code: 'VALIDATION_ERROR', message: parsed.error.issues[0]?.message } }, 400)
  }
  
  const ext = parsed.data.filename.split('.').pop()
  const fileKey = `${tenantId}/${crypto.randomUUID()}.${ext}`
  
  const aws = new AwsClient({
    accessKeyId: c.env.R2_ACCESS_KEY_ID,
    secretAccessKey: c.env.R2_SECRET_ACCESS_KEY,
  })
  
  const url = new URL(`https://${c.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${c.env.R2_BUCKET_NAME}/${fileKey}`)
  
  const signedRequest = await aws.sign(url.toString(), {
    method: 'PUT',
    headers: {
      'Content-Type': parsed.data.content_type
    },
    aws: { signQuery: true }
  })
  
  return c.json({
    upload_url: signedRequest.url,
    file_key: `r2://${fileKey}`
  })
})

export default uploadRouter
