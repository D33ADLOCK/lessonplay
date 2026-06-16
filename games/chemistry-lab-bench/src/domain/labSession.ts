/**
 * The lab session reducer. Pure `(state, event) → state` driving the
 * Predict → Observe → Explain loop for one experiment.
 *
 * Prediction is feedback-only: choosing an option records the choice and its
 * feedback but never blocks progress to the Observe phase.
 */

import type { ReactionResult, Vessel } from "../contracts/chemistry";
import type { Experiment, PredictionOption } from "../contracts/experiment";
import { simulateReaction } from "./reaction";

export type LabPhase = "predict" | "observe" | "explain";

export interface LabSessionState {
  readonly experiment: Experiment;
  readonly phase: LabPhase;
  readonly vessel: Vessel;
  /** Reagent currently tapped on the shelf, awaiting a pour. */
  readonly selectedReagent: string | null;
  /** The prediction the student tapped, if any. */
  readonly prediction: PredictionOption | null;
  /** The resolved reaction after a pour, if any. */
  readonly result: ReactionResult | null;
}

export type LabEvent =
  | { readonly type: "select-reagent"; readonly reagent: string }
  | { readonly type: "submit-prediction"; readonly option: PredictionOption }
  | { readonly type: "pour" }
  | { readonly type: "advance-phase" };

export function createLabSession(experiment: Experiment): LabSessionState {
  return {
    experiment,
    phase: "predict",
    vessel: experiment.beaker,
    selectedReagent: null,
    prediction: null,
    result: null,
  };
}

const NEXT_PHASE: Record<LabPhase, LabPhase> = {
  predict: "observe",
  observe: "explain",
  explain: "explain",
};

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

    case "pour": {
      if (!state.selectedReagent) return state;
      const result = simulateReaction(
        state.vessel,
        { type: "pour", reagent: state.selectedReagent },
        state.experiment.rules,
      );
      const vessel: Vessel = state.vessel.contents.includes(
        state.selectedReagent,
      )
        ? state.vessel
        : { contents: [...state.vessel.contents, state.selectedReagent] };
      return {
        ...state,
        vessel,
        result,
        selectedReagent: null,
        phase: "observe",
      };
    }

    case "advance-phase":
      return { ...state, phase: NEXT_PHASE[state.phase] };
  }
}
