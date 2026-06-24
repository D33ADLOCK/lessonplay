import { beforeEach, describe, expect, it, vi } from 'vitest'

const getChatMetadata = vi.fn()
const addGameVersion = vi.fn()
const updateChatTitle = vi.fn()
const updateChatLatestHtml = vi.fn()
const setGameVersionDemoUrl = vi.fn()
const uploadGameHtml = vi.fn()
const uploadTextObject = vi.fn(
  async ({ path }: { path: string; body: string; contentType: string }) => ({
    path,
    url: `https://pub-test.r2.dev/${path}`,
  }),
)
const bundleLearnLoopDraft = vi.fn()
const formatLearnLoopBuildError = vi.fn((error: unknown) =>
  error instanceof Error ? error.message : String(error),
)

vi.mock('@/lib/db/queries', () => ({
  getChatMetadata: (...a: unknown[]) => getChatMetadata(...a),
  addGameVersion: (...a: unknown[]) => addGameVersion(...a),
  updateChatTitle: (...a: unknown[]) => updateChatTitle(...a),
  updateChatLatestHtml: (...a: unknown[]) => updateChatLatestHtml(...a),
  setGameVersionDemoUrl: (...a: unknown[]) => setGameVersionDemoUrl(...a),
}))

vi.mock('@/lib/storage', () => ({
  uploadGameHtml: (...a: unknown[]) => uploadGameHtml(...a),
  uploadTextObject: (input: { path: string; body: string; contentType: string }) =>
    uploadTextObject(input),
}))

vi.mock('@/lib/agent/learn-loop-bundler', () => ({
  bundleLearnLoopDraft: (...a: unknown[]) => bundleLearnLoopDraft(...a),
  formatLearnLoopBuildError: (error: unknown) => formatLearnLoopBuildError(error),
}))

// Avoid the filesystem-reading side effects of the real skills module.
vi.mock('@/lib/agent/skills', () => ({
  SKILLS_DIR: '/tmp/skills',
}))

import { createGameTools } from '@/lib/agent/tools'
import {
  clearLearnLoopDraftFiles,
  writeLearnLoopDraftFiles,
} from '@/lib/agent/learn-loop-draft-store'

const CHAT_ID = 'chat-123'
const USER_ID = 'user-abc'
const DEMO_URL =
  'https://example.supabase.co/storage/v1/object/public/GameBot/chat-123/abc.html'

function getPublishGame() {
  const tools = createGameTools({ chatId: CHAT_ID, clerkUserId: USER_ID })
  return tools.publishGame
}

describe('publishGame', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    getChatMetadata.mockResolvedValue({ id: CHAT_ID })
    addGameVersion.mockResolvedValue({ id: 'version-1' })
    updateChatTitle.mockResolvedValue({ id: CHAT_ID })
    updateChatLatestHtml.mockResolvedValue({ id: CHAT_ID })
    setGameVersionDemoUrl.mockResolvedValue({ id: 'version-1', demoUrl: DEMO_URL })
    uploadGameHtml.mockResolvedValue({ url: DEMO_URL, path: 'chat-123/abc.html' })
    uploadTextObject.mockImplementation(
      async ({ path }: { path: string; body: string; contentType: string }) => ({
        path,
        url: `https://pub-test.r2.dev/${path}`,
      }),
    )
    bundleLearnLoopDraft.mockResolvedValue('<html>learn loop</html>')
    clearLearnLoopDraftFiles(CHAT_ID)
  })

  it('writes the version + chat html, uploads, and persists the returned demo url', async () => {
    const publishGame = getPublishGame()

    const result = await publishGame.execute({
      title: 'My Game',
      html: '<html>game</html>',
    })

    expect(addGameVersion).toHaveBeenCalledWith({
      chatId: CHAT_ID,
      clerkUserId: USER_ID,
      title: 'My Game',
      html: '<html>game</html>',
    })
    expect(updateChatLatestHtml).toHaveBeenCalledWith({
      id: CHAT_ID,
      clerkUserId: USER_ID,
      latestHtml: '<html>game</html>',
    })
    expect(uploadGameHtml).toHaveBeenCalledWith({
      chatId: CHAT_ID,
      html: '<html>game</html>',
    })
    expect(setGameVersionDemoUrl).toHaveBeenCalledWith({
      versionId: 'version-1',
      chatId: CHAT_ID,
      clerkUserId: USER_ID,
      demoUrl: DEMO_URL,
    })

    expect(result).toMatchObject({ ok: true, versionId: 'version-1', demoUrl: DEMO_URL })
  })

  it('surfaces a storage failure as an error instead of a silent published-but-blank state', async () => {
    uploadGameHtml.mockRejectedValue(new Error('upload exploded'))
    const publishGame = getPublishGame()

    await expect(
      publishGame.execute({ title: 'My Game', html: '<html>game</html>' }),
    ).rejects.toThrow(/upload exploded/)

    // The demo url is never persisted when upload fails.
    expect(setGameVersionDemoUrl).not.toHaveBeenCalled()
  })
})

