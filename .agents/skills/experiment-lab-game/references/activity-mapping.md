# Chapter Activities → Game

How to turn a science chapter's hands-on **Activities** into the pieces of an
ExperimentLab game. Read this after `model-contract.md` (which owns the exact
tool / visual / readout vocabulary) and after you have an approved brief.

The engine plays exactly one kind of game: **the learner probes hidden samples
with tools, reads the evidence, and classifies each sample into a category.**
Everything below is about mapping a chapter onto that one loop.

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

3. **Out of scope → defer.** An Activity whose point is a *transformation or a
   step-by-step process* rather than an *identification* does not fit the
   classify loop:
   - neutralisation as "reach a neutral solution",
   - water of crystallisation as "heat, then rehydrate",
   - any "carry out these steps in order" demonstration.

   The engine classifies unknowns; it does not (yet) model reach-a-target or
   predict-the-outcome goals. List these Activities as deferred rather than
   bending them into a fake classification.

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

## The gate is the source of truth

Do not hand-tune around the analyzer. Author the mapping, then run
`validateExperimentMission`: it proves every level is winnable by reasoning,
not railed, and not brute-forceable. If a mapped level fails, the fix is a
design fix (add a discriminating test, or a sharper hidden property), never a
tester-specific hack. See `validation-checklist.md`.
