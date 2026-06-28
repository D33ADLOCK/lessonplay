import type { Action } from "../model/actions";
import type { StepResult, Workspace } from "../model/entity";
import type {
  SandboxLabConclusion,
  SandboxLabFeedbackCard,
  SandboxLabInteraction,
  SandboxLabMission,
  SandboxLabSoundCue,
  SandboxLabToolAction,
} from "../model/sandboxLab";
import { applyAction } from "./applyAction";

export type SandboxLabPhase = "explore" | "concluded";

export interface SandboxLabObservation {
  readonly id: string;
  readonly materialId: string;
  readonly toolId: string;
  readonly evidenceId: string;
  readonly observation: string;
  readonly explanation?: string;
  readonly visibleChange: boolean;
  readonly gasLabel?: string;
}

export interface SandboxLabConclusionAttempt {
  readonly conclusion: SandboxLabConclusion;
  readonly success: boolean;
}

export interface SandboxLabPendingFeedback {
  readonly id: string;
  readonly evidenceId: string;
  readonly card: SandboxLabFeedbackCard;
  readonly soundCue: SandboxLabSoundCue;
  readonly stageComplete: boolean;
}

export interface SandboxLabNotebookEvidence {
  readonly id: string;
  readonly evidenceId: string;
  readonly text: string;
}

export interface SandboxLabSessionState {
  readonly mission: SandboxLabMission;
  readonly phase: SandboxLabPhase;
  readonly workspace: Workspace;
  readonly currentStageIndex: number;
  readonly selectedMaterialId: string;
  readonly observations: readonly SandboxLabObservation[];
  readonly collectedEvidence: readonly string[];
  readonly notebookEvidence: readonly SandboxLabNotebookEvidence[];
  readonly pendingFeedback: SandboxLabPendingFeedback | null;
  readonly lastSoundCue: SandboxLabSoundCue | null;
  readonly latestResult: StepResult | null;
  readonly latestInteraction: SandboxLabInteraction | null;
  readonly conclusionAttempt: SandboxLabConclusionAttempt | null;
}

export type SandboxLabSessionEvent =
  | { readonly type: "select-material"; readonly materialId: string }
  | { readonly type: "apply-tool"; readonly toolId: string }
  | { readonly type: "dismiss-feedback" }
  | { readonly type: "submit-conclusion"; readonly conclusionId: string }
  | { readonly type: "reset" };

export function createSandboxLabSession(
  mission: SandboxLabMission,
): SandboxLabSessionState {
  return {
    mission,
    phase: "explore",
    workspace: { stations: structuredClone(mission.scenario.stations) },
    currentStageIndex: 0,
    selectedMaterialId:
      mission.presentation.stages[0]?.materialIds[0] ??
      mission.presentation.materials[0]?.id ??
      "",
    observations: [],
    collectedEvidence: [],
    notebookEvidence: [],
    pendingFeedback: null,
    lastSoundCue: null,
    latestResult: null,
    latestInteraction: null,
    conclusionAttempt: null,
  };
}

export function reduceSandboxLabSession(
  state: SandboxLabSessionState,
  event: SandboxLabSessionEvent,
): SandboxLabSessionState {
  switch (event.type) {
    case "select-material":
      if (state.pendingFeedback) return state;
      if (!getVisibleMaterials(state).some((m) => m.id === event.materialId)) {
        return state;
      }
      return { ...state, selectedMaterialId: event.materialId };

    case "apply-tool":
      if (state.pendingFeedback) return state;
      return applySandboxTool(state, event.toolId);

    case "dismiss-feedback":
      return dismissSandboxFeedback(state);

    case "submit-conclusion": {
      const conclusion = state.mission.presentation.conclusions.find(
        (candidate) => candidate.id === event.conclusionId,
      );
      if (!conclusion || !isConclusionUnlocked(state, conclusion)) return state;
      return {
        ...state,
        phase: conclusion.correct ? "concluded" : "explore",
        conclusionAttempt: { conclusion, success: conclusion.correct },
      };
    }

    case "reset":
      return createSandboxLabSession(state.mission);
  }
}

export function hasRequiredEvidence(state: SandboxLabSessionState): boolean {
  const collected = new Set(state.collectedEvidence);
  return state.mission.presentation.stages.every((stage) =>
    stage.requiredEvidence.every((id) => collected.has(id)),
  );
}

export function isConclusionUnlocked(
  state: SandboxLabSessionState,
  conclusion: SandboxLabConclusion,
): boolean {
  if (state.pendingFeedback) return false;
  if (!hasRequiredEvidence(state)) return false;
  const collected = new Set(state.collectedEvidence);
  return conclusion.requiresEvidence.every((id) => collected.has(id));
}

export function hasCurrentStageEvidence(state: SandboxLabSessionState): boolean {
  const stage = getCurrentStage(state);
  if (!stage) return false;
  const collected = new Set(state.collectedEvidence);
  return stage.requiredEvidence.every((id) => collected.has(id));
}

export function getCurrentStage(state: SandboxLabSessionState) {
  return state.mission.presentation.stages[state.currentStageIndex] ?? null;
}

export function getVisibleMaterials(state: SandboxLabSessionState) {
  const stage = getCurrentStage(state);
  const visible = new Set(stage?.materialIds ?? []);
  return state.mission.presentation.materials.filter((material) =>
    visible.has(material.id),
  );
}

export function getVisibleTools(state: SandboxLabSessionState) {
  const stage = getCurrentStage(state);
  const visible = new Set(stage?.toolIds ?? []);
  return state.mission.presentation.tools.filter((tool) => visible.has(tool.id));
}

