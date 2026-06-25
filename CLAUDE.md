# LessonPlay — educational-game studio and game collection

This repository contains the LessonPlay product, shared learning-game packages,
and a collection of small games. Each reference game lives in its own folder under
`games/<slug>/` and is self-contained unless explicitly listed as a workspace consumer.

`AGENTS.md` is a symlink to this file, so Claude Code and Codex read the same guidance.

## Current games

- `games/moon-jump-vs-earth-jump/` — React + Vite game comparing Moon vs Earth jump
  physics. Run with `npm install && npm run dev` inside that folder. This game does
  **not** use crisp-game-lib and is **not** subject to the one-button validation gate below.
- `games/physics-quest-lab-escape/` — "Physics Quest: Lab Escape", a JSON-driven,
  mission-based physics puzzle game for Class 6–7 (Force & Friction chapter). Vanilla
  JS + Canvas, no build; run with `npm run dev` (or `python3 -m http.server`) inside the
  folder. New chapters are added as JSON files under `chapters/` with no engine changes.
  Also **not** a crisp-game-lib game and **not** subject to the one-button validation gate.
- `games/physics-forge-rescue-lab/` — a TypeScript + Vite + Matter.js construction
  puzzle for Class 7. Players build wheeled contraptions, predict their behavior, and
  rescue a capsule across six physics missions. Run with `npm install && npm run dev`
  inside the folder. This game is not subject to the one-button validation gate.
- `games/separation-bench/` — a React + Vite guided-sim game for separation of
  mixtures. It is an explicit exception to the fully self-contained game rule:
  it imports the shared `@learn-loop/core` package through the scoped root npm
  workspace. Run workspace commands from the repo root or `npm install && npm run dev`
  inside the folder.
- `games/mixture-methods-lab/` — a React + Vite guided-sim chapter game using
  `@learn-loop/core` scenarios plus the shared `GuidedLabViewport` 9:16 template.
  It is also an explicit scoped-workspace consumer.

## Game-creation skills

The `.agents/skills/` (and mirror `.claude/skills/`) directory holds reusable skills
for designing and building games, ported from
`abagames/claude-one-button-game-creation`:

| Skill | Use it to |
| :-- | :-- |
| `designing-one-button-games` | Invent an original one-button (tap/hold/release) game from a theme or tags. |
| `designing-mini-games` | Design compact games that allow more than one input. |
| `implementing-gameplay-invariants` | Turn risk/reward prose into concrete, engine-neutral implementation invariants. |
| `developing-with-crisp-game-lib` | Implement a browser mini-game with crisp-game-lib. |
| `evaluating-gameplay-balance` | Diagnose and structurally improve balance from telemetry. |
| `maximizing-game-feel` | Add tactile polish to a game that runs but feels flat. |
| `physics-contraption-level-generator` | Convert Class 6–7 physics topics into validated JSON contraption-game levels. |
| `chapter-to-game` | Convert chapter material into a mechanic choice and scaffolded learning game. |

- **Claude Code** auto-discovers these from `.claude/skills/` (invoke via the Skill tool).
- **Codex** and other agents should read the `SKILL.md` files under `.agents/skills/`
  directly as referenced below.

The two directories hold identical content; keep them in sync if you edit a skill.

## Workflow: create a new one-button game with crisp-game-lib

1. Select tags as creative seeds:

   ```bash
   node scripts/random_tag_selector.js
   ```

2. Design the game with `.agents/skills/designing-one-button-games/SKILL.md`.
3. Convert balance-critical idle / hold-only / mashing / skilled-play claims into
   implementation invariants with `.agents/skills/implementing-gameplay-invariants/SKILL.md`.
4. Implement with `.agents/skills/developing-with-crisp-game-lib/SKILL.md`, preserving the invariants.
5. Run static checks, then the full GA gate (point the checker at the new game folder):

   ```bash
   node scripts/check_generated_game.js games/<slug> --no-ga
   node scripts/check_generated_game.js games/<slug>
   ```

6. If the checker reports `needs_improvement`, inspect verbose output and improve with
   `.agents/skills/evaluating-gameplay-balance/SKILL.md`:

   ```bash
   node scripts/check_generated_game.js games/<slug> --verbose
   ```

