---
name: discovery-game-planner
description: "Turns a science chapter, textbook passage, or set of classroom Activities into an approved Discovery Game Brief for a cause-and-effect ExperimentLab game — where the player probes a consistent world and reasons from evidence to identify unknowns, predict a reaction, or reach a target state. Use when the user wants a discovery / identify-the-unknown science game from source material and no approved brief exists yet: it decides archetype fit, the categories to discover, which Activities become tools, the designed ambiguity that makes it fun, the level ladder, and any transformation beats, then stops and hands off to experiment-lab-game. Do not use once a brief is approved and the user asks to build."
---

# Discovery Game Planner

Use this skill to turn source material into a **builder-ready plan** for a
discovery game on the ExperimentLab engine. Its whole job is to decide *what to
build and why*; it does **not** write source files, choose engine ids, or
publish. When the plan is approved, `experiment-lab-game` builds it.

Split the thinking from the building on purpose: level and stage design — which
concepts to teach, which Activities become tests, and where the fun lives — is
its own reasoning step, done before any code.

Do **not** use this skill when the conversation already contains an approved
`# Discovery Game Brief` and the latest message asks to build, start, continue,
or create the game. In that case hand off to `experiment-lab-game`.

## Is it a discovery game? (fit)

Plan an ExperimentLab discovery game when the concept is **reasoning from
evidence** — the learner probes a consistent world and must think, not follow
steps. That reasoning can take three shapes, and a chapter often mixes them:

- **Identification** (the workhorse): "Which unknown is an acid / a base / a
  salt?" "Sort these into solution / suspension / colloid." Tell samples apart by
  what a test *shows* (colour, pH, a gas, a glowing bulb, a precipitate,
  settling), gathering and combining clues before deciding.
- **Predict a reaction**: "Will the metal bubble a gas here, or do nothing?" —
  the learner calls a reaction's visible result before it happens.
- **Reach a target**: "Neutralise the acid until it's neutral", "heat the
  crystal white, then rehydrate it to blue" — the learner *drives* a sample to a
  goal state.

Route **away** from this archetype when:

- the point is a **guided, step-by-step demonstration** → use the ChemQuest /
  guided-sim path (`chemistry-concept-planner` / `chemquest-lab-game`),
- the concept is mainly **memorisation, equations, or symbols** — there is
  nothing to probe.

## Workflow

1. Read the user's chapter, passage, summary, or concept.
2. List the chapter's hands-on **Activities**.
3. Sort each Activity into a role: a **test** the player runs (a tool), a
   **concept** the player discovers (a category), a **transformation** the player
   drives or predicts (a reaction/target beat), or **out of scope** (formulae /
   memorisation / a step-by-step demo — defer it).
4. Choose one **atomic** game: 2–5 categories that a handful of unknown samples
   span, unless the user already picked the concept.
5. Design the **designed ambiguity** — at least one pair of different-category
   samples that look identical to the obvious tests and split on exactly one
   test. This is the fun and the fairness of the game; a plan without it becomes
   a one-click slideshow.
6. Outline the **level ladder**: guided (teach one read) → hinted (all samples,
   the ambiguity present, hints) → open (all samples, every test, no hints).
   Then, if the chapter has transformation Activities, append a **predict-a-
   reaction** and/or **reach-a-target** level on the same bench.
7. Write exactly one `# Discovery Game Brief` (template below).
8. **Stop.** Ask the user to approve the brief or request edits. On approval,
   `experiment-lab-game` turns it into a validated game.

## Stay at the design level — the builder owns capabilities

This is the anti-drift rule. Describe each test by its **real-world name** and
the **observation a student would record** ("dip litmus → it turns red", "pass
current → the bulb lights"), and each transformation beat in plain pedagogy
terms ("add base until the acid reads neutral", "predict whether the metal
bubbles"). Do **not** invent or commit to engine tool ids, `visual` kinds,
`readout` kinds, or the exact goal-type identifiers — those live in
`experiment-lab-game`'s `model-contract.md` / `gameplay-contract.md`, and
`validateExperimentMission` is the final gate. Keep beats to the three shapes the
engine reasons about (identify from evidence, predict a reaction's visible
result, reach a target state); anything outside those — a beat that needs new
apparatus or a genuinely non-interactive step — is out of scope, so flag it
rather than assuming the builder can do it. You cannot over-promise a capability
you never name.

## The brief

```markdown
# Discovery Game Brief

## Concept
<chapter, class level, and the one atomic idea this game teaches>

## Why discovery (the misconception)
<the wrong idea a learner holds that probing the evidence corrects>

## Categories to discover (2–5)
- <label> — <one-line definition> — told apart by <the distinguishing evidence>
- ...

## Samples (the unknowns on the bench)
- <public label> — really <identity> — category <label> —
  ground truth: <plain-language hidden properties the tests read>
- ... (add a control / reference sample if it aids reasoning)

## Tests (chapter Activities → tools)
- <real-world test name> (Activity <n>) — done to <what> —
  the student records <the observation / reading>
- ...

## Designed ambiguity (the fun + the challenge)
<name the lookalike pair(s): which samples share evidence on the obvious tests
and split only on ONE test, forcing the player to combine causes>

## Level ladder
1. Guided — <one test, 1–2 samples: teach the read>
2. Hinted — <all samples, the ambiguity present, hints on>
3. Open — <all samples, every test, no hints>

## Transformation beats (optional — only if the chapter has them)
- Predict-a-reaction — <which reaction, on which samples; the visible call the
  learner makes, e.g. "gas or nothing?">
- Reach-a-target — <which sample, driven to what goal state, with which test to
  check progress, e.g. "add base until it reads neutral">

## Out of scope / deferred
<any Activity that is none of: identify from evidence, predict a reaction, reach
a target — e.g. writing formulae/equations, pure memorisation, or a step-by-step
demo — mark deferred with the reason>
```

After approval, hand off to `experiment-lab-game`, which authors the
`ExperimentDefinition` + categories + level ladder as data, gates it with
`validateExperimentMission`, and renders it through `ExperimentLabViewport`.
