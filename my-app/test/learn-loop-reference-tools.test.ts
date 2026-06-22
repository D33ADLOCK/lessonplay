import { describe, expect, it } from 'vitest'

import {
  listLearnLoopReferenceFiles,
  readLearnLoopReferenceFile,
} from '@/lib/agent/tools'

describe('Learn Loop reference tools', () => {
  it('lists Learn Loop skill and reference files with stable relative paths', async () => {
    const files = await listLearnLoopReferenceFiles()

    expect(files).toContain('SKILL.md')
    expect(files).toContain('references/learn-loop-core/src/model/sandboxLab.ts')
    expect(files).toContain('references/mixture-methods-lab/src/content/missions.ts')
    expect(files).not.toContain('references/mixture-methods-lab/.gitignore')
    expect(files).toEqual([...files].sort())
  })

  it('reads the Learn Loop skill file', async () => {
    await expect(readLearnLoopReferenceFile('SKILL.md')).resolves.toContain(
      '# Learn Loop Chapter Game',
    )
  })

  it('reads Learn Loop reference source files', async () => {
    await expect(
      readLearnLoopReferenceFile('references/learn-loop-core/src/model/sandboxLab.ts'),
    ).resolves.toContain('SandboxLab')
  })

  it('rejects absolute paths', async () => {
    await expect(readLearnLoopReferenceFile('/tmp/secret.txt')).rejects.toThrow(
      /path must be relative/,
    )
  })

  it('rejects paths that escape the Learn Loop reference root', async () => {
    await expect(
      readLearnLoopReferenceFile('../designing-one-button-games/SKILL.md'),
    ).rejects.toThrow(/escapes the allowed directory/)
  })

  it('returns a clear error for missing files', async () => {
    await expect(readLearnLoopReferenceFile('missing-file.md')).rejects.toThrow(
      /Learn Loop reference file not found: missing-file\.md/,
    )
  })
})