7. Repeat evaluation and improvement up to 3 total improvement attempts. Stop when the
   checker passes or after the third attempt.

Use `.agents/skills/designing-mini-games/SKILL.md` only when the task explicitly allows
multiple inputs. Use `.agents/skills/maximizing-game-feel/SKILL.md` after core rules and
balance are stable, or when visual polish/readability changes could affect play.

## Workflow: create a chapter-to-game learning game

Use `.agents/skills/chapter-to-game/SKILL.md` when starting from an NCERT chapter,
chapter summary, textbook activity, or target concept. For the guided-sim archetype,
new games should import `@learn-loop/core`, author `Scenario` data plus
`GuidedLabMissionPresentation` metadata, and render with `GuidedLabViewport` from
`@learn-loop/core/ui`. Keep `games/chemistry-lab-bench/` reference-only and untouched.

## Stable project constraints (one-button crisp-game-lib games)

- New one-button games live in `games/<slug>/`.
- Required deliverables are `README.md`, `index.html`, and `main.js`.
- Tags are seeds for inspiration, not design specifications. Contradicting tags should
  create design tension rather than forcing literal implementation.
- The default game must use exactly one binary input: tap, hold, and/or release.
- Use crisp-game-lib only for generated browser games.
- Generated `index.html` files must pin `crisp-game-lib@1.5.0`; do not use `@latest`.
- Generated `main.js` must include `title`, `description`, `characters`, `options`, and `update()`.
- `options` should set `audioSeed` for reproducible BGM.
- Avoid white as a visible gameplay color.

For crisp-game-lib coding constraints such as helper placement, draw-before-collide order,
automatic score display, templates, and API usage, use
`.agents/skills/developing-with-crisp-game-lib/SKILL.md`.

## Validation gate

`scripts/check_generated_game.js` is the runtime gate. It checks required artifacts and
tester constraints, then runs the fixed-seed GA harness:

```text
GA ratio = ga.bestScore / monotonous.summary.maxScore
```

Outcome summary:

- `pass`: GA ratio is greater than `1.5`.
- `needs_improvement`: inspect `ratio.diagnostic` and follow `.agents/skills/evaluating-gameplay-balance/SKILL.md`.
- `fail`: required artifacts, static constraints, tester execution, or JSON output are invalid.

For `needs_improvement`, use verbose output. Analyze GA exploratory behavior first;
monotonous logs are baselines, not improvement instructions. If verbose output is too
large or insufficient, add a small invariant-specific probe instead of guessing from the
global ratio alone.

## Design deliverable

Write `games/<slug>/README.md` with the required checker-facing structure:

```markdown
# <GAME_NAME> (<slug>)

**Seeds**: #tag1, #tag2, #tag3

## 1. Core Mechanics

## 1.5 State Model and Tradeoff

### Implementation Invariants

## 2. Object Specifications

## 3. Design Principle Analysis

## 4. Relationship with Seeds

## 5. Basis for Novelty

## 6. Similarity Check
```

For section content, including idle / hold-only / mashing weakness and skilled-play
requirements, use `.agents/skills/designing-one-button-games/references/one-button-design-guide.md`.

## Improvement rules

When improving a game:

- Apply one structural improvement at a time, then rerun `scripts/check_generated_game.js`.
- If a fix changes idle / hold-only / mashing behavior, safe states, scoring pulses,
  combos, cooldowns, resource drains, or seeded early hazards/gaps, update invariants with
  `.agents/skills/implementing-gameplay-invariants/SKILL.md` before editing code.
- If the GA ratio strictly worsens, revert that change and try a different pattern; a clear
  regression is not a spent attempt.
- If `diagnostic` is `tied`, or GA does not exceed monotonous score across two consecutive
  attempts, revisit the design with `designing-one-button-games`.
- Avoid numeric-only tuning, branch-only fixes, hidden tester-specific behavior, and
  randomness as the primary answer.

## Credits

Skills and validation harness ported from
[abagames/claude-one-button-game-creation](https://github.com/abagames/claude-one-button-game-creation)
(see `LICENSE` of that project).
