import { beforeEach, describe, expect, it, vi } from 'vitest'

const getChat = vi.fn()
const addGameVersion = vi.fn()
const updateChatTitle = vi.fn()
const updateChatLatestHtml = vi.fn()
const setGameVersionDemoUrl = vi.fn()
const uploadGameHtml = vi.fn()

vi.mock('@/lib/db/queries', () => ({
  getChat: (...a: unknown[]) => getChat(...a),
  addGameVersion: (...a: unknown[]) => addGameVersion(...a),
  updateChatTitle: (...a: unknown[]) => updateChatTitle(...a),
  updateChatLatestHtml: (...a: unknown[]) => updateChatLatestHtml(...a),
  setGameVersionDemoUrl: (...a: unknown[]) => setGameVersionDemoUrl(...a),
}))

vi.mock('@/lib/storage', () => ({
  uploadGameHtml: (...a: unknown[]) => uploadGameHtml(...a),
}))

// Avoid the filesystem-reading side effects of the real skills module.
vi.mock('@/lib/agent/skills', () => ({
  SKILLS_DIR: '/tmp/skills',
}))

import { createGameTools } from '@/lib/agent/tools'

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
    getChat.mockResolvedValue({ id: CHAT_ID })
    addGameVersion.mockResolvedValue({ id: 'version-1' })
    updateChatTitle.mockResolvedValue({ id: CHAT_ID })
    updateChatLatestHtml.mockResolvedValue({ id: CHAT_ID })
    setGameVersionDemoUrl.mockResolvedValue({ id: 'version-1', demoUrl: DEMO_URL })
    uploadGameHtml.mockResolvedValue({ url: DEMO_URL, path: 'chat-123/abc.html' })
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
