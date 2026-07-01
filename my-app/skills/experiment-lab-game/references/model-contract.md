# Model Contract

Author the game as `ExperimentGame` data from `@learn-loop/core`. All types are
exported from the package root.

## Required shape

```text
ExperimentGame
  id, title, conceptName?
  definition: ExperimentDefinition
    samples: ExperimentSample[]
    tools:   ExperimentTool[]
    ruleSet: ExperimentRuleSet
  categories: ExperimentCategory[]
  levels:     ExperimentLevel[]
```

## Samples

`ExperimentSample = { id, label, properties, categoryId, revealLabel? }`

- `properties` is the **hidden ground truth** the simulation reasons over
  (e.g. `{ particleSize: "coarse" }`). Never shown to the player.
- `label` is the public, learner-facing name (`"Unknown B"`). Never the answer.
- `categoryId` is the classification answer; it must match an `ExperimentCategory.id`.
- `revealLabel` is the optional real-world identity for the reveal
  (`"chalk water"`).
- Drive every outcome from `properties`. Two samples that should behave
  identically must share the same property values — the engine is consistent by
  construction, so do not try to make "the same thing" behave two ways.
- Include a **control / reference** sample where it aids reasoning. A control is
  present on the bench but is left out of `goal.classifyIds` (it is not graded).

## Tools

`ExperimentTool = { id, label, description? }`

- A tool is an operator over sample state, not a fixed answer key.
- Every tool offered in a level must have at least one rule that fires for it,
  or the validator flags it as inert.

## Rules

`ExperimentRuleSet = { rules: ExperimentRule[], defaultEffect: ExperimentEffect }`
`ExperimentRule = { toolId, when, effect }`

- Rules are **first-match-wins**: order specific `when` constraints before
  general ones.
- `when` is a set of property constraints; **all** must match the sample's
  current state for the rule to fire.
- `defaultEffect` fires for any tool/state combination no rule covers, keeping
  the world consistent (typically a neutral "nothing observable happens").
- Use `effect.setState` to make a cause persist so later causes can depend on it
  (e.g. a suspension becomes `settled` after standing). State threads through a
  sequence via `runExperimentSequence`.

## Effects and visuals

`ExperimentEffect = { observationId, observation, visual, gasLabel?, setState? }`

- `observationId` is a stable handle; the same id must always carry the same
  `observation` text (the validator enforces this).
- `observation` describes **only what is seen**, never the inference. See
  `authoring-contract.md`.
- `visual` must be one of `EXPERIMENT_VISUALS`:
  `"beam" | "settle" | "residue" | "fizz" | "color-change" | "gas" |
  "precipitate" | "none"`. All eight are animated by the `Beaker`.
- `gasLabel?` is a short gas token shown as a chip on the escaping bubbles, e.g.
  `"H₂"` / `"CO₂"` / `"O₂"`. Set it only when `visual === "gas"`; when the chip
  names the gas, keep `observation` sensory and neutral instead of repeating the
  gas identity. Ignored for every other visual.
- **Distinguishability is measured on `visual`**, not on `observationId` or
  text. Two samples that should be hard to tell apart must share the same
  `visual` for the ambiguous tool (this is how a "designed ambiguity" is made
  mechanically real — see `gameplay-contract.md`).

### Typical tool → visual pairings

Tool ids are free-form data; the viewport only uses them for an icon (with a
generic fallback). These are the conventional pairings the icon set and the
animated visuals are built around:

| Tool id | Icon | Usual visual(s) |
| :-- | :-- | :-- |
| `light` | 🔦 | `beam` (Tyndall) |
| `settle` | ⏳ | `settle` |
| `filter` | 🧪 | `residue` |
| `acid` | 💧 | `fizz` / `gas` (H₂, CO₂) |
| `heat` / `flame` | 🔥 | `fizz` / `gas` / `color-change` |
| `base` | 🧴 | `color-change` / `precipitate` |
| `litmus` | 🟪 | `color-change` |
| `limewater` | 🥛 | `precipitate` (milky) |
| `water` | 💧 | (dissolving — usually `none` for now) |
| `magnet` | 🧲 | `none` (magnetic = a non-visual property) |
| `evaporate` | ♨️ | `residue` |
| `stir` | 🥄 | (mixing — usually `none`) |

Any tool id outside this list still works; it just renders the generic 🔬 icon.

## Categories

`ExperimentCategory = { id, label, definition? }`

- `label` is the concept name revealed last (`"Colloid"`). Keep it out of all
  observation text.
- `definition` is the one-line payoff shown in the reveal.
- Every `sample.categoryId` must reference a declared category id.

## Worked reference

The tested gold-standard fixture is the "Invisible Particle Detective" bench:
one hidden property `particleSize` (`tiny` / `fine` / `coarse`) plus three tools
(`light`, `settle`, `filter`) yields solution / suspension / colloid. See
`references/invisible-particle-detective.ts` for a complete, analyzer-passing
`ExperimentGame` that stays inside this skill's readable reference tree.
