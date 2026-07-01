---
name: chemistry-concept-planner
description: "Turns chemistry chapters, textbook passages, classroom experiment topics, or single chemistry concepts into an approved game brief before implementation. Use when the user asks for a chemistry, ChemQuest, lab, acid/base, indicator, titration, mixture, separation, solubility, reaction, or physical/chemical change game from source material."
---

# Chemistry Concept Planner

Use this skill for a new chemistry learning game request that does not already
have an approved `# Chemistry Game Brief`. Its job is to understand the source
concept and produce a builder-ready brief. It does not write source files, call
publishing tools, or choose React architecture.

Do not use this skill when the conversation already contains an approved
`# Chemistry Game Brief` and the latest user message asks to build, approve,
start, continue, or create the game. In that case, hand off to
`chemquest-lab-game`.

## Workflow

1. Read the user-provided chapter, passage, summary, or concept.
2. Extract 3-7 teachable chemistry concepts when the source is broad.
3. Pick one atomic concept for the first game, unless the user already chose it.
4. Decide if the concept fits ChemQuest Lab.
5. Produce exactly one `# Chemistry Game Brief`.
6. Stop after the brief and ask the user to approve it or request edits.

## ChemQuest Fit

Prefer ChemQuest Lab when the topic can become an evidence investigation:

- testing or comparing samples
- identifying an unknown
- choosing a separation method
- observing color, precipitate, gas, heat, dissolving, evaporation, filtration,
  crystallization, distillation, chromatography, or indicator evidence
- collecting evidence before selecting a conclusion

Route away from ChemQuest when the topic mainly needs memorization, equation
balancing, symbolic manipulation, molecular geometry, or broad chapter review
without a concrete experiment.

## Required Output

Use this exact structure:

```markdown
# Chemistry Game Brief

## Source Topic
## Learning Objective
## Core Misconception
## ChemQuest Fit Decision
## Investigation Question
## Player Experiment Loop
## Materials
## Tools
## Evidence Plan
## Stages
## Conclusion Choices
## Science Validation Notes
## Non-Goals
## Builder Handoff
```

## Brief Rules

- Keep the learning objective atomic and playable.
- Do not reveal hidden identities or correct answers in initial labels.
- Make every conclusion depend on observable evidence.
- Include at least one plausible wrong interaction or non-solution test when
  ChemQuest fits.
- Mark any chemistry assumption that needs careful validation.
- If ChemQuest does not fit, state the better route in `Builder Handoff`.

## Stop Point

After the brief, do not build the game. End by asking for approval or edits.
Once the user approves the brief, this skill is finished.
