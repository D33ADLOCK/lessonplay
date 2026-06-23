import { describe, expect, it } from 'vitest'

import {
  listChemQuestReferenceFiles,
  listLearnLoopReferenceFiles,
  readChemQuestReferenceFile,
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

describe('ChemQuest reference tools', () => {
  it('lists ChemQuest skill and reference files with stable relative paths', async () => {
    const files = await listChemQuestReferenceFiles()

    expect(files).toContain('SKILL.md')
    expect(files).toContain('references/template-contract.md')
    expect(files).toContain('references/scenario-contract.md')
    expect(files).toContain('references/presentation-contract.md')
    expect(files).toContain('references/implementation-pattern.md')
    expect(files).toContain('references/validation-checklist.md')
    expect(files).toEqual([...files].sort())
  })

  it('reads the ChemQuest skill file', async () => {
    await expect(readChemQuestReferenceFile('SKILL.md')).resolves.toContain(
      '# ChemQuest Lab Game',
    )
  })

  it('reads ChemQuest reference files', async () => {
    await expect(
      readChemQuestReferenceFile('references/template-contract.md'),
    ).resolves.toContain('ChemQuest Lab Template Contract')
  })

  it('rejects absolute ChemQuest paths', async () => {
    await expect(readChemQuestReferenceFile('/tmp/secret.txt')).rejects.toThrow(
      /path must be relative/,
    )
  })

  it('rejects paths that escape the ChemQuest reference root', async () => {
    await expect(
      readChemQuestReferenceFile('../learn-loop-chapter-game/SKILL.md'),
    ).rejects.toThrow(/escapes the allowed directory/)
  })

  it('returns a clear error for missing ChemQuest files', async () => {
    await expect(readChemQuestReferenceFile('missing-file.md')).rejects.toThrow(
      /ChemQuest reference file not found: missing-file\.md/,
    )
  })
})
