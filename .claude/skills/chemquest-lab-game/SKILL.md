---
name: chemquest-lab-game
description: "Create or modify ChemQuest Lab guided chemistry games using the contract-driven SandboxLabViewport from @learn-loop/core/ui. Use for NCERT/classroom chemistry lab games, separation of mixtures, guided experiment simulations, and agent-generated games that must use the fixed ChemQuest Lab 9:16 template instead of custom UI."
---

# ChemQuest Lab Game

Use this skill when building a guided chemistry learning game from the current
`# Chemistry Game Plan` or equivalent approved plan that should use the
ChemQuest Lab template.

ChemQuest Lab is the contract-driven frontend template for chemistry guided-sim
games. The game provides content and approved presentation hints; the template
owns layout, mission navigation, tool tray, feedback, notebook, and responsive
9:16 structure.

## Workflow

1. Confirm the conversation contains a current `# Chemistry Game Plan` or
   equivalent approved plan.
2. Treat the plan as source of truth for the objective, misconception, fit
   decision, materials, tools, evidence, stages, conclusions, and non-goals.
3. If the plan says ChemQuest does not fit, route to its `Builder Handoff`
   instead of using this skill.
4. Do not repeat, summarize, or regenerate the plan when the user asked to
   build.
5. Read `references/template-contract.md` before designing UI or layout.
6. Read `references/scenario-contract.md` before writing `Scenario` data.
7. Read `references/gameplay-contract.md` before designing the player loop.
8. Read `references/presentation-contract.md` before writing station visuals.
9. Read `references/implementation-pattern.md` before creating or editing files.
10. Read `references/validation-checklist.md` before reporting completion.
11. Build content as data first; only add game-local CSS for outer page chrome or
   tiny brand accents that do not override the template contract.
12. Validate with available static checks and the publish bundler. Do not attempt
   browser automation unless a browser tool is explicitly available in the chat.

Do not re-decide the learning objective or game archetype. If the current plan
is incomplete or contradicts ChemQuest constraints, ask for a brief revision
instead of guessing.

When the user asks to build, continue, start, create, implement, or make the
game from the current plan, create the game files instead of continuing
planning.

## Non-Negotiable Architecture

```text
Scenario + SandboxLab presentation -> @learn-loop/core engine
  -> SandboxLabViewport from @learn-loop/core/ui -> browser game
```

The agent may author:
- scenario content
- mission/presentation metadata
- approved station visual kinds
- generated game title and copy
- an optional `theme` prop using named palette/accent/intensity/headerDensity
  tokens (see template-contract and implementation-pattern)
- a minimal `style.css` that only resets the document (see implementation-pattern)

The agent must not author:
- custom app layout to replace the template
- an outer centering/padded shell or gradient background around the viewport
- invented `theme` token values, or CSS that overrides the `--sl-*` variables
- custom mission drawer/navigation
- custom tool tray
- custom header/mission/experiment/feedback/notebook region order
- arbitrary station visual kinds
- CSS that rearranges ChemQuest Lab regions

## Required Render Surface

Use `SandboxLabViewport` from `@learn-loop/core/ui` for investigations. It
provides material/tool choices, observations, notebook evidence, and gated
conclusions, and it renders its own full-screen 9:16 shell. Render it as the
page root. Do not render chemistry games with hand-built React layouts, and do
not wrap the viewport in a centering/padded shell. See
`references/implementation-pattern.md` for the exact imports, render, and CSS.

## Validation Requirement

Use static tests and the Learn Loop publisher as the required validation path.
If browser automation is not available, report that visual/mobile QA was not run
instead of trying to call a missing browser tool.