describe('publishLearnLoopGame', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearLearnLoopDraftFiles(CHAT_ID)
    getChatMetadata.mockResolvedValue({ id: CHAT_ID })
    addGameVersion.mockResolvedValue({ id: 'version-learn-loop' })
    setGameVersionDemoUrl.mockResolvedValue({ id: 'version-learn-loop', demoUrl: DEMO_URL })
    uploadGameHtml.mockResolvedValue({ url: DEMO_URL, path: 'chat-123/learn-loop.html' })
    uploadTextObject.mockImplementation(
      async ({ path }: { path: string; body: string; contentType: string }) => ({
        path,
        url: `https://pub-test.r2.dev/${path}`,
      }),
    )
    bundleLearnLoopDraft.mockResolvedValue('<html>learn loop</html>')
  })

  it('persists source, bundles, uploads final HTML, and stores source metadata', async () => {
    writeLearnLoopDraftFiles({
      chatId: CHAT_ID,
      files: [{ path: 'src/main.tsx', content: 'main' }],
    })
    const tools = createGameTools({ chatId: CHAT_ID, clerkUserId: USER_ID })

    const result = await tools.publishLearnLoopGame.execute({ title: 'Learn Loop Lab' })

    expect(uploadTextObject).toHaveBeenCalledWith(
      expect.objectContaining({
        path: expect.stringMatching(
          /^learn-loop-sources\/chat-123\/.+\/src\/main\.tsx$/,
        ),
        body: 'main',
      }),
    )
    expect(bundleLearnLoopDraft).toHaveBeenCalledWith({
      chatId: CHAT_ID,
      title: 'Learn Loop Lab',
    })
    expect(addGameVersion).toHaveBeenCalledWith({
      chatId: CHAT_ID,
      clerkUserId: USER_ID,
      title: 'Learn Loop Lab',
      html: '<html>learn loop</html>',
      sourceSnapshotId: expect.any(String),
      sourceManifestKey: expect.stringMatching(
        /^learn-loop-sources\/chat-123\/.+\/manifest\.json$/,
      ),
      sourceManifestUrl: expect.stringMatching(
        /^https:\/\/pub-test\.r2\.dev\/learn-loop-sources\/chat-123\/.+\/manifest\.json$/,
      ),
    })
    expect(uploadGameHtml).toHaveBeenCalledWith({
      chatId: CHAT_ID,
      html: '<html>learn loop</html>',
    })
    expect(setGameVersionDemoUrl).toHaveBeenCalledWith({
      versionId: 'version-learn-loop',
      chatId: CHAT_ID,
      clerkUserId: USER_ID,
      demoUrl: DEMO_URL,
    })
    expect(result).toMatchObject({
      ok: true,
      versionId: 'version-learn-loop',
      demoUrl: DEMO_URL,
      snapshot: { manifestKey: expect.stringContaining('/manifest.json') },
    })
  })

  it('returns a build error with snapshot metadata and does not publish final HTML', async () => {
    writeLearnLoopDraftFiles({
      chatId: CHAT_ID,
      files: [{ path: 'src/main.tsx', content: 'broken' }],
    })
    bundleLearnLoopDraft.mockRejectedValue(new Error('vite exploded'))
    const tools = createGameTools({ chatId: CHAT_ID, clerkUserId: USER_ID })

    const result = await tools.publishLearnLoopGame.execute({ title: 'Broken Lab' })

    expect(result).toMatchObject({
      ok: false,
      error: 'vite exploded',
      snapshot: { manifestKey: expect.stringContaining('/manifest.json') },
    })
    expect(addGameVersion).not.toHaveBeenCalled()
    expect(uploadGameHtml).not.toHaveBeenCalled()
    expect(setGameVersionDemoUrl).not.toHaveBeenCalled()
  })
})
