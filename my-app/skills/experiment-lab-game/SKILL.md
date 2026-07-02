---
name: experiment-lab-game
description: "Author ExperimentLab cause-and-effect learning games on the @learn-loop/core experiment engine: a consistent simulation the learner probes (Predict -> Act -> Observe -> Reconcile) to classify hidden samples. Use for discovery-driven science games where the player must reason from evidence rather than follow a guided slideshow, and for any game built around the rule-driven ExperimentDefinition / ExperimentGame model and its validator + analyzer gates."
---

# ExperimentLab Game

Use this skill to author a **cause-and-effect** learning game on the
ExperimentLab engine in `@learn-loop/core`. Where the SandboxLab / ChemQuest
template (`chemquest-lab-game`) authors a fixed outcome per `material x tool`
and rails the player down a fixed path, ExperimentLab models a tiny
**consistent simulation**: every sample carries hidden ground-truth
`properties`, every tool is an operator, and a first-match-wins `ruleSet`
computes the visible effect from those properties. The same cause always yields
the same effect, so the learner can probe freely and build a real mental model.

This is the right skill when the goal is *discovery* — the player must reason
from evidence to classify hidden samples — not a step-by-step demonstration.

> **Status:** the headless engine, analyzer, validator, and session reducer are
> built and tested in `@learn-loop/core`, and the React render surface
> (`ExperimentLabViewport`) now ships from `@learn-loop/core/ui` with its
> dark-glow stylesheet at `@learn-loop/core/ui/experiment.css`. Author the game
> *data* with this skill, gate it with `validateExperimentMission`, then render
> it through `ExperimentLabViewport` — never a hand-built surface. See
> `references/validation-checklist.md`.

## The loop

```text
Predict -> Act -> Observe -> Reconcile  ->  (enough evidence)  ->  Classify -> Reveal
```

The learner predicts what a tool will do, applies it, sees a neutral
observation of what happened, and updates their thinking. They never read the
inference; they make it. Concept names are withheld until after a correct
classification ("discovery before naming").

> **Prediction is off by default.** Ship levels with `predictionRequired: false`
> — the probe → read → classify loop is the game. Turn prediction on for at most
> one early guided level if you want to teach the beat once. See
> `references/gameplay-contract.md`.
>
> **Animated visuals:** the `Beaker` animates all of `beam`, `settle`, `residue`,
> `fizz`, `color-change`, `gas`, and `precipitate` (`gas` can carry a `gasLabel`
> chip like "H₂"), plus `conductivity` (bulb glow), `temperature` (thermometer),
> `ph-scale` (0–14 strip), and `odour`. See `references/model-contract.md` for
> tool → visual pairings.
>
> **Structured readouts (evidence, not prose):** attach an optional
> `readout: { kind, value }` to an effect to record the *specific* clue — e.g.
> `{ kind: "color", value: "red" }`, `{ kind: "ph-scale", value: "2" }`,
> `{ kind: "conductivity", value: "on" }`, `{ kind: "temperature", value: "hot" }`,
> `{ kind: "odour", value: "pungent" }`. Readout `value` (and `gasLabel`) feed the
> distinguishability signature, so two effects that share a `visual` but differ in
> their readout (red vs blue litmus, bulb on vs off, H₂ vs CO₂) are treated as
> distinct evidence. Prefer a readout whenever the clue is the *specific reading*
> rather than merely "something changed". Kinds are limited to
> `EXPERIMENT_READOUT_KINDS`; a `gasLabel` is only valid with `visual: "gas"`.

## Workflow

1. Confirm the conversation contains an approved plan — a `# Discovery Game
   Brief` from `discovery-game-planner`, a `# Chemistry Game Brief`, or an
   equivalent chapter/concept plan — naming the concept, the categories to
   discover, and the core misconception. If no such plan exists and the request
   starts from a chapter or raw concept, use `discovery-game-planner` first to
   produce and get approval on a brief; do not improvise the design here.
2. Read `references/model-contract.md` before writing any `ExperimentDefinition`.
3. Read `references/activity-mapping.md` to turn the brief's chapter Activities
   into tools, categories, the designed ambiguity, and the level ladder.
4. Read `references/gameplay-contract.md` before designing the level ladder.
5. Read `references/authoring-contract.md` before writing observation text,
   categories, predictions, or hints.
6. Read `references/validation-checklist.md` before reporting completion.
7. Author the game as data: one `ExperimentDefinition` (the consistent world)
   plus categories and a level ladder, exported as one `ExperimentGame`.
8. Validate with `validateExperimentMission` (structural + quality) and the
   per-level `solveExperiment`. Do not ship a level the analyzer flags.

Do not re-decide the learning objective or archetype. If the plan is incomplete
or contradicts ExperimentLab constraints, ask for a brief revision instead of
guessing.

## Non-negotiable architecture

```text
ExperimentGame (definition + categories + levels)  ->  @learn-loop/core experiment engine
  -> validateExperimentMission / solveExperiment (build-time gates)
  -> ExperimentLabViewport (render surface)
```

The author **may** write:
- one `ExperimentDefinition`: samples (with hidden `properties` + `categoryId`),
  tools, and a first-match-wins `ruleSet` with a `defaultEffect`.
- `ExperimentCategory[]` (the concept names, revealed last).
- an `ExperimentLevel[]` ladder (guided -> hinted -> open).
- neutral observation text, prediction beats, graduated hints, intro/outro copy.

The author **must not**:
- hand-author an outcome per `sample x tool` pair (use rules over `properties`).
- put a concept name or inference in any `observation` text (the validator
  rejects this).
- make a non-tutorial level winnable by a single tool or by guessing (the
  analyzer rejects `railed` / `bruteForceable`).
- invent visual kinds outside `EXPERIMENT_VISUALS` or readout kinds outside
  `EXPERIMENT_READOUT_KINDS`.
- build a custom render surface in place of `ExperimentLabViewport`.

## Why a rule engine, not authored pairs

Authoring per pair produces a slideshow: each cell is a hand-written reveal, so
there is nothing to *discover*. Driving every outcome from a hidden property
through shared rules makes the world consistent and reasoning possible — and it
lets the analyzer prove the level is winnable by reasoning but not by clicking.
This is the whole point of the template; do not work around it.

## Rendering

The render surface is shipped — do not hand-build a lab UI. Pass the authored
`ExperimentGame` straight into `ExperimentLabViewport`:

```tsx
import { ExperimentLabViewport } from "@learn-loop/core/ui";
import { game } from "../content/game";

export function App() {
  return <ExperimentLabViewport game={game} completionMessage="..." />;
}
```

- Import the dark-glow stylesheet exactly once, in `src/main.tsx`:
  `import "@learn-loop/core/ui/experiment.css";`. Do not import
  `@learn-loop/core/ui/styles.css` (that is the SandboxLab/ChemQuest skin).
- The default skin **is** the dark-glow lab (the Tyndall beam is the hero); you
  do not need a theme to get the black look. An optional `theme` prop accepts
  named tokens only — `palette` (`night-lab` | `warm-lab` | `abyss`), `accent`
  (`cyan` | `violet` | `amber`), `intensity` (`calm` | `standard` | `vivid`).
  Never override the `--*` CSS variables and never invent token values.
- `src/style.css` is only the full-height dark page shell the 9:16 viewport
  centres inside; the whole game UI (beaker, beam, readings grid, animations)
  lives in `experiment.css`.
