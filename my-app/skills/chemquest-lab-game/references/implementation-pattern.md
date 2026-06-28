# Implementation Pattern

Use this pattern for ChemQuest Lab games. The ChemQuest investigation surface is
`SandboxLabViewport` from `@learn-loop/core/ui`. It renders its own full-screen
`9:16` shell (`<main className="sandbox-lab-app">`, `width: 100vw; height: 100dvh`)
and owns every region. Treat it as the page root, not an embeddable card.

## Package Imports

```tsx
import { SandboxLabViewport } from "@learn-loop/core/ui";
```

Import styles in `main.tsx` only:

```tsx
import "@learn-loop/core/ui/styles.css";
import "./style.css";
```

Do NOT import `@learn-loop/template/styles.css`. That stylesheet belongs to the
deprecated `LearnLoopGame` component and is not used by the ChemQuest viewport.

If the game uses core validators or scenario types:

```ts
import type {
  SandboxLabMission,
  SandboxLabMissionPresentation,
  Scenario,
} from "@learn-loop/core";
```

## Render Pattern

Return the viewport directly as the root element. Do not wrap it in a centering
shell. You may pass an optional `theme` prop to pick a skin (see Theming below);
omit it for the default look.

```tsx
export function App() {
  const [missionIndex, setMissionIndex] = useState(0);
  const mission = sandboxLabMissions[missionIndex];
  const missionTitles = sandboxLabMissions.map((entry) => entry.scenario.title);

  return (
    <SandboxLabViewport
      key={mission.scenario.id}
      title={gameTitle}
      eyebrow={`Chapter 5 · Class ${mission.scenario.grade}`}
      mission={mission}
      missionIndex={missionIndex}
      missionCount={sandboxLabMissions.length}
      missionTitles={missionTitles}
      onSelectMission={setMissionIndex}
      theme={{ palette: "warm-lab", accent: "amber", intensity: "standard" }}
    />
  );
}
```

## Theming

`SandboxLabViewport` accepts an optional `theme` prop. It only changes the skin
and one safe layout knob — it never moves, resizes, or reorders regions. Pick
tokens that fit the chapter mood; unknown values fall back to the default
(`clean-lab` / `blue` / `standard`).

| Field | Allowed values | Effect |
| :-- | :-- | :-- |
| `palette` | `clean-lab`, `warm-lab`, `night-lab`, `field-notes` | Surface, card, bench, station, and text colors |
| `accent` | `blue`, `green`, `amber`, `rose` | Active/selected buttons and primary calls to action |
| `intensity` | `calm`, `standard`, `high-contrast` | Shadow depth and heading weight |
| `headerDensity` | `standard`, `compact` | HUD row height (gives the experiment stage more room) |

Rules:
- The `theme` prop is the only supported way to change appearance. Do not write
  CSS that overrides `--sl-*` variables, `.sandbox-lab-app`, `.sandbox-lab-frame`
  grid rows, or region geometry.
- Pass tokens by name only. Do not invent palette/accent/intensity values.
- Theming is optional. A game with no `theme` prop still renders a finished skin.

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
- pass a validated `SandboxLabMission` into `SandboxLabViewport`
- pass mission titles and `onSelectMission`

The app should not:
- wrap the viewport in a `.game-shell` / centering / padded container
- build its own mission menu
- build its own station layout
- build its own tool tray
- replace template feedback/notebook regions

## Styling

`style.css` should only reset the document so the full-screen viewport can fill
it. Use exactly this shape:

```css
html,
body,
#root {
  width: 100%;
  height: 100%;
  margin: 0;
  overflow: hidden;
}
```

Game-local CSS must NOT:
- add an outer centering wrapper, `min-height: 100vh`, or page padding around the
  viewport (this collapses the `.sandbox-lab-frame` grid and overlaps regions)
- add a decorative gradient background behind the viewport
- change `.sandbox-lab-app`, `.sandbox-lab-frame` grid rows,
  `.sandbox-lab-stage`, `.sandbox-tool-dock`, or investigation region order
- restyle station vessels unless the core package itself is being intentionally
  improved
