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
3. Read `references/presentation-contract.md` before writing station visuals.
4. Read `references/implementation-pattern.md` before creating or editing files.
5. Read `references/validation-checklist.md` before reporting completion.
6. Build content as data first; only add game-local CSS for outer page chrome or
   tiny brand accents that do not override the template contract.
7. Validate with available static checks and the publish bundler. Do not attempt
   browser automation unless a browser tool is explicitly available in the chat.

## Non-Negotiable Architecture

```text
Scenario data -> @learn-loop/core engine -> @learn-loop/template UI -> browser game
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

Use `LearnLoopGame` from `@learn-loop/template`. Do not render chemistry guided
games with hand-built React layouts.

When adapting existing `GuidedLabMissionPresentation`, use
`createLearnLoopTemplatePresentation(...)`.

## Validation Requirement

Use static tests and the Learn Loop publisher as the required validation path.
If browser automation is not available, report that visual/mobile QA was not run
instead of trying to call a missing browser tool.
