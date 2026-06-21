---
name: learn-loop-chapter-game
description: "Build chapter-based chemistry and guided lab games using the Learn Loop engine/UI references, while publishing a single browser-runnable HTML artifact."
---

# Learn Loop Chapter Game

Use this skill when the user asks for a chemistry chapter, textbook section,
lab-style activity, mixture/separation topic, or a game that should reuse the
Learn Loop engine and UI layer.

## Output Contract

- The final product is still one self-contained browser-runnable HTML artifact.
- Do not ask the user to run a local dev server for the final game.
- Do not create or modify repo files directly from the chat runtime.
- Use Learn Loop source modules as the authoring shape, then publish through the
  app's Learn Loop publishing flow once that tool is available.
- Until a Learn Loop publishing tool is available, draft the virtual source
  files in chat and do not call `publishGame` for Learn Loop games.

## Authoring Shape

Generate virtual files in this shape:

```text
src/main.tsx
src/ui/App.tsx
src/content/missions.ts
src/style.css
tests/missions.test.ts
```

The runtime/tooling will later bundle these files into one HTML file.

## Reference Files

Use `readSkillReference` for Learn Loop contracts and examples:

```text
learn-loop-chapter-game/references/learn-loop-core/src/index.ts
learn-loop-chapter-game/references/learn-loop-core/src/model/scenario.ts
learn-loop-chapter-game/references/learn-loop-core/src/model/sandboxLab.ts
learn-loop-chapter-game/references/learn-loop-core/src/model/guidedLabPresentation.ts
learn-loop-chapter-game/references/learn-loop-core/src/ui/index.ts
learn-loop-chapter-game/references/mixture-methods-lab/src/content/missions.ts
learn-loop-chapter-game/references/mixture-methods-lab/src/ui/App.tsx
learn-loop-chapter-game/references/mixture-methods-lab/tests/missions.test.ts
```

## Chemistry Sandbox Lab Defaults

Use sandbox lab for chemistry and mixture chapters when the learning loop is:

```text
Explore -> Observe -> Conclude
```

Prefer:

- `Scenario` and declarative `Rule` transforms from `@learn-loop/core`.
- `SandboxLabMissionPresentation` for lab intent.
- `SandboxLabViewport` from `@learn-loop/core/ui`.
- Content authored as material/tool interactions that produce evidence.
- Feedback cards for meaningful actions.
- Notebook evidence before conclusions.
- Useful wrong tools that teach a property difference.

Use only validated tags, reaction effects, sound cues, and station visual kinds
from the Learn Loop references. Do not invent visual/effect names.

## Guided Lab Defaults

Use guided lab when the user wants a more linear step-by-step sequence:

- `GuidedLabMissionPresentation`
- `GuidedLabViewport`
- Predict -> act -> observe -> explain steps

## Planning Flow

1. Extract 3-7 teachable concepts or lab observations from the chapter.
2. Pick sandbox lab or guided lab.
3. Propose a short mission list and stop for user choice when the chapter can
   support multiple directions.
4. After the user chooses, author scenario/presentation data first.
5. Keep UI code minimal and reuse Learn Loop UI shells.
6. Include tests that validate every scenario and presentation pair.

## Validation Expectations

The eventual publisher should validate:

```bash
npm run typecheck --workspace @learn-loop/core
npm test --workspace @learn-loop/core
npm run typecheck --workspace <generated-game>
npm test --workspace <generated-game>
npm run build --workspace <generated-game>
```

In generated tests, call:

```ts
validateScenario(...)
validateSandboxLabPresentation(...)
```

or:

```ts
validateGuidedLabPresentation(...)
```

depending on the chosen archetype.
