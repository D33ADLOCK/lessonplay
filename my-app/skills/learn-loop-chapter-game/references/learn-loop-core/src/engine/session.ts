/**
 * The session reducer. Pure `(state, event) → state` driving a guided scenario
 * as an ordered list of steps, each with its own Predict → Observe → Explain
 * loop.
 *
 * Within a step: Predict records a (non-blocking) guess, then the learner moves
 * to Observe and acts. Acting runs the engine on the live workspace: an action
 * that resolves a transform produces a visible result and unlocks the move to
 * Explain; a distractor shows a gentle nudge and lets the learner try again.
 * Advancing from Explain moves to the next step until the scenario is complete.
 * The workspace carries forward, so a later step can build on earlier outputs.
 */

import type { Action } from "../model/actions";
import type { StepResult, Workspace } from "../model/entity";
import type { PredictionOption, Scenario, Step } from "../model/scenario";
import { applyAction } from "./applyAction";

export type Phase = "predict" | "observe" | "explain" | "complete";

export interface SessionState {
  readonly scenario: Scenario;
  /** Index into `scenario.steps`; equals steps.length once complete. */
  readonly stepIndex: number;
  readonly phase: Phase;
  readonly workspace: Workspace;
  /** Reagent currently tapped in the tray, awaiting a pour. */
  readonly selectedReagent: string | null;
  /** The prediction the learner tapped for the current step, if any. */
  readonly prediction: PredictionOption | null;
  /** The latest result in the current step, if any. */
  readonly result: StepResult | null;
}

export type SessionEvent =
  | { readonly type: "select-reagent"; readonly reagent: string }
  | { readonly type: "submit-prediction"; readonly option: PredictionOption }
  | { readonly type: "perform"; readonly action: Action }
  | { readonly type: "advance-phase" };

export function createSession(scenario: Scenario): SessionState {
  return {
    scenario,
    stepIndex: 0,
    phase: scenario.steps.length === 0 ? "complete" : "predict",
    workspace: { stations: { ...scenario.stations } },
    selectedReagent: null,
    prediction: null,
    result: null,
  };
}

/** The step the session is currently on, or null once complete. */
export function currentStep(state: SessionState): Step | null {
  return state.scenario.steps[state.stepIndex] ?? null;
}

/** True once the current step has produced its visible change. */
export function isStepResolved(state: SessionState): boolean {
  return state.result?.visibleChange === true;
}

export function reduce(state: SessionState, event: SessionEvent): SessionState {
  switch (event.type) {
    case "select-reagent":
      return { ...state, selectedReagent: event.reagent };

    case "submit-prediction":
      // Feedback-only: record the choice, never block.
      return { ...state, prediction: event.option };

    case "perform": {
      // Acting happens in the Observe phase. The engine runs on any action, so a
      // distractor produces a nudge; only a visible change unlocks Explain.
      if (state.phase !== "observe") return state;
      const { workspace, result } = applyAction(
        state.workspace,
        event.action,
        state.scenario.rules,
        state.scenario.entities,
      );
      return { ...state, workspace, result, selectedReagent: null };
    }

    case "advance-phase":
      return advance(state);
  }
}

/**
 * Step the phase forward. predict → observe always; observe → explain only once
 * the step's change has visibly resolved; explain → next step (or complete).
 */
function advance(state: SessionState): SessionState {
  switch (state.phase) {
    case "predict":
      return { ...state, phase: "observe" };
    case "observe":
      if (!isStepResolved(state)) return state;
      return { ...state, phase: "explain" };
    case "explain": {
      const nextIndex = state.stepIndex + 1;
      if (nextIndex >= state.scenario.steps.length) {
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
