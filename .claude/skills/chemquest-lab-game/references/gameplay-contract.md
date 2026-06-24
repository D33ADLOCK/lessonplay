# Investigation Gameplay Contract

Use this contract for ChemQuest games where the learner must identify, classify,
compare, or choose a method from experimental evidence.

## Required Loop

```text
Mystery -> choose material and tool -> observe -> record evidence -> infer -> confirm
```

The learner must make the decision. Do not write an instruction that names the
correct sample and exact tool together.

## Hidden Identity

- Set `presentation.mode` to `"investigation"`.
- Give mystery materials public labels such as `Unknown A` or `Sample B`.
- Put the answer in `material.hiddenIdentity.revealLabel`.
- Add aliases that must remain hidden to `hiddenIdentity.forbiddenTerms`.
- Do not place hidden identities in questions, headings, stage copy, material
  descriptions, hints, or station labels.
- Internal entity ids are engine data, not learner-facing copy.

## Choice And Evidence

- Every stage must offer at least two material/tool combinations.
- The learner should choose both a sample and a tool whenever the experiment
  supports it.
- Each useful interaction must produce an observable result and an evidence id.
- Author at least one specific non-solution interaction with gentle feedback.
- Undefined pairs may use generic no-change feedback, but they are not a
  substitute for authored chemistry feedback.

## Notebook And Conclusion

- `feedbackCard.notebook` records the observation, not the answer.
- Stage progression depends on `requiredEvidence`.
- The correct conclusion must require all evidence needed by the stages.
- Provide at least two conclusion choices with exactly one correct answer.
- Reveal hidden identities only after a correct evidence-backed conclusion.

## Authoring Phases

Before writing files, complete these phases:

1. **Designer:** define the mystery, choices, evidence, conclusion, and at least
   one useful wrong action.
2. **Science validator:** verify every reaction, observation, and inference.
3. **Executor:** encode the approved design as scenario and presentation data.
4. **Reviewer:** reject the result if the answer is visible early, the learner
   only follows instructions, or the conclusion does not depend on evidence.

