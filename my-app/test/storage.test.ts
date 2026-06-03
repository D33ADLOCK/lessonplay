import { beforeEach, describe, expect, it, vi } from 'vitest'

const sendMock = vi.fn()
const s3ClientMock = vi.fn((..._args: unknown[]) => ({ send: sendMock }))
const putObjectCommandMock = vi.fn((input: unknown) => ({ input }))

vi.mock('@aws-sdk/client-s3', () => ({
  S3Client: class {
    constructor(...args: unknown[]) {
      return s3ClientMock(...args)
    }
  },
  PutObjectCommand: class {
    constructor(input: unknown) {
      return putObjectCommandMock(input)
    }
  },
}))

async function importStorage() {
  // Re-import fresh so the lazy singleton client is rebuilt per test.
  vi.resetModules()
  return import('@/lib/storage')
}

describe('uploadGameHtml', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.SUPABASE_URL = 'https://example.supabase.co'
    process.env.SUPABASE_S3_ENDPOINT =
      'https://example.storage.supabase.co/storage/v1/s3'
    process.env.SUPABASE_S3_REGION = 'ap-northeast-1'
    process.env.SUPABASE_S3_ACCESS_KEY_ID = 'access-key-id'
    process.env.SUPABASE_S3_SECRET_ACCESS_KEY = 'secret-access-key'
    sendMock.mockResolvedValue({})
  })

  it('sends a PutObjectCommand to the GameBot bucket at a per-chat .html key with text/html content type', async () => {
    const { uploadGameHtml } = await importStorage()

    const result = await uploadGameHtml({ chatId: 'chat-1', html: '<html></html>' })

    expect(sendMock).toHaveBeenCalledTimes(1)
    const [command] = putObjectCommandMock.mock.calls[0] as [
      {
        Bucket: string
        Key: string
        Body: string
        ContentType: string
      },
    ]

    expect(command.Bucket).toBe('GameBot')
    expect(command.Key).toMatch(/^chat-1\/[^/]+\.html$/)
    expect(command.Body).toBe('<html></html>')
    expect(command.ContentType).toBe('text/html')

    expect(result.path).toBe(command.Key)
    expect(result.url).toBe(
      `https://example.supabase.co/storage/v1/object/public/GameBot/${result.path}`,
    )
    expect(result.url).toMatch(
      /^https:\/\/example\.supabase\.co\/storage\/v1\/object\/public\/GameBot\/.+\.html$/,
    )
  })

  it('produces a unique path per call', async () => {
    const { uploadGameHtml } = await importStorage()

    const first = await uploadGameHtml({ chatId: 'chat-1', html: 'a' })
    const second = await uploadGameHtml({ chatId: 'chat-1', html: 'b' })

    expect(first.path).not.toBe(second.path)
    expect(first.path.startsWith('chat-1/')).toBe(true)
    expect(second.path.startsWith('chat-1/')).toBe(true)
  })

  it('throws when the S3 send rejects instead of returning an empty url', async () => {
    sendMock.mockRejectedValue(new Error('boom'))
    const { uploadGameHtml } = await importStorage()

    await expect(
      uploadGameHtml({ chatId: 'chat-1', html: '<html></html>' }),
    ).rejects.toThrow(/boom/)
  })
})
