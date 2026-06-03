# Game Code

A collection of small games. Each game lives in its own self-contained folder under
[`games/`](games/).

## Games

| Game | Stack | Run |
| :-- | :-- | :-- |
| [moon-jump-vs-earth-jump](games/moon-jump-vs-earth-jump/) | React + Vite | `cd games/moon-jump-vs-earth-jump && npm install && npm run dev` |

## Game-creation skills (Claude Code + Codex)

This repo ships reusable game-design/build skills ported from
[abagames/claude-one-button-game-creation](https://github.com/abagames/claude-one-button-game-creation):

- `designing-one-button-games` — invent original tap/hold/release games
- `designing-mini-games` — compact games with more than one input
- `implementing-gameplay-invariants` — turn risk/reward prose into enforceable invariants
- `developing-with-crisp-game-lib` — build browser mini-games with crisp-game-lib
- `evaluating-gameplay-balance` — diagnose and improve balance from telemetry
- `maximizing-game-feel` — add tactile polish

They are installed in two mirrored locations so both tools find them:

- **Claude Code** → [`.claude/skills/`](.claude/skills/) (auto-discovered; just ask Claude
  to "design a one-button game" and it invokes the right skill).
- **Codex / other agents** → [`.agents/skills/`](.agents/skills/), referenced from
  [`AGENTS.md`](AGENTS.md) (a symlink to [`CLAUDE.md`](CLAUDE.md)).

The full workflow — tag selection, design, invariants, implementation, and the GA
validation gate (`scripts/`) — is documented in [`CLAUDE.md`](CLAUDE.md).

```bash
# pick creative seed tags
node scripts/random_tag_selector.js

# validate a generated one-button game
node scripts/check_generated_game.js games/<slug>
```
