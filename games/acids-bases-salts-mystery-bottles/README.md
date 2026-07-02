# Mystery Bottles: Acids, Bases and Salts

A discovery-driven ExperimentLab game for the Class 10 NCERT chapter *Acids,
Bases and Salts*. Five unlabelled bottles sit on a dark-glow bench; the chapter's
hands-on Activities are the **tools**. The player probes, reads the evidence, and
identifies each bottle — **discovery before naming**: the concept names appear
only at the reveal.

This game is a thin consumer of the shared ExperimentLab engine and render
surface in `@learn-loop/core` — exactly the shape the LessonPlay runtime agent
produces. It authors an `ExperimentGame` as data (a rule-driven
`ExperimentDefinition` + categories + a guided → hinted → open level ladder) and
renders it through `ExperimentLabViewport`; it hand-builds no UI and changes no
engine code. See `.agents/skills/experiment-lab-game/`.

## The bench

Five bottles span five categories. **No single tool separates all of them** —
two pairs are designed to look identical to the obvious tests, so the player must
*combine causes*:

| Bottle | Identity | Category |
| :-- | :-- | :-- |
| Bottle 1 | dilute hydrochloric acid | Acid |
| Bottle 2 | sodium hydroxide solution | Base |
| Bottle 3 | washing soda solution | Carbonate |
| Bottle 4 | common salt solution | Neutral salt |
| Bottle 5 | sugar solution | Non-conductor |

- **Base vs Carbonate** (Bottle 2 vs 3): both turn litmus blue and read high on
  the pH scale, and both conduct. Only *adding dilute acid* tells them apart —
  the carbonate fizzes off a gas.
- **Neutral salt vs Non-conductor** (Bottle 4 vs 5): both leave litmus unchanged
  and read pH 7. Only the *conductivity tester* splits them — the salt's ions
  carry a current; the sugar's don't.

## The tools (chapter Activities → operators)

| Tool | Chapter Activity | What the learner reads |
| :-- | :-- | :-- |
| Litmus strip | 2.1 | a colour (red / blue / no change) |
| pH paper | 2.11–2.14 | a point on the 0–14 scale |
| Conductivity tester | 2.8 | a bulb that glows or stays dark |
| Dilute acid | 2.5 | a gas (CO₂) fizzing off carbonates |
| Zinc granule | 2.3, 2.4 | hydrogen gas from acids |

Every outcome is computed from each bottle's hidden `properties` (`nature`,
`ionic`, `carbonate`) through a first-match-wins `ruleSet` — nothing is authored
per bottle × tool, so the simulation is consistent and can be reasoned about.

## Level ladder

1. **Meet the indicators** (guided) — one bottle, litmus + pH paper, with the
   predict beat on to teach the loop once.
2. **The lookalikes** (hinted) — all five bottles; the two ambiguous pairs force
   the player to combine tools. Hints on.
3. **The open bench** (open) — all bottles, every tool, no hints.

## Run it

```bash
# from the repo root (scoped-workspace consumer of @learn-loop/core)
npm install
npm run dev --workspace acids-bases-salts-mystery-bottles
```

Or inside this folder: `npm install && npm run dev` (port 5185).

## Test

```bash
npm run test --workspace acids-bases-salts-mystery-bottles
```

The single committed gate (`tests/content-gate.test.ts`) runs
`validateExperimentMission` — the same structural + solvability check the runtime
agent runs before publishing — proving the game is valid, winnable, not railed,
and not brute-forceable at every level. Visual QA is manual.
