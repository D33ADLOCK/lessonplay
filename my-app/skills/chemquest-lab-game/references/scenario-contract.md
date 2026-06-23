# Scenario Contract

Author learning content as `Scenario` data from `@learn-loop/core`.

## Required Shape

A scenario must define:
- `id`
- `title`
- `concept`
- `grade`
- `entities`
- `shelf`
- `stations`
- `rules`
- `steps`

## Learning Loop

Every step should support:

```text
Predict -> Act -> Observe -> Explain
```

The player chooses a tool or reagent, sees a visible state change, then reads a
plain explanation.

## Entity Rules

- Use short stable ids such as `salt`, `sand`, `water`, `filtrate`.
- Use student-readable labels.
- Give visible colors for materials.
- Mark solubility when relevant: `soluble` or `insoluble`.

## Station Rules

- Use station ids that describe their role, such as `beaker`, `testTube`,
  `residue`, `filtrate`, `flask`, `paper`.
- Keep the station count small. Two or three stations is usually enough.
- Start with the visually important material already placed if the activity
  begins with a sample.

## Rule Rules

- Use declarative transforms from `@learn-loop/core`.
- Prefer visible cause-and-effect:
  - dissolve
  - filter
  - heat/evaporate
  - cool/crystallize
  - distil
  - chromatograph
  - shine light
  - wait/settle
- Wrong tools should give useful feedback through step hints where possible.

## Step Rules

Each step must include:
- `predictPrompt`
- 1-3 options
- a plain `goal`
- useful `hints`
- an `actionPrompt`
- an `expect` action
- a concise explanation

Use chapter terminology after evidence appears. For example, show the sand
being trapped before saying filtration separates insoluble solids.
