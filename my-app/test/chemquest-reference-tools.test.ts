import { describe, expect, it } from 'vitest'

import {
  listChemQuestReferenceFiles,
  readChemQuestReferenceFile,
} from '@/lib/agent/tools'

describe('ChemQuest reference tools', () => {
  it('lists ChemQuest skill, contract, and consolidated reference files', async () => {
    const files = await listChemQuestReferenceFiles()

    expect(files).toContain('SKILL.md')
    expect(files).toContain('references/template-contract.md')
    expect(files).toContain('references/scenario-contract.md')
    expect(files).toContain('references/presentation-contract.md')
    expect(files).toContain('references/implementation-pattern.md')
    expect(files).toContain('references/validation-checklist.md')
    // Core types and the working reference game were consolidated into the
    // ChemQuest skill so the build no longer depends on the deleted Learn Loop
    // skill.
    expect(files).toContain('references/learn-loop-core/src/model/sandboxLab.ts')
    expect(files).toContain(
      'references/mixture-methods-lab/src/content/missions.ts',
    )
    expect(files).not.toContain('references/mixture-methods-lab/.gitignore')
    expect(files).toEqual([...files].sort())
  })

  it('does not expose the deprecated guided-lab files', async () => {
    const files = await listChemQuestReferenceFiles()

    expect(files).not.toContain(
      'references/learn-loop-core/src/ui/GuidedLabViewport.tsx',
    )
    expect(files).not.toContain(
      'references/learn-loop-core/src/ui/useGuidedSession.ts',
    )
  })

  it('reads the ChemQuest skill file', async () => {
    await expect(readChemQuestReferenceFile('SKILL.md')).resolves.toContain(
      '# ChemQuest Lab Game',
    )
  })

  it('reads ChemQuest contract references', async () => {
    await expect(
      readChemQuestReferenceFile('references/template-contract.md'),
    ).resolves.toContain('ChemQuest Lab Template Contract')
  })

  it('reads a consolidated core model reference', async () => {
    await expect(
      readChemQuestReferenceFile(
        'references/learn-loop-core/src/model/sandboxLab.ts',
      ),
    ).resolves.toContain('SandboxLab')
  })

  it('rejects absolute ChemQuest paths', async () => {
    await expect(readChemQuestReferenceFile('/tmp/secret.txt')).rejects.toThrow(
      /path must be relative/,
    )
  })

  it('rejects paths that escape the ChemQuest reference root', async () => {
    await expect(
      readChemQuestReferenceFile('../designing-mini-games/SKILL.md'),
    ).rejects.toThrow(/escapes the allowed directory/)
  })

  it('returns a clear error for missing ChemQuest files', async () => {
    await expect(readChemQuestReferenceFile('missing-file.md')).rejects.toThrow(
      /ChemQuest reference file not found: missing-file\.md/,
    )
  })
})
