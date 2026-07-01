import { describe, expect, it } from 'vitest'

import { createSkillTools } from '@/lib/agent/tools/skills/loadSkillTool'

const { loadSkill, listSkillFiles, readSkillFile } = createSkillTools()

describe('progressive-disclosure skill tools', () => {
  it('loads the full SKILL.md for an advertised skill id', async () => {
    const result = await loadSkill.execute({ id: 'experiment-lab-game' })

    expect(result.id).toBe('experiment-lab-game')
    expect(result.name.length).toBeGreaterThan(0)
    expect(result.description.length).toBeGreaterThan(0)
    expect(result.content).toContain('# ExperimentLab Game')
  })

  it('throws a clear error for an unknown skill id', async () => {
    await expect(loadSkill.execute({ id: 'does-not-exist' })).rejects.toThrow(
      /Unknown skill id: does-not-exist/,
    )
  })

  it('lists only support files under references/, assets/, scripts/', async () => {
    const { files } = await listSkillFiles.execute({ id: 'experiment-lab-game' })

    expect(files).toContain('references/model-contract.md')
    expect(files).toContain('references/validation-checklist.md')
    // SKILL.md is delivered via loadSkill, not the support-file listing.
    expect(files).not.toContain('SKILL.md')
    expect(files).toEqual([...files].sort())
  })

  it('reads a support file by relative path', async () => {
    const result = await readSkillFile.execute({
      id: 'experiment-lab-game',
      path: 'references/model-contract.md',
    })

    expect(result.path).toBe('references/model-contract.md')
    expect(result.content).toContain('ExperimentDefinition')
  })

  it('rejects paths outside references/, assets/, scripts/', async () => {
    await expect(
      readSkillFile.execute({ id: 'experiment-lab-game', path: 'SKILL.md' }),
    ).rejects.toThrow(/must start with one of: references, assets, scripts/)
  })

  it('rejects bare support-directory paths', async () => {
    await expect(
      readSkillFile.execute({ id: 'experiment-lab-game', path: 'references' }),
    ).rejects.toThrow(/must include a filename/)
  })

  it('rejects parent-segment traversal before touching the filesystem', async () => {
    await expect(
      readSkillFile.execute({
        id: 'experiment-lab-game',
        path: '../chemquest-lab-game/SKILL.md',
      }),
    ).rejects.toThrow(/must not contain empty, current, or parent segments/)
  })

  it('rejects absolute paths', async () => {
    await expect(
      readSkillFile.execute({ id: 'experiment-lab-game', path: '/tmp/secret.txt' }),
    ).rejects.toThrow(/path must be relative/)
  })

  it('returns a clear error for a missing support file', async () => {
    await expect(
      readSkillFile.execute({
        id: 'experiment-lab-game',
        path: 'references/missing-file.md',
      }),
    ).rejects.toThrow(/Skill file not found: references\/missing-file\.md/)
  })
})
