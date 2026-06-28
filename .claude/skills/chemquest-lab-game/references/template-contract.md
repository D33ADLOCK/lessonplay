# ChemQuest Lab Template Contract

ChemQuest Lab owns the learning-game shell. The agent supplies content and
approved variants only.

Use `SandboxLabViewport` from `@learn-loop/core/ui` for evidence-driven
investigations. It owns the mission briefing, material selector, experiment
stage, tool dock, observation feedback, notebook, and conclusion choices, and it
renders its own full-screen 9:16 shell. Render it as the page root.

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

## Theming

The viewport accepts an optional `theme` prop that changes the skin only — it
never moves, resizes, or reorders regions. Choose tokens by name; unknown values
fall back to the default (`clean-lab` / `blue` / `standard`).

- `palette`: `clean-lab`, `warm-lab`, `night-lab`, `field-notes`
- `accent`: `blue`, `green`, `amber`, `rose`
- `intensity`: `calm`, `standard`, `high-contrast`
- `headerDensity`: `standard`, `compact`

Theming is optional and is the only supported way to change appearance. Do not
invent token values, and do not override the `--sl-*` CSS variables or any region
geometry from a game. See `implementation-pattern.md` for the prop shape.

## Layout Rules

- The viewport owns the full screen; render `SandboxLabViewport` as the page
  root.
- Do not wrap the viewport in a centering/padded shell or set `min-height: 100vh`
  on a wrapper. That collapses the `.sandbox-lab-frame` grid and overlaps regions.
- Do not create a landing page for the generated game.
- Do not create a custom mission drawer.
- Do not create a custom tool tray.
- Do not put cards inside cards.
- Do not add a decorative gradient background, gradient orbs, or unrelated
  illustration behind the viewport.
- Do not use CSS overrides that change `.sandbox-lab-app`, `.sandbox-lab-frame`
  grid rows, `.sandbox-lab-stage`, `.sandbox-tool-dock`, or investigation region
  order.

## Naming

ChemQuest Lab is the template/system name. The generated game title should be
specific to the activity, for example `Ink Detective`, `Crystal Rescue`, or
`Salt Splitter`. Do not force every game title to start with `ChemQuest Lab`.
