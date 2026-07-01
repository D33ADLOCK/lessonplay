import { useEffect, useMemo, useReducer } from "react";
import type {
  ExperimentGame,
  ExperimentLevel,
  ExperimentSample,
  ExperimentTool,
  ExperimentVisual,
} from "../model/experimentLab";
import {
  canClassify,
  createExperimentSession,
  currentLevel,
  reduceExperimentSession,
  type ExperimentSessionState,
} from "../engine/experimentSession";

/**
 * How long an effect plays out before the bench reopens for the next action.
 * The effect itself lingers (via the notebook lookup) until the player acts
 * again, so the "money shot" stays on screen for a screenshot.
 */
export const EXPERIMENT_OBSERVE_MS = 1400;

export interface ExperimentSession {
  readonly state: ExperimentSessionState;
  readonly level: ExperimentLevel;
  /** True while an effect is animating; the bench is not interactive. */
  readonly busy: boolean;
  /** True only in the free-probing phase, when inputs are live. */
  readonly interactive: boolean;
  /** True while awaiting the learner's prediction for the chosen tool. */
  readonly predicting: boolean;
  /** Whether every sample that must be classified has been probed. */
  readonly canClassify: boolean;
  readonly selectedSample: ExperimentSample | undefined;
  /** The tool awaiting a prediction (only set in the `predicting` phase). */
  readonly selectedTool: ExperimentTool | undefined;
  /** The distinct effects the chosen tool can produce, as prediction choices. */
  readonly predictChoices: readonly ExperimentVisual[];
  /**
   * After an effect plays, whether the learner's prediction matched: "correct"
   * or "wrong"; null when this level required no prediction.
   */
  readonly predictionOutcome: "correct" | "wrong" | null;
  /** The effect the beaker should show right now (live or last recorded). */
  readonly activeVisual: ExperimentVisual;
  /** Gas chip token for the active `gas` visual, if any (e.g. "H₂"). */
  readonly activeGasLabel: string | undefined;
  /** Whether the selected sample has ever shown a floating-particle look. */
  readonly cloudy: boolean;
  /** Sensory text for the selected sample's most recent reading, if any. */
  readonly reading: string | null;
  readonly sampleById: ReadonlyMap<string, ExperimentSample>;
  /** A recorded probe for one (sample, tool), if it exists. */
  readonly readingFor: (
    sampleId: string,
    toolId: string,
  ) => ExperimentSessionState["notebook"][number] | undefined;
  readonly startLevel: () => void;
  readonly selectSample: (sampleId: string) => void;
  readonly selectTool: (toolId: string) => void;
  /** Commit a predicted effect, which then applies the tool and reconciles. */
  readonly predict: (visual: ExperimentVisual) => void;
  readonly requestHint: () => void;
  readonly openClassify: () => void;
  readonly assignCategory: (sampleId: string, categoryId: string) => void;
  readonly submitClassification: () => void;
  readonly nextLevel: () => void;
  readonly reset: () => void;
}

/**
 * Drives an {@link ExperimentLabViewport} from the already-tested session
 * reducer. It owns the observe→reopen timer and the derived view helpers (the
 * active visual, cloudiness, the latest reading) so the viewport is pure markup.
 * No gameplay rule lives here — every transition goes through
 * {@link reduceExperimentSession}.
 */
