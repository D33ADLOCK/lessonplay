# Implementation Pattern

Use this pattern for ChemQuest Lab games.

## Package Imports

```tsx
import {
  LearnLoopGame,
  createLearnLoopTemplatePresentation,
} from "@learn-loop/template";
import "@learn-loop/template/styles.css";
```

If the game uses core validators or scenario types:

```ts
import type {
  GuidedLabMissionPresentation,
  Scenario,
} from "@learn-loop/core";
```

## Render Pattern

```tsx
<LearnLoopGame
  key={scenario.id}
  title={gameTitle}
  eyebrow={`Chapter 5 · Class ${scenario.grade}`}
  scenario={scenario}
  config={templateConfig}
  presentation={createLearnLoopTemplatePresentation(guidedPresentation)}
  missionIndex={missionIndex}
  missionCount={missions.length}
  missionTitles={missionTitles}
  onSelectMission={setMissionIndex}
/>
```

## File Shape

Prefer:

```text
games/<slug>/
  package.json
  index.html
  vite.config.ts
  tsconfig.json
  src/
    main.tsx
    style.css
    ui/App.tsx
    content/missions.ts
  tests/
    setup.ts
    missions.test.ts
    App.test.tsx
```

## App Responsibilities

The app should:
- choose the active mission
- pass scenario data into `LearnLoopGame`
- choose allowed template config tokens
- pass mission titles and `onSelectMission`

The app should not:
- build its own mission menu
- build its own station layout
- build its own tool tray
- replace template feedback/notebook regions

## Styling

Game-local CSS may style:
- page background
- outer centering wrapper
- minor brand colors around the frame

Game-local CSS must not change:
- `.learn-loop-template` grid structure
- `.learn-loop-region` order
- `.learn-loop-tool-tray` layout
- station layout or vessel shapes unless the template package itself is being
  intentionally improved.
