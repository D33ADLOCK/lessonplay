---
name: discovery-game-planner
description: "Turns a science chapter, textbook passage, or set of classroom Activities into an approved Discovery Game Brief for a cause-and-effect ExperimentLab game — where the player probes hidden samples and classifies them from evidence. Use when the user wants a discovery / identify-the-unknown science game from source material and no approved brief exists yet: it decides archetype fit, the categories to discover, which Activities become tools, the designed ambiguity that makes it fun, and the level ladder, then stops and hands off to experiment-lab-game. Do not use once a brief is approved and the user asks to build."
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

Plan an ExperimentLab discovery game when the concept is an **identification
from evidence**:

- "Which of these unknowns is an acid / a base / a salt?"
- "Sort these into solution / suspension / colloid."
- tell samples apart by what a test *shows* (colour, pH, a gas, a glowing bulb,
  a precipitate, settling, a residue),
- gather several clues and combine them before deciding.

Route **away** from this archetype when:

- the point is a **guided, step-by-step demonstration** → use the ChemQuest /
  guided-sim path (`chemistry-concept-planner` / `chemquest-lab-game`),
- the point is a **transformation or a target state** — "neutralise it to
  pH 7", "heat the crystal then rehydrate it", "titrate to the endpoint". The
  engine classifies unknowns; it does **not** yet model reach-a-target or
  predict-the-outcome goals. Say so and defer, or pick a different concept.
- the concept is mainly **memorisation, equations, or symbols** — there is
  nothing to probe.

## Workflow

1. Read the user's chapter, passage, summary, or concept.
2. List the chapter's hands-on **Activities**.
3. Sort each Activity into a role: a **test** the player runs (a tool), a
   **concept** the player discovers (a category), or **out of scope** (a
   transformation / step-by-step demo — defer it).
4. Choose one **atomic** game: 2–5 categories that a handful of unknown samples
   span, unless the user already picked the concept.
5. Design the **designed ambiguity** — at least one pair of different-category
   samples that look identical to the obvious tests and split on exactly one
   test. This is the fun and the fairness of the game; a plan without it becomes
   a one-click slideshow.
6. Outline the **level ladder**: guided (teach one read) → hinted (all samples,
   the ambiguity present, hints) → open (all samples, every test, no hints).
7. Write exactly one `# Discovery Game Brief` (template below).
8. **Stop.** Ask the user to approve the brief or request edits. On approval,
   `experiment-lab-game` turns it into a validated game.

## Stay at the design level — the builder owns capabilities

This is the anti-drift rule. Describe each test by its **real-world name** and
the **observation a student would record** ("dip litmus → it turns red", "pass
current → the bulb lights"). Do **not** invent or commit to engine tool ids,
`visual` kinds, `readout` kinds, or goal types — those live in
`experiment-lab-game`'s `model-contract.md`, and `validateExperimentMission` is
the final gate. If a beat the source suggests needs something beyond "classify
unknowns from what tests show", flag it as out of scope in the brief rather than
assuming the builder can do it. You cannot over-promise a capability you never
name.

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

## Out of scope / deferred
<any Activity that is a transformation or a step-by-step demo rather than an
identification — mark deferred; note the engine classifies and does not yet
model reach-a-target goals>
```

After approval, hand off to `experiment-lab-game`, which authors the
`ExperimentDefinition` + categories + level ladder as data, gates it with
`validateExperimentMission`, and renders it through `ExperimentLabViewport`.
