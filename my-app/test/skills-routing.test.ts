import { describe, expect, it } from 'vitest'

import { REQUIRED_SKILLS, SYSTEM_PROMPT } from '@/lib/agent/skills'

describe('agent skill routing', () => {
  it('uses one sequential game creator instead of separate planner and builder agents', () => {
    expect(REQUIRED_SKILLS).not.toContain('chemistry-concept-planner')
    expect(REQUIRED_SKILLS).toContain('chemquest-lab-game')
    expect(SYSTEM_PROMPT).toContain('You are one agent with one sequential job')
    expect(SYSTEM_PROMPT).toContain('Do not act like separate planner and builder agents')
  })

  it('requires the agent to plan first and stop before implementation', () => {
    expect(SYSTEM_PROMPT).toContain('If there is no current game plan in the conversation, create a plan and stop')
    expect(SYSTEM_PROMPT).toContain('Do not write files, do not call publishing tools')
    expect(SYSTEM_PROMPT).toContain('# Chemistry Game Plan')
  })

  it('requires build requests to use tools instead of repeating the plan', () => {
    expect(SYSTEM_PROMPT).toContain('If there is a current game plan and the latest user message asks to build')
    expect(SYSTEM_PROMPT).toContain('Do not repeat the plan')
    expect(SYSTEM_PROMPT).toContain('Never answer a build request with another unchanged plan')
    expect(SYSTEM_PROMPT).toContain('writeLearnLoopFiles')
    expect(SYSTEM_PROMPT).toContain('publishLearnLoopGame')
  })
})
