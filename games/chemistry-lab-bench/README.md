# Chemistry Lab Bench

Tracking issues: [#32](https://github.com/D33ADLOCK/game-code/issues/32) (v1),
[#34](https://github.com/D33ADLOCK/game-code/issues/34) (v2 + separation toolkit)

A mobile-first, **config-driven** virtual chemistry lab for NCERT Class 9. The
engine renders apparatus and resolves reactions declaratively; each experiment is
authored as **data, not code**. The core bet: adding the next experiment costs
only a data file, never engine changes — proved by three structurally different
experiments running on one schema, the only engine growth being the transform
branches each new capability always anticipated.

The student experience is a guided list of steps, each a **Predict → Observe →
Explain** loop: predict the outcome (tap a choice), perform the step's action —
pour a reagent, filter a mixture, or heat a beaker — watch what happens, then read
*why* it happened.

Ships three experiments:

- **Acid + base neutralisation** — pour the base in; the indicator turns pink and
  the beaker warms (exothermic). Distilled water is a distractor.
- **Metal + acid → hydrogen** — drop zinc into dilute acid; it fizzes, hydrogen
  bubbles out of the liquid, and the beaker warms. Copper is a distractor.
- **Separating salt from sand** — pour water (salt dissolves, sand does not),
  **filter** the mixture (sand stays as residue, the salt solution passes through
  as filtrate), then **heat** the filtrate (water leaves as vapour, salt crystals
  remain). The first multi-station, multi-apparatus experiment.

## The v2 model: transforming a workspace

The engine no longer just *describes* a result — it **transforms** state:

- The world is a **`Workspace`** of named **`Station`s** (apparatus). Each station
  holds a set of `contents` plus lasting state a student can see or feel: its
  liquid `color` and a named `heat` level. The UI renders a labelled **row** of
  stations — a single-station experiment is just a row of one.
- An action is only the student's **gesture** (which station they act on). The
  chemistry it triggers — products, routing destinations, emissions — lives on the
  matched rule's **transform**, never on the action itself.
- Three transforms are implemented:
  - **`react`** — **consume** reagents, **produce** persistent products, **emit**
    gas as a separate emission that *leaves the liquid*, and **set** colour + heat.
  - **`split`** (filtration) — route a station's contents to a residue + filtrate
    purely by each chemical's **`solubility`**: insoluble → residue, everything
    else → filtrate. The source empties.
  - **`evaporate`** — keep only the chemicals that `leaves` (e.g. salt crystals),
    drive the rest off as a vapour emission, and set colour + heat.
- **Heat is a named level** (`cool → room → warm → hot`), never a fabricated
  number. A reaction or an evaporation sets the new level; it persists until
  another action changes it.
- One action resolves **one** reaction (no auto-cascade). Multi-step chemistry
  emerges from the student taking multiple actions.
- The remaining vocabulary (`transfer`/`stir` actions, `moveAll` transform) stays
  **locked in the types** but unimplemented. The validator **rejects** any
  experiment that uses a reserved capability, so the schema is stable without
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
- `src/content/`: experiments authored as data (`acidBase.ts`, `metalAcid.ts`,
  `saltSand.ts`).
- `src/scene/`: the scene's rendering core — a pure geometry module
  (`layout.ts`, `computeStationLayout`) that is the single source of truth for
  where each station sits, the **Canvas fluid/energy** renderer
  (`labRenderer.ts`, `draw(ctx, scene, anim, time)` — liquid, bubbles, flame,
  pour stream), and the apparatus-shape lookup (`apparatus.ts`).
- `src/ui/`: React presentation. The stage stacks three layers that share the
  one logical coordinate space: a static SVG **diorama** behind (`LabDiorama` —
  wall + bench + calm props), the animated **Canvas** fluid in the middle
  (`LabCanvas`), and the static SVG **apparatus** in front (`Apparatus` — beaker
  / funnel + filter paper, captions, heat label, active ring). Because the glass
  and the liquid are both placed by `computeStationLayout`, they cannot drift.

## Adding an experiment

Write one `Experiment` (see `src/content/metalAcid.ts` for a single-station
reaction, or `src/content/saltSand.ts` for a multi-station separation): list its
`chemicals` (tag `solubility` if it will be filtered), the `shelf`, each
`Station`'s starting state, a declarative `rules` registry (first-match-wins on
chemical presence, each rule carrying a `react`, `split`, or `evaporate`
transform), and an ordered list of `steps` (each a prediction + action prompt +
expected action + explanation). Run it through `validateExperiment` and it is
ready — no engine changes.

## Attribution

The reaction-engine pattern and rule schema are adapted to TypeScript from the
MIT-licensed [nsriram/chem_lab](https://github.com/nsriram/chem_lab). See
`NOTICE`.
