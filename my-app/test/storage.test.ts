import { beforeEach, describe, expect, it, vi } from 'vitest'

const uploadMock = vi.fn()
const getPublicUrlMock = vi.fn()
const fromMock = vi.fn(() => ({
  upload: uploadMock,
  getPublicUrl: getPublicUrlMock,
}))
const createClientMock = vi.fn((..._args: unknown[]) => ({
  storage: { from: fromMock },
}))

vi.mock('@supabase/supabase-js', () => ({
  createClient: (...args: unknown[]) => createClientMock(...args),
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
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'service-role-key'
    uploadMock.mockResolvedValue({ data: { path: 'ok' }, error: null })
    getPublicUrlMock.mockReturnValue({
      data: {
        publicUrl:
          'https://example.supabase.co/storage/v1/object/public/GameBot/chat-1/abc.html',
      },
    })
  })

  it('uploads to the GameBot bucket at a per-chat .html path with text/html content type', async () => {
    const { uploadGameHtml } = await importStorage()

    const result = await uploadGameHtml({ chatId: 'chat-1', html: '<html></html>' })

    expect(fromMock).toHaveBeenCalledWith('GameBot')
    expect(getPublicUrlMock).toHaveBeenCalledWith(result.path)

    const [uploadPath, uploadBody, uploadOpts] = uploadMock.mock.calls[0]
    expect(uploadPath).toMatch(/^chat-1\/[^/]+\.html$/)
    expect(uploadBody).toBe('<html></html>')
    expect(uploadOpts).toMatchObject({ contentType: 'text/html', upsert: false })

    expect(result.path).toBe(uploadPath)
    expect(result.url).toMatch(/^https:\/\/.+\/GameBot\/.+\.html$/)
  })

  it('produces a unique path per call', async () => {
    const { uploadGameHtml } = await importStorage()

    const first = await uploadGameHtml({ chatId: 'chat-1', html: 'a' })
    const second = await uploadGameHtml({ chatId: 'chat-1', html: 'b' })

    expect(first.path).not.toBe(second.path)
    expect(first.path.startsWith('chat-1/')).toBe(true)
    expect(second.path.startsWith('chat-1/')).toBe(true)
  })

  it('throws when the upload fails instead of returning an empty url', async () => {
    uploadMock.mockResolvedValue({ data: null, error: { message: 'boom' } })
    const { uploadGameHtml } = await importStorage()

    await expect(
      uploadGameHtml({ chatId: 'chat-1', html: '<html></html>' }),
    ).rejects.toThrow(/boom/)
  })
})