export function useExperimentSession(game: ExperimentGame): ExperimentSession {
  const [state, dispatch] = useReducer(
    reduceExperimentSession,
    game,
    createExperimentSession,
  );

  const level = currentLevel(state);
  const samples = game.definition.samples;
  const sampleById = useMemo(
    () => new Map(samples.map((s) => [s.id, s])),
    [samples],
  );

  // The effect animates live, records itself, then the bench reopens.
  useEffect(() => {
    if (state.phase !== "observing") return;
    const t = setTimeout(
      () => dispatch({ type: "dismiss-observation" }),
      EXPERIMENT_OBSERVE_MS,
    );
    return () => clearTimeout(t);
  }, [state.phase, state.lastObservation]);

  const busy = state.phase === "observing";
  const interactive = state.phase === "exploring";
  const predicting = state.phase === "predicting";
  const selectedSample = state.selectedSampleId
    ? sampleById.get(state.selectedSampleId)
    : undefined;
  const selectedTool =
    predicting && state.selectedToolId
      ? game.definition.tools.find((t) => t.id === state.selectedToolId)
      : undefined;
  const predictChoices =
    predicting && state.selectedToolId
      ? predictChoicesFor(game, state.selectedToolId)
      : EMPTY_CHOICES;
  const predictionOutcome: "correct" | "wrong" | null =
    state.phase === "observing" &&
    state.lastObservation &&
    state.lastObservation.predictionCorrect !== null
      ? state.lastObservation.predictionCorrect
        ? "correct"
        : "wrong"
      : null;

  return {
    state,
    level,
    busy,
    interactive,
    predicting,
    canClassify: canClassify(state),
    selectedSample,
    selectedTool,
    predictChoices,
    predictionOutcome,
    activeVisual: activeVisual(state),
    activeGasLabel: activeGasLabel(state),
    cloudy: isCloudy(state),
    reading: latestReadingFor(state),
    sampleById,
    readingFor: (sampleId, toolId) =>
      state.notebook.find(
        (e) => e.sampleId === sampleId && e.toolId === toolId,
      ),
    startLevel: () => dispatch({ type: "start-level" }),
    selectSample: (sampleId) => dispatch({ type: "select-sample", sampleId }),
    selectTool: (toolId) => dispatch({ type: "select-tool", toolId }),
    predict: (visual) => dispatch({ type: "predict", visual }),
    requestHint: () => dispatch({ type: "request-hint" }),
    openClassify: () => dispatch({ type: "open-classify" }),
    assignCategory: (sampleId, categoryId) =>
      dispatch({ type: "assign-category", sampleId, categoryId }),
    submitClassification: () => dispatch({ type: "submit-classification" }),
    nextLevel: () => dispatch({ type: "next-level" }),
    reset: () => dispatch({ type: "reset" }),
  };
}

const EMPTY_CHOICES: readonly ExperimentVisual[] = [];

/**
 * The distinct effects a tool can produce across the whole world, offered as
 * prediction options. Derived from every rule that fires for the tool plus the
 * default effect, so it is honest (only outcomes the tool can really show) and
 * never leaks which sample is which. Padded with "none" so there is always a
 * genuine choice (will it react, or not?).
 */
function predictChoicesFor(
  game: ExperimentGame,
  toolId: string,
): readonly ExperimentVisual[] {
  const ruleSet = game.definition.ruleSet;
  const choices: ExperimentVisual[] = [];
  for (const rule of ruleSet.rules) {
    if (rule.toolId === toolId && !choices.includes(rule.effect.visual)) {
      choices.push(rule.effect.visual);
    }
  }
  const fallback = ruleSet.defaultEffect.visual;
  if (!choices.includes(fallback)) choices.push(fallback);
  if (choices.length < 2 && !choices.includes("none")) choices.push("none");
  return choices;
}

/** The effect the beaker should show right now. */
function activeVisual(state: ExperimentSessionState): ExperimentVisual {
  if (state.phase === "observing" && state.lastObservation) {
    return state.lastObservation.effect.visual;
  }
  const sid = state.selectedSampleId;
  if (!sid) return "none";
  const entries = state.notebook.filter((e) => e.sampleId === sid);
  return entries.length ? entries[entries.length - 1].visual : "none";
}

/** The gas chip token the beaker should show right now, if the visual is gas. */
function activeGasLabel(state: ExperimentSessionState): string | undefined {
  if (state.phase === "observing" && state.lastObservation) {
    return state.lastObservation.effect.gasLabel;
  }
  const sid = state.selectedSampleId;
  if (!sid) return undefined;
  const entries = state.notebook.filter((e) => e.sampleId === sid);
  return entries.length ? entries[entries.length - 1].gasLabel : undefined;
}

/** Whether the selected sample has revealed any floating-particle look. */
function isCloudy(state: ExperimentSessionState): boolean {
  const sid = state.selectedSampleId;
  if (!sid) return false;
  return state.notebook.some(
    (e) => e.sampleId === sid && (e.visual === "beam" || e.visual === "settle"),
  );
}

/** The sensory text for the selected sample's most recent reading. */
function latestReadingFor(state: ExperimentSessionState): string | null {
  const sid = state.selectedSampleId;
  if (!sid) return null;
  const entries = state.notebook.filter((e) => e.sampleId === sid);
  return entries.length ? entries[entries.length - 1].observation : null;
}
