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

  it('registers the ExperimentLab discovery archetype', () => {
    expect(REQUIRED_SKILLS).toContain('experiment-lab-game')
    expect(SYSTEM_PROMPT).toContain('## Format Routing')
    expect(SYSTEM_PROMPT).toContain('ExperimentLab (dark-glow discovery lab)')
    expect(SYSTEM_PROMPT).toContain('classify, identify, distinguish, or compare hidden')
    expect(SYSTEM_PROMPT).toContain(
      'Do not route a\ndiscovery/classification concept into ChemQuest',
    )
  })

  it('gives ExperimentLab builds the dark-glow viewport and CSS, not the ChemQuest skin', () => {
    expect(SYSTEM_PROMPT).toContain('For ExperimentLab games:')
    expect(SYSTEM_PROMPT).toContain('loadSkill with id experiment-lab-game')
    expect(SYSTEM_PROMPT).toContain('Render ExperimentLabViewport from @learn-loop/core/ui')
    expect(SYSTEM_PROMPT).toContain('import @learn-loop/core/ui/experiment.css')
    expect(SYSTEM_PROMPT).toContain('Do not import @learn-loop/core/ui/styles.css')
    expect(SYSTEM_PROMPT).toContain('validateExperimentMission')
    expect(SYSTEM_PROMPT).toContain('src/content/game.ts')
  })

  it('advertises skills as a progressive-disclosure menu, not full injected bodies', () => {
    // The menu carries id + name + description for each advertised skill...
    expect(SYSTEM_PROMPT).toContain('<available_skills>')
    for (const skill of REQUIRED_SKILLS) {
      expect(SYSTEM_PROMPT).toContain(`<id>${skill}</id>`)
    }
    // ...and tells the agent how to pull the full instructions on demand.
    expect(SYSTEM_PROMPT).toContain('## Using skills')
    expect(SYSTEM_PROMPT).toContain('Call loadSkill with its id')
    expect(SYSTEM_PROMPT).toContain('listSkillFiles')
    expect(SYSTEM_PROMPT).toContain('readSkillFile')
    // The full SKILL.md body must NOT be injected wholesale anymore. The
    // experiment-lab skill body opens with this heading; it should only appear
    // once the agent loads the skill, never in the base prompt.
    expect(SYSTEM_PROMPT).not.toContain('# ExperimentLab Game')
  })
})
