import 'server-only'

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { nanoid } from 'nanoid'

const BUCKET = 'GameBot'

let client: S3Client | null = null

function getS3Client() {
  if (client) {
    return client
  }

  const endpoint = process.env.SUPABASE_S3_ENDPOINT
  const region = process.env.SUPABASE_S3_REGION
  const accessKeyId = process.env.SUPABASE_S3_ACCESS_KEY_ID
  const secretAccessKey = process.env.SUPABASE_S3_SECRET_ACCESS_KEY

  if (!endpoint || !region || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'SUPABASE_S3_ENDPOINT, SUPABASE_S3_REGION, SUPABASE_S3_ACCESS_KEY_ID, and SUPABASE_S3_SECRET_ACCESS_KEY must be configured',
    )
  }

  client = new S3Client({
    endpoint,
    region,
    forcePathStyle: true,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
  })

  return client
}

export async function uploadGameHtml({
  chatId,
  html,
}: {
  chatId: string
  html: string
}): Promise<{ url: string; path: string }> {
  const s3 = getS3Client()
  const path = `${chatId}/${nanoid()}.html`

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: BUCKET,
        Key: path,
        Body: html,
        ContentType: 'text/html',
      }),
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to upload game HTML to storage: ${message}`)
  }

  const supabaseUrl = process.env.SUPABASE_URL

  if (!supabaseUrl) {
    throw new Error('SUPABASE_URL must be configured')
  }

  const baseUrl = supabaseUrl.replace(/\/+$/, '')
  const url = `${baseUrl}/storage/v1/object/public/${BUCKET}/${path}`

  return { url, path }
}
