import type {
  ExperimentEffect,
  ExperimentGame,
  ExperimentLevel,
  ExperimentSample,
  ExperimentSampleState,
  ExperimentVisual,
} from "../model/experimentLab";
import { runExperimentStep } from "./experimentRules";

/**
 * The runtime state machine for an ExperimentLab playthrough.
 *
 * It drives the cause→effect loop — Predict → Act → Observe → Record → Classify
 * → Reveal — across a level ladder, and is pure: `(state, event) → state`, no
 * I/O, never mutating input. The viewport renders from this and dispatches
 * events; all gameplay rules (prediction binding, the evidence gate on
 * classifying, graduated hints, level progression) live here so they are
 * unit-testable without the UI.
 */

export type ExperimentPhase =
  | "intro" // level framing shown; awaiting start
  | "exploring" // free probing: pick a sample + tool
  | "predicting" // a tool is chosen; awaiting the learner's prediction
  | "observing" // an effect is shown; awaiting dismissal
  | "classifying" // assigning samples to categories
  | "revealed" // correct: identities shown
  | "complete"; // all levels done

/** One recorded probe: what was done and what was seen. No inference. */
export interface ExperimentNotebookEntry {
  readonly sampleId: string;
  readonly toolId: string;
  readonly observationId: string;
  readonly observation: string;
  readonly visual: ExperimentVisual;
  /** Gas chip token carried over from the effect, when the visual is `gas`. */
  readonly gasLabel?: string;
}

/** The just-applied cause: its effect plus whether the prediction was right. */
export interface ExperimentObservationResult {
  readonly sampleId: string;
  readonly toolId: string;
  readonly effect: ExperimentEffect;
  /** The learner's predicted visual, when the level required a prediction. */
  readonly predictedVisual: ExperimentVisual | null;
  /** True/false when a prediction was made; null when none was required. */
  readonly predictionCorrect: boolean | null;
}

export interface ExperimentClassificationResult {
  /** All classify samples assigned to their correct category. */
  readonly correct: boolean;
  /** Per-sample correctness, keyed by sample id. */
  readonly perSample: Readonly<Record<string, boolean>>;
}

export interface ExperimentSessionState {
  readonly game: ExperimentGame;
  readonly levelIndex: number;
  readonly phase: ExperimentPhase;
  readonly selectedSampleId: string | null;
  readonly selectedToolId: string | null;
  /** Evolving state per sample (carries `setState` from earlier causes). */
  readonly sampleStates: Readonly<Record<string, ExperimentSampleState>>;
  readonly notebook: readonly ExperimentNotebookEntry[];
  readonly lastObservation: ExperimentObservationResult | null;
  /** Current classify assignments: sampleId → categoryId. */
  readonly assignments: Readonly<Record<string, string>>;
  readonly classificationResult: ExperimentClassificationResult | null;
  readonly hintsRevealed: number;
  readonly predictionsMade: number;
  readonly predictionsCorrect: number;
}

export type ExperimentSessionEvent =
  | { readonly type: "start-level" }
  | { readonly type: "select-sample"; readonly sampleId: string }
  | { readonly type: "select-tool"; readonly toolId: string }
  | { readonly type: "predict"; readonly visual: ExperimentVisual }
  | { readonly type: "dismiss-observation" }
  | { readonly type: "open-classify" }
  | {
      readonly type: "assign-category";
      readonly sampleId: string;
      readonly categoryId: string;
    }
  | { readonly type: "submit-classification" }
  | { readonly type: "request-hint" }
  | { readonly type: "next-level" }
  | { readonly type: "reset" };

export function currentLevel(state: ExperimentSessionState): ExperimentLevel {
  return state.game.levels[state.levelIndex];
}

function levelSamples(
  game: ExperimentGame,
  level: ExperimentLevel,
): ExperimentSample[] {
  return level.sampleIds
    .map((id) => game.definition.samples.find((s) => s.id === id))
    .filter((s): s is ExperimentSample => s !== undefined);
}

function initialSampleStates(
  game: ExperimentGame,
  level: ExperimentLevel,
): Record<string, ExperimentSampleState> {
  const states: Record<string, ExperimentSampleState> = {};
  for (const sample of levelSamples(game, level)) {
    states[sample.id] = { ...sample.properties };
  }
  return states;
}

function enterLevel(
  game: ExperimentGame,
  levelIndex: number,
): ExperimentSessionState {
  const level = game.levels[levelIndex];
  return {
    game,
    levelIndex,
    phase: "intro",
    selectedSampleId: level.sampleIds[0] ?? null,
    selectedToolId: null,
    sampleStates: initialSampleStates(game, level),
    notebook: [],
    lastObservation: null,
    assignments: {},
    classificationResult: null,
    hintsRevealed: 0,
    predictionsMade: 0,
    predictionsCorrect: 0,
  };
}

export function createExperimentSession(
  game: ExperimentGame,
): ExperimentSessionState {
  return enterLevel(game, 0);
}

