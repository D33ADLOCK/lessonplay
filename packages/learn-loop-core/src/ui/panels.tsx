/**
 * The workbench panels — domain-agnostic presentation for the guided loop.
 *
 * - `StepCounter` — "Step 2 of 3".
 * - `CuePanel` — shown while the learner is still choosing a move: the step's
 *   goal, plus an optional wrong-tap nudge line.
 * - `ResultPanel` — shown once a step has visibly resolved: the observation, any
 *   emissions, the "why", and the advance button.
 * - `CompletePanel` — the end-of-scenario card.
 *
 * These render `state`/`StepResult` fields a skin already has; they hold no
 * domain logic and never call the engine. A game can use them as-is or supply its
 * own — the trustworthy logic lives in the headless core.
 */

import type { Emission } from "../model/entity";

export function StepCounter({
  current,
  total,
}: {
  readonly current: number;
  readonly total: number;
}) {
  return (
    <p className="step-counter">
      Step {current} of {total}
    </p>
  );
}

export function CuePanel({
  prompt,
  nudge,
}: {
  readonly prompt: string;
  readonly nudge?: string | null;
}) {
  return (
    <section className="panel cue">
      <p className="prompt">{prompt}</p>
      {nudge && <p className="observation nudge">{nudge}</p>}
    </section>
  );
}

export function ResultPanel({
  observation,
  emissions,
  explanation,
  isLast,
  onAdvance,
}: {
  readonly observation: string;
  readonly emissions?: readonly Emission[];
  readonly explanation: string;
  readonly isLast: boolean;
  readonly onAdvance: () => void;
}) {
  return (
    <section className="panel result">
      <p className="observation">{observation}</p>
      {emissions?.map((e) => (
        <p key={e.gas} className="emission">
          {e.observation}
        </p>
      ))}
      <p className="explanation">{explanation}</p>
      <button className="primary" onClick={onAdvance}>
        {isLast ? "Finish" : "Next step"}
      </button>
    </section>
  );
}

export function CompletePanel({
  title = "Scenario complete",
  message = "Nicely done — you worked through every step. Pick another scenario to keep exploring.",
}: {
  readonly title?: string;
  readonly message?: string;
}) {
  return (
    <section className="panel">
      <h2>{title}</h2>
      <p className="explanation">{message}</p>
    </section>
  );
}
