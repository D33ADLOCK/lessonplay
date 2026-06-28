# ChemQuest Lab Template Contract

ChemQuest Lab owns the learning-game shell. The agent supplies content and
approved variants only.

Use `ChemQuestLabGame` for evidence-driven investigations. It owns the mission
briefing, material selector, experiment stage, tool dock, observation feedback,
notebook, and conclusion choices. It is exported from `@learn-loop/template`
and currently renders the rich `SandboxLabViewport` investigation surface from
`@learn-loop/core/ui`.

## Fixed Investigation Regions

ChemQuest investigations always render these regions:

1. Heads-up display
2. Mission briefing and mission drawer
3. Objective card
4. Experiment stage
5. Material selector
6. Tool dock
7. Observation feedback
8. Notebook overlay
9. Conclusion strip

Do not rearrange, resize, remove, or replace these regions from a game.

## Procedural Template Config Tokens

Use `LearnLoopTemplateConfigInput` only when rendering `LearnLoopGame` for a
procedural guided demonstration. Do not rely on these tokens to style the
ChemQuest investigation surface.

Allowed palettes:
- `clean-lab`
- `warm-lab`
- `night-lab`
- `field-notes`

Allowed accents:
- `blue`
- `green`
- `amber`
- `rose`

Allowed intensities:
- `calm`
- `standard`
- `high-contrast`

Allowed header variants:
- `standard`
- `compact`

Allowed stage variants:
- `bench`
- `split-bench`
- `process-flow`

Allowed feedback variants:
- `inline`
- `notebook`

## Layout Rules

- Keep the game in the ChemQuest Lab 9:16 frame.
- Do not create a landing page for the generated game.
- Do not create a custom mission drawer.
- Do not create a custom tool tray.
- Do not put cards inside cards.
- Do not add decorative gradient orbs or unrelated illustration.
- Do not use CSS overrides that change `.sandbox-lab-frame` grid rows,
  `.sandbox-lab-stage`, `.sandbox-tool-dock`, or investigation region order.

## Naming

ChemQuest Lab is the template/system name. The generated game title should be
specific to the activity, for example `Ink Detective`, `Crystal Rescue`, or
`Salt Splitter`. Do not force every game title to start with `ChemQuest Lab`.
