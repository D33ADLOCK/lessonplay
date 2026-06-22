import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@/lib/db/queries', () => ({
  addGameVersion: vi.fn(),
  getChat: vi.fn(),
  setGameVersionDemoUrl: vi.fn(),
  updateChatTitle: vi.fn(),
  updateChatLatestHtml: vi.fn(),
}))

vi.mock('@/lib/storage', () => ({
  uploadGameHtml: vi.fn(),
  uploadTextObject: vi.fn(),
}))

import {
  clearLearnLoopDraftFiles,
  getLearnLoopDraftFileMap,
  listLearnLoopDraftFiles,
  normalizeLearnLoopDraftPath,
  writeLearnLoopDraftFiles,
} from '@/lib/agent/learn-loop-draft-store'
import { createGameTools } from '@/lib/agent/tools'

const CHAT_ID = 'chat-learn-loop'

describe('Learn Loop draft store', () => {
  beforeEach(() => {
    clearLearnLoopDraftFiles(CHAT_ID)
  })

  it('normalizes safe project-relative paths', () => {
    expect(normalizeLearnLoopDraftPath('src\\content\\missions.ts')).toBe(
      'src/content/missions.ts',
    )
  })

  it('writes multiple files and returns a sorted file list', () => {
    const files = writeLearnLoopDraftFiles({
      chatId: CHAT_ID,
      files: [
        { path: 'src/ui/App.tsx', content: 'export function App() {}' },
        { path: 'src/content/missions.ts', content: 'export const missions = []' },
      ],
    })

    expect(files.map((file) => file.path)).toEqual([
      'src/content/missions.ts',
      'src/ui/App.tsx',
    ])
    expect(getLearnLoopDraftFileMap(CHAT_ID)).toMatchObject({
      'src/content/missions.ts': 'export const missions = []',
      'src/ui/App.tsx': 'export function App() {}',
    })
  })

  it('replaces an existing file for the same chat', () => {
    writeLearnLoopDraftFiles({
      chatId: CHAT_ID,
      files: [{ path: 'src/main.tsx', content: 'old' }],
    })
    writeLearnLoopDraftFiles({
      chatId: CHAT_ID,
      files: [{ path: 'src/main.tsx', content: 'new' }],
    })

    expect(getLearnLoopDraftFileMap(CHAT_ID)).toEqual({ 'src/main.tsx': 'new' })
    expect(listLearnLoopDraftFiles(CHAT_ID)).toHaveLength(1)
  })

  it('keeps drafts isolated by chat id', () => {
    writeLearnLoopDraftFiles({
      chatId: CHAT_ID,
      files: [{ path: 'src/main.tsx', content: 'chat one' }],
    })
    writeLearnLoopDraftFiles({
      chatId: 'other-chat',
      files: [{ path: 'src/main.tsx', content: 'chat two' }],
    })

    expect(getLearnLoopDraftFileMap(CHAT_ID)).toEqual({ 'src/main.tsx': 'chat one' })
  })

  it('rejects paths outside the virtual project', () => {
    expect(() => normalizeLearnLoopDraftPath('/tmp/file.ts')).toThrow(/must be relative/)
    expect(() => normalizeLearnLoopDraftPath('../file.ts')).toThrow(/parent segments/)
    expect(() => normalizeLearnLoopDraftPath('src//file.ts')).toThrow(/empty/)
    expect(() => normalizeLearnLoopDraftPath('src/.secret.ts')).toThrow(/hidden/)
    expect(() => normalizeLearnLoopDraftPath('src/file.exe')).toThrow(/Unsupported/)
    expect(() => normalizeLearnLoopDraftPath('vite.config.ts')).toThrow(/src\/, tests\//)
  })

  it('allows approved root files', () => {
    expect(normalizeLearnLoopDraftPath('index.html')).toBe('index.html')
    expect(normalizeLearnLoopDraftPath('README.md')).toBe('README.md')
  })
})

describe('writeLearnLoopFiles tool', () => {
  beforeEach(() => {
    clearLearnLoopDraftFiles(CHAT_ID)
  })

  it('writes files into the current chat draft', async () => {
    const tools = createGameTools({ chatId: CHAT_ID, clerkUserId: 'user-1' })

    const result = await tools.writeLearnLoopFiles.execute({
      files: [{ path: 'tests/missions.test.ts', content: 'test("missions", () => {})' }],
    })

    expect(result).toMatchObject({
      ok: true,
      files: [{ path: 'tests/missions.test.ts' }],
    })
    expect(getLearnLoopDraftFileMap(CHAT_ID)).toEqual({
      'tests/missions.test.ts': 'test("missions", () => {})',
    })
  })
})
