# Chemistry Lab Bench

Tracking issue: [#32](https://github.com/D33ADLOCK/game-code/issues/32)

A mobile-first, **config-driven** virtual chemistry lab for NCERT Class 9. The
engine renders apparatus and resolves reactions declaratively; each experiment is
authored as **data, not code**. v1 ships one experiment — acid + base
neutralisation — built on the real engine + schema, so adding the next experiment
costs only a data file, never engine changes.

The student experience is a **Predict → Observe → Explain** loop: predict the
outcome (tap a choice), pour a reagent into the beaker, watch the liquid turn
pink and the thermometer rise, then read *why* it happened.

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

`npm test` covers the two pure deep modules: the reaction engine
(`src/domain/reaction.ts`) and the experiment validator
(`src/domain/validateExperiment.ts`).

## Boundaries

- `src/contracts/`: framework-agnostic types — chemistry values and the
  experiment schema.
- `src/domain/`: pure logic — the first-match reaction engine, the experiment
  validator, and the Predict → Observe → Explain session reducer. No React, no
  Canvas.
- `src/content/`: experiments authored as data (`acidBase.ts`).
- `src/scene/`: the Canvas renderer (`draw(ctx, scene, anim)`); rendering-only.
- `src/ui/`: React presentation wiring the reducer to the renderer and panels.

## Adding an experiment

Write one `Experiment` (see `src/content/acidBase.ts`): list its `chemicals`,
the `shelf`, the beaker's starting `contents`, a declarative `rules` registry
(first-match-wins on chemical presence), and the `task` (prediction + action
prompt + explanation). Run it through `validateExperiment` and it is ready — no
engine changes.

## Attribution

The reaction-engine pattern and rule schema are adapted to TypeScript from the
MIT-licensed [nsriram/chem_lab](https://github.com/nsriram/chem_lab). See
`NOTICE`.
