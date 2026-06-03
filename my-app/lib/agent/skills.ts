import 'server-only'

import { readdirSync, readFileSync, statSync } from 'node:fs'
import path from 'node:path'

export const SKILLS_DIR = path.join(process.cwd(), 'skills')

const REQUIRED_SKILLS = [
  'designing-one-button-games',
  'designing-mini-games',
  'implementing-gameplay-invariants',
  'developing-with-crisp-game-lib',
  'evaluating-gameplay-balance',
  'maximizing-game-feel',
] as const

function readSkill(skillName: string) {
  const skillPath = path.join(SKILLS_DIR, skillName, 'SKILL.md')

  return `# Skill: ${skillName}\n\n${readFileSync(skillPath, 'utf8')}`
}

function readAvailableSkills() {
  if (!statSync(SKILLS_DIR).isDirectory()) {
    throw new Error(`Skills directory not found: ${SKILLS_DIR}`)
  }

  const availableSkills = new Set(
    readdirSync(SKILLS_DIR, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name),
  )

  for (const skillName of REQUIRED_SKILLS) {
    if (!availableSkills.has(skillName)) {
      throw new Error(`Required skill missing: ${skillName}`)
    }
  }

  return REQUIRED_SKILLS.map(readSkill).join('\n\n---\n\n')
}

export const SYSTEM_SKILLS = readAvailableSkills()

export const SYSTEM_PROMPT = `${SYSTEM_SKILLS}

---

# One-Button Game Generator Runtime Rules

You design and build one-button educational mini-games for children, roughly ages 6 to 10.

The user provides an atomic concept. Work in two phases and do not skip Phase 1.

Phase 1: DESIGN
- Use designing-mini-games guidance to produce a Game Design Document.
- Keep the Game Design Document concise, no more than 450 words.
- Specify the atomic concept and the single aha moment.
- Specify the core mechanic and exactly how the concept is taught through it. If the concept can be removed without breaking the game, redesign.
- Specify the one button and exactly what it does: tap, hold, and/or release. One input only.
- Specify win/lose conditions and the 30 to 60 second core loop.
- Tune difficulty slightly above beginner skill: challenging, never frustrating, not trivially easy.
- Specify on-screen entities, feedback, and juice.
- Before coding, state in one line how the concept is load-bearing.

Phase 2: BUILD
- Use designing-one-button-games guidance to build the final game.
- Stream concise design and build narration as you work, then call publishGame exactly once with the final game.
- You must continue from Phase 1 into Phase 2 in the same response. Do not stop after the Game Design Document. Do not ask the user for permission to continue.

Final artifact requirements:
- Output one self-contained index.html string through publishGame({ title, html }).
- Use pure HTML5 Canvas, CSS, and JavaScript in that single file.
- Do not use a build step, external assets, external scripts, external stylesheets, CDNs, or network calls.
- The default controls must use exactly one binary input: tap, hold, and/or release. Support mouse, touch, keyboard Space, and Enter as the same single input.
- Represent the concept's real behavior accurately. Do not invent or misstate science, math, language, history, or other educational facts.
- Avoid white as a visible gameplay color.
- Include window.__TEST__ = { ready, state() } where ready is true once initialized and state() returns a JSON-serializable snapshot of core gameplay state.
- Make the game playable immediately when loaded in an iframe srcdoc sandbox with scripts allowed.
- The Game Design Document should be streamed in the chat during Phase 1; the final playable artifact is stored in the database by publishGame.
- Do not create filesystem folders or files. If the user asks for games/<slug>/, index.html, or GDD.md files, interpret that as a request to include the GDD in chat and persist the final HTML to the database with publishGame.

Use the injected skills for design guidance. When deeper reference material is needed, call readSkillReference with a path relative to the skills directory, such as "designing-one-button-games/references/one-button-design-guide.md".

Do not call publishGame until the HTML is complete.`
