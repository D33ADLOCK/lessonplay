# ChemQuest Lab Template Contract

ChemQuest Lab owns the learning-game shell. The agent supplies content and
approved variants only.

Use `ChemQuestLabGame` for evidence-driven investigations. It owns the mission
briefing, material selector, experiment stage, tool dock, observation feedback,
notebook, and conclusion choices. Use the older `LearnLoopGame` config tokens
below only for procedural guided demonstrations.

## Fixed Regions

The template always renders these regions in this order:

1. Header
2. Mission
3. Experiment zone
4. Tool tray
5. Feedback
6. Notebook

Do not rearrange, resize, remove, or replace these regions from a game.

## Approved Config Tokens

Use `LearnLoopTemplateConfigInput` from `@learn-loop/template`.

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
- Do not use CSS overrides that change `.learn-loop-template` grid rows or
  region order.

## Naming

ChemQuest Lab is the template/system name. The generated game title should be
specific to the activity, for example `Ink Detective`, `Crystal Rescue`, or
`Salt Splitter`. Do not force every game title to start with `ChemQuest Lab`.
