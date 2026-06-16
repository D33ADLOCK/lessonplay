/**
 * The lab session reducer. Pure `(state, event) → state` driving a guided
 * experiment as an ordered list of steps, each with its own
 * Predict → Observe → Explain loop.
 *
 * Within a step: Predict records a (non-blocking) guess, then the student moves
 * to Observe and pours. Pouring runs the engine on the live workspace: a reagent
 * that reacts produces a visible result and unlocks the move to Explain; a
 * distractor pour shows a gentle nudge and lets the student try again. Advancing
 * from Explain moves to the next step until the experiment is complete. The
 * workspace carries forward, so a later step can react with earlier products.
 */

import type { Action } from "../contracts/actions";
import type { ReactionResult, Workspace } from "../contracts/chemistry";
import type {
  Experiment,
  PredictionOption,
  Step,
} from "../contracts/experiment";
import { applyAction } from "./reaction";

export type LabPhase = "predict" | "observe" | "explain" | "complete";

export interface LabSessionState {
  readonly experiment: Experiment;
  /** Index into `experiment.steps`; equals steps.length once complete. */
  readonly stepIndex: number;
  readonly phase: LabPhase;
  readonly workspace: Workspace;
  /** Reagent currently tapped on the shelf, awaiting a pour. */
  readonly selectedReagent: string | null;
  /** The prediction the student tapped for the current step, if any. */
  readonly prediction: PredictionOption | null;
  /** The latest reaction result in the current step, if any. */
  readonly result: ReactionResult | null;
}

export type LabEvent =
  | { readonly type: "select-reagent"; readonly reagent: string }
  | { readonly type: "submit-prediction"; readonly option: PredictionOption }
  | { readonly type: "perform"; readonly action: Action }
  | { readonly type: "advance-phase" };

export function createLabSession(experiment: Experiment): LabSessionState {
  return {
    experiment,
    stepIndex: 0,
    phase: experiment.steps.length === 0 ? "complete" : "predict",
    workspace: { stations: { ...experiment.stations } },
    selectedReagent: null,
    prediction: null,
    result: null,
  };
}

/** The step the session is currently on, or null once complete. */
export function currentStep(state: LabSessionState): Step | null {
  return state.experiment.steps[state.stepIndex] ?? null;
}

/** True once the current step has produced its visible reaction. */
export function isStepResolved(state: LabSessionState): boolean {
  return state.result?.visibleChange === true;
}

export function reduce(
  state: LabSessionState,
  event: LabEvent,
): LabSessionState {
  switch (event.type) {
    case "select-reagent":
      return { ...state, selectedReagent: event.reagent };

    case "submit-prediction":
      // Feedback-only: record the choice, never block.
      return { ...state, prediction: event.option };

    case "perform": {
      // Pouring happens in the Observe phase. The engine runs on any pour, so a
      // distractor produces a nudge; only a visible reaction unlocks Explain.
      if (state.phase !== "observe") return state;
      const { workspace, result } = applyAction(
        state.workspace,
        event.action,
        state.experiment.rules,
        state.experiment.chemicals,
      );
      return { ...state, workspace, result, selectedReagent: null };
    }

    case "advance-phase":
      return advance(state);
  }
}

/**
 * Step the phase forward. predict → observe always; observe → explain only once
 * the step's reaction has visibly resolved; explain → next step (or complete).
 */
function advance(state: LabSessionState): LabSessionState {
  switch (state.phase) {
    case "predict":
      return { ...state, phase: "observe" };
    case "observe":
      if (!isStepResolved(state)) return state;
      return { ...state, phase: "explain" };
    case "explain": {
      const nextIndex = state.stepIndex + 1;
      if (nextIndex >= state.experiment.steps.length) {
        return { ...state, stepIndex: nextIndex, phase: "complete" };
      }
      return {
        ...state,
        stepIndex: nextIndex,
        phase: "predict",
        selectedReagent: null,
        prediction: null,
        result: null,
      };
    }
    case "complete":
      return state;
  }
}
