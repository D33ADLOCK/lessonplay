import 'server-only'

import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { nanoid } from 'nanoid'

let client: S3Client | null = null

function getS3Client() {
  if (client) {
    return client
  }

  const endpoint = process.env.R2_S3_ENDPOINT
  const region = process.env.R2_S3_REGION ?? 'auto'
  const accessKeyId = process.env.R2_ACCESS_KEY_ID
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY

  if (!endpoint || !accessKeyId || !secretAccessKey) {
    throw new Error(
      'R2_S3_ENDPOINT, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY must be configured',
    )
  }

  client = new S3Client({
    endpoint,
    region,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  })

  return client
}

function getPublicUrl(path: string) {
  const publicBaseUrl = process.env.R2_PUBLIC_BASE_URL

  if (!publicBaseUrl) {
    throw new Error('R2_PUBLIC_BASE_URL must be configured')
  }

  const baseUrl = publicBaseUrl.replace(/\/+$/, '')
  return `${baseUrl}/${path}`
}

export async function uploadTextObject({
  path,
  body,
  contentType,
}: {
  path: string
  body: string
  contentType: string
}): Promise<{ url: string; path: string }> {
  const bucket = process.env.R2_BUCKET_NAME ?? 'animeroom'
  const s3 = getS3Client()

  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: path,
        Body: body,
        ContentType: contentType,
      }),
    )
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to upload text object to storage: ${message}`)
  }

  return { url: getPublicUrl(path), path }
}

export async function uploadGameHtml({
  chatId,
  html,
}: {
  chatId: string
  html: string
}): Promise<{ url: string; path: string }> {
  const path = `${chatId}/${nanoid()}.html`

  try {
    return await uploadTextObject({ path, body: html, contentType: 'text/html' })
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to upload game HTML to storage: ${message}`)
  }
}
