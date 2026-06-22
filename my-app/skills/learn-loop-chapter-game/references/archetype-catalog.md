# Mechanic Archetype Catalog

Use this catalog after extracting the chapter concepts and before scaffolding.

## Sandbox Lab

Use when the concept is best learned through `Explore -> Observe -> Conclude`:
selecting a material, applying a tool, seeing a visible change or useful
non-result, and choosing the conclusion supported by collected evidence.

Inputs:
- grade, chapter, concept title
- 2-5 missions
- entities/materials
- stations/apparatus or zones
- rules as declarative transforms
- one simple learner-facing question per mission
- 2-4 stages per mission, each with title, plain goal, visible material ids,
  visible tool ids, required evidence ids, and next prompt
- materials, tools, interactions, feedback cards, stage evidence, and conclusion
  cards
- validated sound cue ids and reaction effect ids for each authored interaction
- notebook goal, hints, and delayed explanation
- presentation metadata using the strict sandbox-lab vocabulary

Generated shape:
- `games/<slug>/package.json` imports `@learn-loop/core`
- scenario data under `src/content/`
- `SandboxLabMissionPresentation` data beside the scenarios
- every mission is staged as `Question -> Stage goals -> Evidence ->
  Conclusion`
- every meaningful interaction is staged as `Tool -> Reaction -> Feedback card
  -> Notebook evidence -> Next step`
- app UI renders `SandboxLabViewport` from `@learn-loop/core/ui`
- app imports `@learn-loop/core/ui/styles.css` before local skin CSS
- optional chapter styling only; do not generate a custom page layout
- tests for scenario validation, sandbox presentation validation, stage
  progression, feedback-card gating, notebook evidence, useful non-results,
  required evidence, and at least one conclusion path

Validation:
- core typecheck and tests
- game typecheck, tests, and build
- `validateSandboxLabPresentation` passes for each scenario
- browser check at 390x844 has no document scroll
- mission drawer and notebook are mutually exclusive overlays
- outside click and Escape close the active overlay
- notebook logs dismissed feedback as evidence cards
- feedback cards gate stage progression
- conclusion cards appear only after final-stage evidence is collected
- no local copy of core engine/domain modules

Reaction kit V1 apparatus:
- `test-tube`
- `beaker`
- `dish`
- `evaporating-dish`
- `filter`
- `distillation`
- `condenser`
- `burner`
- `paper`
- `receiver`
- `magnet`

Reaction kit V1 reaction effects:
- `dissolve`
- `settle`
- `filter-residue`
- `heat`
- `vapour`
- `gas`
- `gas-bubbles`
- `crystals`
- `light-scatter`
- `chromatography-bands`
- `color-change`
- `magnetic-pull`

Reaction kit V1 sound cues:
- `pour`
- `filter`
- `heat`
- `cool`
- `wait`
- `light`
- `chromatograph`
- `success`
- `wrong-tool`
- `stage-complete`

Reaction kit V1 effect tags:
- `scatter-light`
- `settle-particles`
- `trap-residue`
- `grow-crystals`
- `distil-vapour`
- `chromatography-bands`
- `gas-bubbles`
- `gas-up-arrow`
- `dissolve`
- `heat`
- `vapour`
- `filter-residue`
- `color-change`
- `magnetic-pull`

Golden chemistry pattern:
- Use one beaker for the starting mixture, one filter station for residue, and
  one evaporating dish for filtrate/recovery.
- Reveal only the current material and 2-3 useful tool choices.
- For each tool click, render a visible reaction, show a feedback card, then
  save notebook evidence before advancing.

## Guided Sim

Use when the concept is best learned through `Predict -> Observe -> Explain`:
choosing a tool/action, seeing a visible change, and explaining the rule behind
it. Prefer Sandbox Lab for chemistry chapters unless the user explicitly wants a
linear step-by-step lab.

Inputs:
- grade, chapter, concept title
- 2-5 scenarios
- entities/materials
- stations/apparatus or zones
- rules as declarative transforms
- ordered guided steps with expected actions and wrong-tool hints
- presentation metadata for every scenario using the strict guided-lab vocabulary

Generated shape:
- `games/<slug>/package.json` imports `@learn-loop/core`
- scenario data under `src/content/`
- `GuidedLabMissionPresentation` data beside the scenarios
- app UI renders `GuidedLabViewport` from `@learn-loop/core/ui`
- optional chapter styling only; do not generate a custom page layout
- tests for scenario validation and at least one end-to-end session path

Validation:
- core typecheck and tests
- game typecheck, tests, and build
- `validateGuidedLabPresentation` passes for each scenario
- browser check at 390x844 has no document scroll
- no local copy of core engine/domain modules

V1 station visual kinds:
- `test-tube`
- `beaker`
- `dish`
- `filter`
- `distillation`
- `paper`
- `receiver`

V1 effect tags:
- `scatter-light`
- `settle-particles`
- `trap-residue`
- `grow-crystals`
- `distil-vapour`
- `chromatography-bands`

## Contraption

Use when the concept is best learned by building, predicting, testing, and
iterating on a physical setup.

Route to `physics-contraption-level-generator` for Class 6-7 JSON level packs.

## Arcade

Use when the concept can be represented as timing, avoidance, collection, or
spatial risk/reward under pressure.

Route to the one-button or mini-game design skills, then run the crisp-game-lib
validation gate when applicable.

## Sort / Classify

Use when the chapter goal is grouping, comparing properties, ordering examples,
or distinguishing cases. This is a catalog slot only; build a concrete template
before generating production games.
