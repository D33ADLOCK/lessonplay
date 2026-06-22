import { beforeEach, describe, expect, it, vi } from 'vitest'

const uploadTextObject = vi.fn(
  async ({ path }: { path: string; body: string; contentType: string }) => ({
    path,
    url: `https://pub-test.r2.dev/${path}`,
  }),
)

vi.mock('@/lib/storage', () => ({
  uploadTextObject: (input: { path: string; body: string; contentType: string }) =>
    uploadTextObject(input),
}))

import {
  clearLearnLoopDraftFiles,
  writeLearnLoopDraftFiles,
} from '@/lib/agent/learn-loop-draft-store'
import { persistLearnLoopSourceDraft } from '@/lib/agent/learn-loop-source-persistence'

const CHAT_ID = 'chat-source'

describe('persistLearnLoopSourceDraft', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    clearLearnLoopDraftFiles(CHAT_ID)
  })

  it('uploads every draft file and a manifest to a versioned R2 prefix', async () => {
    writeLearnLoopDraftFiles({
      chatId: CHAT_ID,
      files: [
        { path: 'src/main.tsx', content: 'import "./style.css"' },
        { path: 'src/style.css', content: 'body { margin: 0; }' },
      ],
    })

    const snapshot = await persistLearnLoopSourceDraft({
      chatId: CHAT_ID,
      snapshotId: 'snapshot-1',
    })

    expect(uploadTextObject).toHaveBeenCalledTimes(3)
    expect(uploadTextObject).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        path: 'learn-loop-sources/chat-source/snapshot-1/src/main.tsx',
        body: 'import "./style.css"',
        contentType: 'text/plain; charset=utf-8',
      }),
    )
    expect(uploadTextObject).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        path: 'learn-loop-sources/chat-source/snapshot-1/src/style.css',
        body: 'body { margin: 0; }',
        contentType: 'text/css; charset=utf-8',
      }),
    )
    expect(uploadTextObject).toHaveBeenNthCalledWith(
      3,
      expect.objectContaining({
        path: 'learn-loop-sources/chat-source/snapshot-1/manifest.json',
        contentType: 'application/json; charset=utf-8',
      }),
    )

    expect(snapshot).toMatchObject({
      chatId: CHAT_ID,
      snapshotId: 'snapshot-1',
      manifestKey: 'learn-loop-sources/chat-source/snapshot-1/manifest.json',
      manifestUrl:
        'https://pub-test.r2.dev/learn-loop-sources/chat-source/snapshot-1/manifest.json',
      files: [
        {
          path: 'src/main.tsx',
          key: 'learn-loop-sources/chat-source/snapshot-1/src/main.tsx',
          contentType: 'text/plain; charset=utf-8',
        },
        {
          path: 'src/style.css',
          key: 'learn-loop-sources/chat-source/snapshot-1/src/style.css',
          contentType: 'text/css; charset=utf-8',
        },
      ],
    })
  })

  it('writes a manifest that references the uploaded source files', async () => {
    writeLearnLoopDraftFiles({
      chatId: CHAT_ID,
      files: [{ path: 'src/content/missions.ts', content: 'export const missions = []' }],
    })

    await persistLearnLoopSourceDraft({ chatId: CHAT_ID, snapshotId: 'snapshot-2' })

    const manifestCall = uploadTextObject.mock.calls.at(-1)?.[0] as { body: string }
    const manifest = JSON.parse(manifestCall.body)

    expect(manifest).toMatchObject({
      chatId: CHAT_ID,
      snapshotId: 'snapshot-2',
      files: [
        {
          path: 'src/content/missions.ts',
          key: 'learn-loop-sources/chat-source/snapshot-2/src/content/missions.ts',
          url: 'https://pub-test.r2.dev/learn-loop-sources/chat-source/snapshot-2/src/content/missions.ts',
          contentType: 'text/plain; charset=utf-8',
        },
      ],
    })
    expect(manifest.files[0].size).toBe(Buffer.byteLength('export const missions = []'))
  })

  it('rejects empty drafts', async () => {
    await expect(
      persistLearnLoopSourceDraft({ chatId: CHAT_ID, snapshotId: 'snapshot-empty' }),
    ).rejects.toThrow(/no files/)
  })
})
