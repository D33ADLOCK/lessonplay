import { describe, expect, it } from 'vitest'

import { REQUIRED_SKILLS, SYSTEM_PROMPT } from '@/lib/agent/skills'

describe('agent skill routing', () => {
  it('uses one sequential game creator instead of separate planner and builder agents', () => {
    expect(REQUIRED_SKILLS).not.toContain('chemistry-concept-planner')
    expect(REQUIRED_SKILLS).toContain('designing-one-button-games')
    expect(REQUIRED_SKILLS).toContain('implementing-gameplay-invariants')
    expect(REQUIRED_SKILLS).toContain('evaluating-gameplay-balance')
    expect(REQUIRED_SKILLS).toContain('maximizing-game-feel')
    expect(REQUIRED_SKILLS).toContain('chemquest-lab-game')
    expect(SYSTEM_PROMPT).toContain('You are one agent with one sequential job')
    expect(SYSTEM_PROMPT).toContain('Do not act like separate planner and builder agents')
  })

  it('requires the agent to plan first and stop before implementation', () => {
    expect(SYSTEM_PROMPT).toContain('If there is no current game plan in the conversation, create a plan and stop')
    expect(SYSTEM_PROMPT).toContain('Do not write files, do not call publishing tools')
    expect(SYSTEM_PROMPT).toContain('If the input is a PDF, chapter, textbook passage, or long attachment')
    expect(SYSTEM_PROMPT).toContain('break it into 1 to 3 atomic, playable concepts')
    expect(SYSTEM_PROMPT).toContain('# Chemistry Game Plan')
  })

  it('requires build requests to use tools instead of repeating the plan', () => {
    expect(SYSTEM_PROMPT).toContain('If there is a current game plan and the latest user message asks to build')
    expect(SYSTEM_PROMPT).toContain('Do not repeat the plan')
    expect(SYSTEM_PROMPT).toContain('Never answer a build request with another unchanged plan')
    expect(SYSTEM_PROMPT).toContain('writeLearnLoopFiles')
    expect(SYSTEM_PROMPT).toContain('publishLearnLoopGame')
  })

  it('restores the game quality bar for generated games', () => {
    expect(SYSTEM_PROMPT).toContain('A correct but boring game')
    expect(SYSTEM_PROMPT).toContain('meaningful choice, feedback, surprise')
    expect(SYSTEM_PROMPT).toContain('If the concept can be removed without')
    expect(SYSTEM_PROMPT).toContain('flat quiz or drill')
  })

  it('requires ChemQuest investigations to follow the Indicator Detective quality pattern', () => {
    expect(SYSTEM_PROMPT).toContain('designer, science validator, executor')
    expect(SYSTEM_PROMPT).toContain('gameplay reviewer')
    expect(SYSTEM_PROMPT).toContain('learner only follows a')
    expect(SYSTEM_PROMPT).toContain('recipe')
    expect(SYSTEM_PROMPT).toContain('Prefer the Indicator Detective pattern')
    expect(SYSTEM_PROMPT).toContain('Do not publish a linear worksheet')
    expect(SYSTEM_PROMPT).toContain('Visual quality is part of the build')
  })
})
