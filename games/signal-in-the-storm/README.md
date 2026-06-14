# Signal in the Storm

Tracking issue: [#20](https://github.com/D33ADLOCK/game-code/issues/20)

The first walking skeleton for the Repair-and-Restore Adventure Template. A
typed React story beat opens a Phaser repair board, which evaluates a
framework-independent circuit and returns typed evidence and world-consequence
events to the React shell.

The introduction now includes a reusable visual-novel presentation with typed
multi-beat dialogue, five expression states for Mira and Kabir, Ms. Rao's radio
state, typewriter/tap/keyboard progression, skip behavior, storm transitions,
and locally bundled project-original assets. See `ASSETS.md`.

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:5181`.

## Verify

```bash
npm run typecheck
npm test
npm run build
```

## Boundaries

- `src/domain/`: deterministic circuit and story rules; no React or Phaser.
- `src/contracts/`: typed content, level, circuit, event, and consequence APIs.
- `src/bridge/`: narrow command/event channel shared by React and Phaser.
- `src/game/`: disposable Phaser presentation and input adaptation.
- `src/ui/`: React story presentation and application coordination.