/**
 * The evidence gate: a learner may only attempt a classification once every
 * sample they must classify has been probed at least once. This is what makes
 * the goal unreachable by pure guessing.
 */
export function canClassify(state: ExperimentSessionState): boolean {
  const level = currentLevel(state);
  const probed = new Set(state.notebook.map((entry) => entry.sampleId));
  return level.goal.classifyIds.every((id) => probed.has(id));
}

function applyTool(
  state: ExperimentSessionState,
  sampleId: string,
  toolId: string,
  predictedVisual: ExperimentVisual | null,
): ExperimentSessionState {
  const ruleSet = state.game.definition.ruleSet;
  const sampleState = state.sampleStates[sampleId];
  if (!sampleState) return state;

  const result = runExperimentStep(sampleState, toolId, ruleSet);
  const predictionCorrect =
    predictedVisual === null ? null : predictedVisual === result.effect.visual;

  const entry: ExperimentNotebookEntry = {
    sampleId,
    toolId,
    observationId: result.effect.observationId,
    observation: result.effect.observation,
    visual: result.effect.visual,
    gasLabel: result.effect.gasLabel,
  };

  return {
    ...state,
    phase: "observing",
    selectedToolId: toolId,
    sampleStates: { ...state.sampleStates, [sampleId]: result.nextState },
    notebook: addNotebookEntry(state.notebook, entry),
    lastObservation: {
      sampleId,
      toolId,
      effect: result.effect,
      predictedVisual,
      predictionCorrect,
    },
    predictionsMade:
      predictionCorrect === null
        ? state.predictionsMade
        : state.predictionsMade + 1,
    predictionsCorrect:
      predictionCorrect === true
        ? state.predictionsCorrect + 1
        : state.predictionsCorrect,
  };
}

export function reduceExperimentSession(
  state: ExperimentSessionState,
  event: ExperimentSessionEvent,
): ExperimentSessionState {
  const level = currentLevel(state);

  switch (event.type) {
    case "start-level":
      if (state.phase !== "intro") return state;
      return { ...state, phase: "exploring" };

    case "select-sample":
      if (state.phase !== "exploring") return state;
      if (!level.sampleIds.includes(event.sampleId)) return state;
      return { ...state, selectedSampleId: event.sampleId };

    case "select-tool": {
      if (state.phase !== "exploring") return state;
      if (!level.toolIds.includes(event.toolId)) return state;
      if (!state.selectedSampleId) return state;
      if (level.predictionRequired) {
        return { ...state, phase: "predicting", selectedToolId: event.toolId };
      }
      return applyTool(state, state.selectedSampleId, event.toolId, null);
    }

    case "predict": {
      if (state.phase !== "predicting") return state;
      if (!state.selectedSampleId || !state.selectedToolId) return state;
      return applyTool(
        state,
        state.selectedSampleId,
        state.selectedToolId,
        event.visual,
      );
    }

    case "dismiss-observation":
      if (state.phase !== "observing") return state;
      return {
        ...state,
        phase: "exploring",
        selectedToolId: null,
        lastObservation: null,
      };

    case "open-classify":
      if (state.phase !== "exploring") return state;
      if (!canClassify(state)) return state;
      return { ...state, phase: "classifying" };

    case "assign-category": {
      if (state.phase !== "classifying") return state;
      if (!level.goal.classifyIds.includes(event.sampleId)) return state;
      if (!level.goal.categoryIds.includes(event.categoryId)) return state;
      return {
        ...state,
        assignments: { ...state.assignments, [event.sampleId]: event.categoryId },
      };
    }

    case "submit-classification": {
      if (state.phase !== "classifying") return state;
      const perSample: Record<string, boolean> = {};
      let allCorrect = true;
      for (const id of level.goal.classifyIds) {
        const sample = state.game.definition.samples.find((s) => s.id === id);
        const correct = sample
          ? state.assignments[id] === sample.categoryId
          : false;
        perSample[id] = correct;
        if (!correct) allCorrect = false;
      }
      const result: ExperimentClassificationResult = {
        correct: allCorrect,
        perSample,
      };
      return {
        ...state,
        classificationResult: result,
        phase: allCorrect ? "revealed" : "classifying",
      };
    }

    case "request-hint":
      if (state.hintsRevealed >= level.hints.length) return state;
      return { ...state, hintsRevealed: state.hintsRevealed + 1 };

    case "next-level":
      if (state.phase !== "revealed") return state;
      if (state.levelIndex >= state.game.levels.length - 1) {
        return { ...state, phase: "complete" };
      }
      return enterLevel(state.game, state.levelIndex + 1);

    case "reset":
      return createExperimentSession(state.game);
  }
}

function addNotebookEntry(
  entries: readonly ExperimentNotebookEntry[],
  next: ExperimentNotebookEntry,
): readonly ExperimentNotebookEntry[] {
  const alreadyRecorded = entries.some(
    (entry) =>
      entry.sampleId === next.sampleId &&
      entry.toolId === next.toolId &&
      entry.observationId === next.observationId,
  );
  return alreadyRecorded ? entries : [...entries, next];
}
