# Chapter Activities → Game

How to turn a science chapter's hands-on **Activities** into the pieces of an
ExperimentLab game. Read this after `model-contract.md` (which owns the exact
tool / visual / readout vocabulary) and after you have an approved brief.

The engine's core loop is always **probe hidden samples with tools and read the
evidence**; what the level asks for that evidence is one of three `goal` kinds
(see `gameplay-contract.md` → "Goals"):

- **`classify`** — sort each sample into a category. The workhorse; most
  Activities become *tools* that feed one classify goal.
- **`predict-outcome`** — call a reaction's visible result before it runs.
- **`reach-target-state`** — drive a sample to a goal state (e.g. neutral).

Everything below is about mapping a chapter's Activities onto those pieces.

## Each Activity plays one of three roles

1. **A test → a `tool`.** An Activity where the student *does something to a
   substance and observes a result* becomes a tool with an observable effect
   (and usually a `readout`). This is most Activities.

   | Chapter Activity (example) | Tool | Observable / readout |
   | :-- | :-- | :-- |
   | Dip litmus / an indicator | `litmus` | `color-change` + readout `color` (red/blue) |
   | Test with pH paper | `ph-paper` | `ph-scale` + readout `ph-scale` (`"0"`–`"14"`) |
   | Pass current through the solution | `conductivity` | `conductivity` + readout (`"on"`/`"off"`) |
   | Drop in a metal (Zn) | `zinc` | `gas` + `gasLabel` (`"H₂"`) |
   | Add dilute acid to the sample | `acid` | `gas` + `gasLabel` (`"CO₂"`) for carbonates |
   | Pass the gas through lime water | `limewater` | `precipitate` (milky) |
   | Warm / feel the temperature | `thermometer` | `temperature` + readout (`hot`/`warm`/`cold`) |
   | Smell it (olfactory indicator) | (custom id) | `odour` + readout (e.g. `pungent`) |

   Use `model-contract.md` for the authoritative id/visual/readout enums. Any
   id outside the table still works (generic icon); the *visual* and *readout*
   must be from the fixed vocabulary.

2. **A concept → a `category`.** The idea an Activity is teaching becomes a
   category the player discovers (acid / base / neutral salt; solution /
   suspension / colloid). Categories are the *answers*, named only at the reveal.
   Aim for **2–5** categories per game.

3. **A reaction → a `predict-outcome` or `reach-target-state` goal.** An Activity
   whose point is a *transformation* rather than an *identification* becomes a
   level with one of the non-classify goals, on the **same** shared bench/rules:
   - A reaction whose **visible event** is the lesson (metal + acid → H₂;
     carbonate + acid → CO₂) → a `predict-outcome` level: the learner calls
     "gas or nothing?" before each probe. Author prompts whose *visuals* differ.
   - A transformation framed as a **goal to achieve** (neutralisation → "make it
     neutral"; water of crystallisation → "heat, then rehydrate to blue") →
     a `reach-target-state` level, driven by a tool that carries `setState`.

   Only defer an Activity that is neither an identification nor an interactive
   transformation (writing formulae/equations, a purely olfactory step with no
   usable cue). List those as deferred rather than bending them into a fake
   classification.

## Turning the mapped pieces into a level

- **Samples** are the unknowns on the bench. Give each hidden `properties` that
  the rules read (the ground truth), a `categoryId`, and a `revealLabel`. Two
  samples that should behave the same must share the same property values.
- **Designed ambiguity is the fun *and* the fairness guarantee.** Pick at least
  one pair of *different-category* samples that produce the **same evidence on
  the obvious tests** and split only on **one specific test**. (Neutral salt vs
  sugar look identical to litmus and pH — only conductivity separates them.)
  That pair is what forces "combine causes", and it is why the analyzer will
  score the level as not `railed` and not `bruteForceable`.
- **The ladder** falls out of the Activities:
  1. **Guided** — one test, one or two samples: teach the player to *read* one
     kind of evidence.
  2. **Hinted** — all samples, the ambiguous pair present, ordered hints on.
  3. **Open** — all samples, every test, no hints: the real identification.
  4. **Transformation levels (optional)** — after the classify ladder, add any
     `predict-outcome` / `reach-target-state` levels on the same bench for the
     chapter's reaction Activities. They reuse the rules you already authored
     (add a `setState` tool where a reach goal needs one).

## The gate is the source of truth

Do not hand-tune around the analyzer. Author the mapping, then run
`validateExperimentMission`: it proves every level is winnable by reasoning,
not railed, and not brute-forceable. If a mapped level fails, the fix is a
design fix (add a discriminating test, or a sharper hidden property), never a
tester-specific hack. See `validation-checklist.md`.