function applySandboxTool(
  state: SandboxLabSessionState,
  toolId: string,
): SandboxLabSessionState {
  if (state.phase === "concluded") return state;

  const presentation = state.mission.presentation;
  const material = getVisibleMaterials(state).find(
    (candidate) => candidate.id === state.selectedMaterialId,
  );
  const tool = getVisibleTools(state).find((candidate) => candidate.id === toolId);
  if (!material || !tool) return state;

  const collected = new Set(state.collectedEvidence);
  const interaction = presentation.interactions.find(
    (candidate) =>
      candidate.materialId === material.id &&
      candidate.toolId === tool.id &&
      !collected.has(candidate.evidenceId),
  );

  const action = actionForTool(tool.action, material.stationId);
  const { workspace, result } = applyAction(
    state.workspace,
    action,
    state.mission.scenario.rules,
    state.mission.scenario.entities,
  );

  const evidenceId = interaction?.evidenceId ?? `no-change:${material.id}:${tool.id}`;
  const genericObservation = `Nothing important changes when you use ${tool.label.toLowerCase()} on ${material.label.toLowerCase()}. Try a different tool or sample.`;
  const observation: SandboxLabObservation = {
    id: `${state.observations.length + 1}:${evidenceId}`,
    materialId: material.id,
    toolId: tool.id,
    evidenceId,
    observation: interaction
      ? interaction.observation ?? result.observation
      : genericObservation,
    explanation: interaction
      ? interaction.explanation ?? result.explanation
      : undefined,
    visibleChange: interaction ? result.visibleChange : false,
    gasLabel: interaction?.gasLabel ?? result.emits?.[0]?.gas,
  };
  const nextEvidence = interaction
    ? addUnique(state.collectedEvidence, evidenceId)
    : state.collectedEvidence;
  const stateWithEvidence = {
    ...state,
    collectedEvidence: nextEvidence,
  };
  const wouldAdvanceStage = getNextStageIndex(stateWithEvidence) !== state.currentStageIndex;
  const nextStageIndex = interaction ? state.currentStageIndex : getNextStageIndex(stateWithEvidence);
  const nextStage = presentation.stages[nextStageIndex];
  const selectedMaterialId =
    nextStage?.materialIds.includes(state.selectedMaterialId)
      ? state.selectedMaterialId
      : nextStage?.materialIds[0] ?? state.selectedMaterialId;

  return {
    ...state,
    workspace,
    currentStageIndex: nextStageIndex,
    selectedMaterialId,
    observations: [...state.observations, observation],
    collectedEvidence: nextEvidence,
    pendingFeedback: interaction
      ? {
          id: `${state.observations.length + 1}:${interaction.id}`,
          evidenceId,
          card: interaction.feedbackCard,
          soundCue: interaction.soundCue,
          stageComplete: wouldAdvanceStage,
        }
      : null,
    lastSoundCue: interaction ? interaction.soundCue : "wrong-tool",
    latestResult: {
      ...result,
      observation: observation.observation,
      ...(observation.explanation ? { explanation: observation.explanation } : {}),
    },
    latestInteraction: interaction ?? null,
    conclusionAttempt: null,
  };
}

function dismissSandboxFeedback(
  state: SandboxLabSessionState,
): SandboxLabSessionState {
  if (!state.pendingFeedback) return state;
  const nextStageIndex = getNextStageIndex(state);
  const nextStage = state.mission.presentation.stages[nextStageIndex];
  const selectedMaterialId =
    nextStage?.materialIds.includes(state.selectedMaterialId)
      ? state.selectedMaterialId
      : nextStage?.materialIds[0] ?? state.selectedMaterialId;

  return {
    ...state,
    currentStageIndex: nextStageIndex,
    selectedMaterialId,
    notebookEvidence: addNotebookEvidence(state.notebookEvidence, {
      id: state.pendingFeedback.id,
      evidenceId: state.pendingFeedback.evidenceId,
      text: state.pendingFeedback.card.notebook,
    }),
    pendingFeedback: null,
    lastSoundCue: state.pendingFeedback.stageComplete
      ? "stage-complete"
      : state.pendingFeedback.soundCue,
  };
}

function getNextStageIndex(state: SandboxLabSessionState): number {
  const collected = new Set(state.collectedEvidence);
  const currentStage = getCurrentStage(state);
  if (!currentStage) return state.currentStageIndex;
  const currentComplete = currentStage.requiredEvidence.every((id) => collected.has(id));
  const hasNextStage = state.currentStageIndex < state.mission.presentation.stages.length - 1;
  return currentComplete && hasNextStage
    ? state.currentStageIndex + 1
    : state.currentStageIndex;
}

function actionForTool(action: SandboxLabToolAction, stationId: string): Action {
  if (action.type === "pour") {
    return {
      type: "pour",
      reagent: action.reagent,
      target: action.target ?? stationId,
    };
  }
  if (action.type === "filter") {
    return { type: "filter", source: action.source ?? stationId };
  }
  return { type: action.type, target: action.target ?? stationId };
}

function addUnique(values: readonly string[], next: string): readonly string[] {
  return values.includes(next) ? values : [...values, next];
}

function addNotebookEvidence(
  values: readonly SandboxLabNotebookEvidence[],
  next: SandboxLabNotebookEvidence,
): readonly SandboxLabNotebookEvidence[] {
  return values.some((value) => value.evidenceId === next.evidenceId)
    ? values
    : [...values, next];
}
