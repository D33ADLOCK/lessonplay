import { mkdtemp, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  bundleLearnLoopDraft,
  listTempLearnLoopBuildDirs,
} from '@/lib/agent/learn-loop-bundler'
import {
  clearLearnLoopDraftFiles,
  writeLearnLoopDraftFiles,
} from '@/lib/agent/learn-loop-draft-store'

const CHAT_ID = 'chat-bundler'

let tempParentDir: string

describe('bundleLearnLoopDraft', () => {
  beforeEach(async () => {
    clearLearnLoopDraftFiles(CHAT_ID)
    tempParentDir = await mkdtemp(path.join(os.tmpdir(), 'learn-loop-bundler-test-'))
  })

  afterEach(async () => {
    clearLearnLoopDraftFiles(CHAT_ID)
    await rm(tempParentDir, { recursive: true, force: true })
  })

  it('bundles a React/Learn Loop draft into one inline HTML document', async () => {
    writeLearnLoopDraftFiles({
      chatId: CHAT_ID,
      files: [
        {
          path: 'src/main.tsx',
          content: `
            import React from 'react'
            import { createRoot } from 'react-dom/client'
            import { SANDBOX_LAB_EFFECT_TAGS } from '@learn-loop/core'
            import '@learn-loop/core/ui/styles.css'
            import './style.css'

            function App() {
              return <main className="test-app">{SANDBOX_LAB_EFFECT_TAGS[0]}</main>
            }

            createRoot(document.getElementById('root')!).render(<App />)
          `,
        },
        {
          path: 'src/style.css',
          content: '.test-app { color: rgb(12, 34, 56); }',
        },
      ],
    })

    const html = await bundleLearnLoopDraft({
      chatId: CHAT_ID,
      title: 'Mixture Mission',
      tempParentDir,
    })

    expect(html).toContain('<title>Mixture Mission</title>')
    expect(html).toContain('<script type="module">')
    expect(html).toContain('<style>')
    expect(html).toContain('rgb(12, 34, 56)')
    expect(html).not.toMatch(/src="\/assets\//)
    expect(html).not.toMatch(/href="\/assets\//)
    await expect(listTempLearnLoopBuildDirs(tempParentDir)).resolves.toEqual([])
  })

  it('bundles drafts that import the Learn Loop template package and styles', async () => {
    writeLearnLoopDraftFiles({
      chatId: CHAT_ID,
      files: [
        {
          path: 'src/main.tsx',
          content: `
            import React from 'react'
            import { createRoot } from 'react-dom/client'
            import {
              LEARN_LOOP_TEMPLATE_PALETTES,
              normalizeLearnLoopTemplateConfig,
            } from '@learn-loop/template'
            import '@learn-loop/template/styles.css'

            const { config } = normalizeLearnLoopTemplateConfig({
              theme: { palette: 'clean-lab', accent: 'green' },
            })

            function App() {
              return (
                <main className="template-test">
                  {LEARN_LOOP_TEMPLATE_PALETTES[0]}:{config.theme.accent}
                </main>
              )
            }

            createRoot(document.getElementById('root')!).render(<App />)
          `,
        },
      ],
    })

    const html = await bundleLearnLoopDraft({
      chatId: CHAT_ID,
      title: 'ChemQuest Alias Test',
      tempParentDir,
    })

    expect(html).toContain('<title>ChemQuest Alias Test</title>')
    expect(html).toContain('clean-lab')
    expect(html).toContain('learn-loop-template')
    expect(html).not.toMatch(/src="\/assets\//)
    expect(html).not.toMatch(/href="\/assets\//)
    await expect(listTempLearnLoopBuildDirs(tempParentDir)).resolves.toEqual([])
  })

  it('bundles drafts that import the ExperimentLab viewport and dark-glow CSS', async () => {
    writeLearnLoopDraftFiles({
      chatId: CHAT_ID,
      files: [
        {
          path: 'src/main.tsx',
          content: `
            import React from 'react'
            import { createRoot } from 'react-dom/client'
            import {
              EXPERIMENT_LAB_PALETTES,
              experimentLabThemeClasses,
            } from '@learn-loop/core/ui'
            import '@learn-loop/core/ui/experiment.css'

            function App() {
              return (
                <main className={experimentLabThemeClasses({ accent: 'violet' })}>
                  {EXPERIMENT_LAB_PALETTES[0]}
                </main>
              )
            }

            createRoot(document.getElementById('root')!).render(<App />)
          `,
        },
      ],
    })

    const html = await bundleLearnLoopDraft({
      chatId: CHAT_ID,
      title: 'ExperimentLab Alias Test',
      tempParentDir,
    })

    expect(html).toContain('<title>ExperimentLab Alias Test</title>')
    expect(html).toContain('xl-accent-violet')
    expect(html).toContain('night-lab')
    // The dark-glow stylesheet resolved through the experiment.css alias and was
    // inlined, not the SandboxLab skin.
    expect(html).toContain('experiment-lab-app')
    expect(html).not.toMatch(/href="\/assets\//)
    await expect(listTempLearnLoopBuildDirs(tempParentDir)).resolves.toEqual([])
  })

  it('blocks publishing an ExperimentLab game the validator rejects', async () => {
    writeLearnLoopDraftFiles({
      chatId: CHAT_ID,
      files: [
        {
          path: 'src/content/game.ts',
          content: `
            // A structurally invalid ExperimentGame: a rule points at a tool that
            // does not exist, so validateExperimentMission must reject it.
            export const game = {
              id: 'broken-exp',
              title: 'Broken Experiment',
              definition: {
                samples: [
                  { id: 's1', label: 'S1', properties: { size: 'big' }, category: 'a' },
                ],
                tools: [{ id: 'light', label: 'Light' }],
                ruleSet: {
                  rules: [
                    {
                      toolId: 'ghost',
                      when: {},
                      effect: { observationId: 'x', observation: 'x', visual: 'none' },
                    },
                  ],
                  defaultEffect: {
                    observationId: 'none',
                    observation: 'none',
                    visual: 'none',
                  },
                },
              },
              categories: [{ id: 'a', label: 'A' }],
              levels: [
                {
                  id: 'l1',
                  title: 'L',
                  intro: 'i',
                  outro: 'o',
                  sampleIds: ['s1'],
                  toolIds: ['light'],
                  goal: { classifyIds: ['s1'], categoryIds: ['a'] },
                  scaffolding: 'open',
                  predictionRequired: false,
                  hints: [],
                },
              ],
            }
          `,
        },
        { path: 'src/main.tsx', content: 'export {}' },
      ],
    })

    await expect(
      bundleLearnLoopDraft({
        chatId: CHAT_ID,
        title: 'Broken Experiment',
        tempParentDir,
      }),
    ).rejects.toThrow(/Experiment "broken-exp"/)
    await expect(listTempLearnLoopBuildDirs(tempParentDir)).resolves.toEqual([])
  })

  it('cleans up the temp build directory when Vite fails', async () => {
    writeLearnLoopDraftFiles({
      chatId: CHAT_ID,
      files: [{ path: 'src/main.tsx', content: 'export const broken = ' }],
    })

    await expect(
      bundleLearnLoopDraft({ chatId: CHAT_ID, title: 'Broken', tempParentDir }),
    ).rejects.toThrow()
    await expect(listTempLearnLoopBuildDirs(tempParentDir)).resolves.toEqual([])
  })
})
