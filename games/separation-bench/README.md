# Separation Bench

A mobile-first, **config-driven** virtual chemistry lab for **NCERT Class 9 —
"Exploring Mixtures and their Separation"** (Chapter 5 / Grade 9). It is a
specialised descendant of the `chemistry-lab-bench` template: the same engine
renders apparatus and resolves reactions declaratively, and each experiment is
authored as **data, not code**.

The student experience is a guided list of steps, each a **Predict → Observe →
Explain** loop: predict what will happen, then *choose the right tool* at the
live bench — the action is the decision — watch what happens, and read *why*.

Ships three separation experiments:

- **Filtration + evaporation — salt from sand.** Pour water (salt dissolves,
  sand does not), **filter** (sand → residue, salt solution → filtrate), then
  **heat** the filtrate (water leaves as vapour, salt crystals remain).
- **Distillation — acetone + water.** **Heat** the flask: the lower-boiling
  acetone (≈56 °C) boils over, condenses, and is **recovered as a liquid** in
  the first receiver while the water stays behind; **heat again** and the water
  (100 °C) distils over into the second receiver. Both liquids recovered, pure.
- **Crystallisation — copper sulfate.** Pour water to **dissolve** the solid
  into a blue solution, then **heat** to evaporate the water until the solution
  saturates and deep-blue crystals separate out.

## The one engine addition: `distil`

Distillation is the chapter's central idea — *recovering the solvent*, not just
throwing it away. The template's `evaporate` transform loses the vapour; so this
game adds one new transform, **`distil`**, the natural sibling of `split` and
`evaporate`:

- it boils the rule's **`volatile`** chemicals off and **collects them as a
  liquid** in the **`collectTo`** receiver (the distillate is recovered, not
  emitted away);
- everything else (a higher-boiling liquid, a dissolved solid) stays in the
  source still pot;
- routing is by chemical id, never hard-coded — list what comes over.

It reuses the existing **`heat`** gesture, so no new tool was needed. The
validator was extended to reference-check `volatile` and `collectTo`, keeping
the "experiments are just data" guarantee intact. The acetone-then-water
two-cut works purely through first-match-wins: the acetone rule fires while both
liquids are present, the water rule once only water is left.

## Run

```
npm install
npm run dev
```

Open `http://localhost:5183` (use a phone-width portrait viewport).

## Verify

```
npm run typecheck
npm test
npm run build
```

`npm test` covers the pure deep modules: the reaction engine
(`src/domain/reaction.ts`, including the new `distil` branch), the experiment
validator (`src/domain/validateExperiment.ts`), and the per-step session reducer
(`src/domain/labSession.ts`), plus engine + validation coverage for the
distillation and crystallisation experiments (`tests/distillation.test.ts`).

## Adding an experiment

Write one `Experiment` (see `src/content/distillation.ts` for a heat-only,
multi-receiver distillation, or `src/content/crystallization.ts` for a
dissolve-then-crystallise run): list its `chemicals`, the `shelf`, each
`Station`'s starting state, a declarative `rules` registry (first-match-wins on
chemical presence, each rule carrying a `react`, `split`, `evaporate`, or
`distil` transform), and an ordered list of `steps`. Run it through
`validateExperiment` and add it to the `EXPERIMENTS` list in `src/ui/App.tsx` —
no engine changes.

## Attribution

The reaction-engine pattern and rule schema are adapted to TypeScript from the
MIT-licensed [nsriram/chem_lab](https://github.com/nsriram/chem_lab). See
`NOTICE`.
