# Chemistry Lab Bench

Tracking issues: [#32](https://github.com/D33ADLOCK/game-code/issues/32) (v1),
[#34](https://github.com/D33ADLOCK/game-code/issues/34) (v2)

A mobile-first, **config-driven** virtual chemistry lab for NCERT Class 9. The
engine renders apparatus and resolves reactions declaratively; each experiment is
authored as **data, not code**. The core bet: adding the next experiment costs
only a data file, never engine changes — proved in v2 by two structurally
different experiments running on one schema with zero engine changes between them.

The student experience is a guided list of steps, each a **Predict → Observe →
Explain** loop: predict the outcome (tap a choice), pour a reagent into the
beaker, watch what happens, then read *why* it happened.

Ships two experiments:

- **Acid + base neutralisation** — pour the base in; the indicator turns pink and
  the beaker warms (exothermic). Distilled water is a distractor.
- **Metal + acid → hydrogen** — drop zinc into dilute acid; it fizzes, hydrogen
  bubbles out of the liquid, and the beaker warms. Copper is a distractor.

## The v2 model: transforming a workspace

The engine no longer just *describes* a result — it **transforms** state:

- The world is a **`Workspace`** of named **`Station`s** (apparatus). Each station
  holds a set of `contents` plus lasting state a student can see or feel: its
  liquid `color` and a named `heat` level. The v2 UI renders one beaker.
- A reaction is a real **`react` transform**: it **consumes** reagents,
  **produces** persistent products in the station, **emits** any gas as a separate
  emission that *leaves the liquid* (it is not added back to the contents), and
  **sets** the station's colour and heat.
- **Heat is a named level** (`cool → room → warm → hot`), never a fabricated
  number. A reaction sets the new level; it persists until another reaction
  changes it.
- One action resolves **one** reaction (no auto-cascade). Multi-step chemistry
  emerges from the student taking multiple actions.
- The full vocabulary of future apparatus (`transfer`/`filter`/`heat`/`stir`) and
  transforms (`split`/`evaporate`/`moveAll`) is **locked in the types** but only
  `pour` + `react` are implemented. The validator **rejects** any experiment that
  uses a reserved-but-unimplemented capability, so the schema is stable without
  shipping speculative engine code.

## Run

```
npm install
npm run dev
```

Open `http://localhost:5182` (use a phone-width portrait viewport).

## Verify

```
npm run typecheck
npm test
npm run build
```

`npm test` covers all three pure deep modules: the reaction engine
(`src/domain/reaction.ts`, `applyAction`), the experiment validator
(`src/domain/validateExperiment.ts`), and the per-step session reducer
(`src/domain/labSession.ts`).

## Boundaries

- `src/contracts/`: framework-agnostic types — chemistry values
  (`chemistry.ts`), the action vocabulary (`actions.ts`), and the experiment
  schema (`experiment.ts`).
- `src/domain/`: pure logic — the first-match reaction engine, the experiment
  validator, and the per-step session reducer. No React, no Canvas.
- `src/content/`: experiments authored as data (`acidBase.ts`, `metalAcid.ts`).
- `src/scene/`: the Canvas renderer (`draw(ctx, scene, anim, time)`);
  rendering-only — heat level + bubbles.
- `src/ui/`: React presentation wiring the reducer to the renderer and panels.

## Adding an experiment

Write one `Experiment` (see `src/content/metalAcid.ts`): list its `chemicals`,
the `shelf`, each `Station`'s starting state, a declarative `rules` registry
(first-match-wins on chemical presence, each rule carrying a `react` transform),
and an ordered list of `steps` (each a prediction + action prompt + expected
action + explanation). Run it through `validateExperiment` and it is ready — no
engine changes.

## Attribution

The reaction-engine pattern and rule schema are adapted to TypeScript from the
MIT-licensed [nsriram/chem_lab](https://github.com/nsriram/chem_lab). See
`NOTICE`.
