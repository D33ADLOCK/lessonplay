import { ExperimentLabViewport } from "@learn-loop/core/ui";
import { game } from "../content/game";

/**
 * The whole game is a thin consumer of the shared {@link ExperimentLabViewport}
 * from `@learn-loop/core/ui` — the dark-glow lab, the beaker animations, the
 * predict → act → observe → reconcile loop, the readings grid, and the reveal
 * all live in the package. This file only supplies the validated `ExperimentGame`
 * data and a closing line; the default dark-glow theme is the intended skin.
 */
export function App() {
  return (
    <ExperimentLabViewport
      game={game}
      completionMessage="You told the acids, bases, and salts apart by reading colour, pH, bubbles, and a bulb — not by guessing."
    />
  );
}
