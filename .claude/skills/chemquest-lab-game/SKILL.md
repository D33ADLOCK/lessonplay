---
name: chemquest-lab-game
description: "Create or modify ChemQuest Lab guided chemistry games using the contract-driven @learn-loop/template package. Use for NCERT/classroom chemistry lab games, separation of mixtures, guided experiment simulations, and agent-generated games that must use the fixed ChemQuest Lab 9:16 template instead of custom UI."
---

# ChemQuest Lab Game

Use this skill when building a guided chemistry learning game that should use the
ChemQuest Lab template.

ChemQuest Lab is the contract-driven frontend template for chemistry guided-sim
games. The game provides content and approved presentation hints; the template
owns layout, mission navigation, tool tray, feedback, notebook, and responsive
9:16 structure.

## Workflow

1. Read `references/template-contract.md` before designing UI or layout.
2. Read `references/scenario-contract.md` before writing `Scenario` data.
3. Read `references/gameplay-contract.md` before designing the player loop.
4. Read `references/presentation-contract.md` before writing station visuals.
5. Read `references/implementation-pattern.md` before creating or editing files.
6. Read `references/validation-checklist.md` before reporting completion.
7. Build content as data first; only add game-local CSS for outer page chrome or
   tiny brand accents that do not override the template contract.
8. Validate with typecheck, tests, build, and browser smoke testing at a phone
   viewport.

## Non-Negotiable Architecture

```text
Scenario + SandboxLab presentation -> @learn-loop/core engine
  -> ChemQuestLabGame from @learn-loop/template -> browser game
```

The agent may author:
- scenario content
- mission/presentation metadata
- approved template config tokens
- generated game title and copy
- light outer app shell

The agent must not author:
- custom app layout to replace the template
- custom mission drawer/navigation
- custom tool tray
- custom header/mission/experiment/feedback/notebook region order
- arbitrary station visual kinds
- CSS that rearranges ChemQuest Lab regions

## Required Render Surface

Use `ChemQuestLabGame` from `@learn-loop/template` for investigations. It provides
material/tool choices, observations, notebook evidence, and gated conclusions.
Use `LearnLoopGame` only for a genuinely procedural demonstration with no
classification or inference goal. Do not render chemistry games with hand-built
React layouts.

When adapting existing `GuidedLabMissionPresentation`, use
`createLearnLoopTemplatePresentation(...)`.

## Validation Requirement

Browser validation is required. Static tests are not enough because ChemQuest Lab
failures are often visual: clipped text, cramped tool buttons, station ambiguity,
menu overlap, or phone viewport overflow.
