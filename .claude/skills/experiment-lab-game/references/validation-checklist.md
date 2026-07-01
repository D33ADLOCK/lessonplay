# Validation Checklist

## Build-time gates

Validate the authored `ExperimentGame` with the headless gates from
`@learn-loop/core` before reporting completion:

```text
validateExperimentMission(game)   // structural, THEN quality (the single gate)
  validateExperimentGame(game)     // structural / referential only
  analyzeExperimentGame(game)      // per-level quality (folds solveExperiment)
solveExperiment(definition, level) // one level's verdict, for diagnosis
```

`validateExperimentMission` runs structural validation first and only runs the
quality analysis when structure is clean, mirroring `validateSandboxLabMission`.
Treat a quality defect exactly like a structural error: do not ship it.

## Structural checks (validateExperimentGame)

- ids are unique across samples, tools, categories, levels.
- every `rule.toolId` references a known tool.
- every `sample.categoryId` references a declared category.
- an `observationId` maps to exactly one observation text.
- no rule or default-effect observation text names a declared category label
  (discovery before naming).
- every level's `sampleIds` / `toolIds` resolve; `goal.classifyIds` are present
  on that level's bench; `goal.categoryIds` are declared categories.

## Quality checks (solveExperiment, per level)

A level is acceptable only when `errors` is empty. The verdict reports:

- `winnable` — every different-category sample pair can be told apart with the
  level's tools. `indistinguishablePairs` lists any that cannot.
- `bruteForceable` — answerable without evidence (fewer than two samples or two
  categories). Suppressed for `guided` tutorials.
- `railed` — no meaningful choice: fewer than two tools, or a single tool already
  separates every category. Suppressed for `guided` tutorials.
- `toolsNeeded` — smallest toolset that separates all categories; `> 1` confirms
  a genuine combine-causes level, `Infinity` means unwinnable.

If a level is flagged, fix the *design* (add the ambiguity, add a sample, expose
the right tools), not the analyzer.

## Static checks

```bash
npm run typecheck --workspace @learn-loop/core
npm test --workspace @learn-loop/core
```

When the game ships as its own package, also typecheck/test/build that package
and assert, in its tests, that `validateExperimentMission(game).ok` is true.

## Render surface

`ExperimentLabViewport` is the shipped render surface. Visual QA must confirm:

- the 9:16 viewport has no clipped controls, unreadable labels, or body overflow;
- the beaker states are legible for `beam`, `settle`, `residue`, `fizz`,
  `color-change`, `gas`, and `precipitate`;
- the `gasLabel` chip is readable when `visual === "gas"` and observation prose
  stays sensory rather than naming the gas;
- sample chips, tool buttons, prediction choices, and notebook cells remain
  usable on mobile-size viewports;
- classify and reveal overlays work end-to-end and keep concept labels hidden
  until the learner submits a correct classification.
