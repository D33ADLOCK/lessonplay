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

## Goal and the evidence gate

`ExperimentGoal = { classifyIds, categoryIds }`

- `classifyIds` are the samples the learner must classify; leave the
  control/reference out so it aids reasoning without being graded.
- `categoryIds` are the choices offered; every classify sample's `category` must
  be among them, with at least two distinct categories in play (or the analyzer
  flags `bruteForceable`).
- The runtime reducer (`canClassify`) blocks the classify step until **every**
  classify sample has been probed at least once, so the goal cannot be reached
  by pure guessing. Design levels assuming the learner has gathered evidence.

## Prediction

- **Default to `predictionRequired: false` on every level.** The core loop —
  probe, read the evidence, classify — is the game; gating each tool behind a
  "what will happen?" pop-up interrupts that flow. Ship levels with prediction
  off unless there is a specific teaching reason to turn it on.
- Set `predictionRequired: true` on **at most one** early guided level when you
  want to teach the predict beat once: the learner picks an expected `visual`
  before the tool is applied and the engine scores it against the real effect.
  Never make it the default across the ladder.

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
