# Lantern Run · Light the Festival (lantern-run)

A vertical slice of an educational physics game for Classes 6–7. The player is a
lantern courier who launches lantern carts across different surfaces to reach
villagers and bring a storm-darkened festival back to life. Force and friction
are the systems underneath the adventure — _physics creates the consequences;
the consequences create emotion_.

Tracking issue: [#10](https://github.com/D33ADLOCK/game-code/issues/10).

## Status

Built slice by slice (see issues #11–#18). **Slice 1 (#11)** establishes the
walking skeleton: it boots a Phaser scene under a DOM overlay shell and lays
down the reusable module boundaries every later slice builds on.

## Run

```bash
npm install
npm run dev        # http://localhost:5180
```

## Develop, test, build

```bash
npm run typecheck  # tsc --noEmit (strict)
npm test           # Vitest — pure domain/contract tests (no Phaser/DOM)
npm run build      # typecheck + Vite production build
npm run e2e        # Playwright browser + mobile-viewport flows
```

Append `?debug=1` to the URL to expose simulation state on
`window.__lanternRunDebug`.

## Stack

- **TypeScript + Vite + Phaser** for the 2D runtime (no React).
- **DOM/CSS overlays** for menus, settings, accessible controls and text-heavy
  feedback.
- **Vitest** for deterministic domain behaviour; **Playwright** for browser and
  mobile flows.
- Simulation state is kept **outside** Phaser renderer objects and advanced on a
  fixed timestep for reproducible outcomes.

## Architecture boundaries

The code is split into three layers (mirroring PRD #10 "Architecture
Boundaries"). The two reusable layers must stay game-neutral so the next
educational game can reuse them; only `game/` may assume lanterns, sliding,
friction or a festival.

```
src/
  platform/        # reusable platform services (no game assumptions)
    lifecycle/     # scene keys & transitions
    input/         # semantic input actions + bus
    overlay/       # responsive DOM overlay shell (modal blocking)
    save/          # versioned localStorage with migration + recovery
    content/       # generic content load + validation primitives
    progression/   # scoring / stars / personal-best contracts
    settings/      # audio + reduced-motion store
    assets/        # declarative asset manifest
    debug/         # simulation inspection (?debug=1)
  emotional/       # reusable, event-driven emotional-gameplay layer
    events/        # GameplayEventStream — the spine; game-neutral events
    reactions/     # ReactionDirector — events → character beats
    world/         # WorldTransformer — persistent lights/decor/music layers
    feedback/      # ContextualFeedback — prediction vs. outcome
    celebration/   # CelebrationIntensity — scaled by result quality
  game/            # Lantern Run specific
    sim/           # deterministic cart sim + surface/friction model
    scenes/        # Phaser scenes
```

### Extension points (for the next game)

- Emit your game's events through `GameplayEventStream`; subscribe reactions,
  world transformations, feedback and celebration to them. No system assumes
  this game's mechanics.
- Provide an `AssetManifest`, a content `Validator`, and a `Scorer`; the platform
  layer handles loading, validation, persistence and progression generically.

## License / credits

Part of the `game-code` collection. See the repository root `CLAUDE.md`.
