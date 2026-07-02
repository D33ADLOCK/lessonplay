# Gameplay Contract

Use this contract to design the level ladder and the cause-effect loop.

## Required loop

```text
Predict -> Act -> Observe -> Reconcile (record)  ->  Classify -> Reveal
```

The learner must make every decision. Never write copy that names the correct
sample and tool together, and never state the inference in an observation.

## The designed ambiguity (the trap)

A real experiment needs at least one place where **one test is not enough**.
Make at least two different-category samples share the same `visual` under one
tool, so that tool alone cannot separate them; a second cause must break the
tie.

- Example: a colloid and a suspension both scatter light (`visual: "beam"`), so
  the light alone cannot tell them apart; only settling/filtering separates the
  suspension.
- Concretely: ensure **no single tool** separates every category. The analyzer
  reports `toolsNeeded`; a genuine combine-causes level has `toolsNeeded > 1`,
  and `solveExperiment` flags any non-tutorial level a single tool fully
  separates as `railed`.

## The scaffolding ladder

Difficulty climbs by **removing scaffolding and introducing the trap**, never by
adding clutter. Use `ExperimentLevel.scaffolding`:

- `guided` — tutorial. Teaches one cause/tool and the predict beat. May be
  intentionally trivial and railed; the analyzer does **not** flag `guided`
  levels for `bruteForceable` / `railed`.
- `hinted` — full toolset, the trap is present, ordered `hints` available on
  request.
- `open` — the real test: the trap is in play, no hints, prediction optional.

A typical ladder: learn one tool (guided) -> classify the full set with the trap
and hints (hinted) -> the same physics with hints removed (open). Levels share
one `ExperimentDefinition`; they differ only in which samples/tools are exposed
and what is asked.

## Goals — one of three kinds

`ExperimentGoal` is a discriminated union on `kind`. Pick the kind that matches
what the activity actually asks the learner to *do*. A goal with no `kind` is
treated as `classify` (back-compat), but prefer to set `kind` explicitly.

### `classify` — sort samples into categories (the default)

`{ kind?: "classify", classifyIds, categoryIds }`

- `classifyIds` are the samples the learner must classify; leave the
  control/reference out so it aids reasoning without being graded.
- `categoryIds` are the choices offered; every classify sample's `categoryId` must
  be among them, with at least two distinct categories in play (or the analyzer
  flags `bruteForceable`).
- The runtime reducer (`canClassify`) blocks the classify step until **every**
  classify sample has been probed at least once, so the goal cannot be reached
  by pure guessing. Design levels assuming the learner has gathered evidence.
- Use for **identity** chapters: "which bottle is which?" This is the workhorse;
  most activities become *tools* that feed one classify goal.

### `predict-outcome` — call the reaction before it runs

`{ kind: "predict-outcome", prompts: [{ sampleId, toolId }, ...] }`

- The learner is walked through the `prompts` in order, predicting each tool's
  visible result **before** it is applied, and is graded on how many were right.
- The prediction is on the **`visual`** (does it bubble `gas`, or `none`?), not
  the fine readout. So author prompts whose *visuals* differ — e.g. a metal
  fizzes `gas` on an acid but `none` on a base. The analyzer flags a level as
  **guessable** (a `bruteForceable`-style defect) unless at least two prompts
  have different answers, so one repeated guess cannot win.
- The bench hides the free tool-picker for these levels (the prompt names the
  tool). Reserve this for genuine **reactions** where the *event* is the lesson
  (metal + acid → H₂; carbonate + acid → CO₂), not for telling colours apart.

### `reach-target-state` — drive a sample to a goal state

`{ kind: "reach-target-state", sampleId, target, targetLabel }`

- The learner freely applies tools to `sampleId` until its state satisfies every
  entry in `target` (e.g. `{ nature: "neutral" }`), then the level auto-wins.
  This only works if some tool carries `setState` that moves the sample toward
  the target (e.g. `add-base` flips `nature: "acid"` → `"neutral"`).
- `targetLabel` is the learner-facing objective ("Bring the bottle to neutral");
  keep it free of the mechanism and of concept names.
- The analyzer proves the target is **reachable** with the offered tools (a
  bounded search) and that it is **not already satisfied** at the start
  (a trivial goal needs no action); it reports the fewest actions as
  `toolsNeeded`. Offer a read-only check tool (litmus / pH paper) alongside the
  transforming tool so the learner can watch progress.
- Reserve for genuine **transformations** framed as a goal: neutralisation
  (Activity 2.6), water of crystallisation (Activity 2.15).

## Prediction

- **Default to `predictionRequired: false` on every level.** The core loop —
  probe, read the evidence, classify — is the game; gating each tool behind a
  "what will happen?" pop-up interrupts that flow. Ship levels with prediction
  off unless there is a specific teaching reason to turn it on.
- **Prediction is only meaningful once the learner has evidence to reason from.**
  Asking "will the colour change?" on the very first probe of an unknown is a
  blind coin-flip, not a deduction — it feels like guessing and teaches nothing.
  If you turn it on at all, do it on a single early guided level *after* a related
  clue is already on the bench, so the "guess" is actually a reasoned expectation.
- Set `predictionRequired: true` on **at most one** early guided level, and never
  as the default across the ladder: the learner picks an expected `visual` before
  the tool is applied and the engine scores it against the real effect.
- `predictionRequired` applies only to free-probe goals (`classify`,
  `reach-target-state`). A `predict-outcome` goal always predicts, so the flag is
  ignored there — set it `false`.

## Authoring phases

Before writing files, complete these phases:

1. **Designer:** choose the hidden property axis, the categories, the tools, and
   the *designed ambiguity*; lay out the guided/hinted/open ladder.
2. **Science validator:** verify each property -> observation is physically true
   and each category is reachable by combining real causes.
3. **Executor:** encode the approved design as one `ExperimentGame`.
4. **Reviewer:** run `solveExperiment` on every level; reject any that is
   `bruteForceable`, `railed`, or not `winnable`, and reject any observation
   text that states an inference.
