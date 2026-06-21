import { useMemo, useReducer } from "react";
import type {
  SandboxLabConclusion,
  SandboxLabMission,
} from "../model/sandboxLab";
import {
  createSandboxLabSession,
  getCurrentStage,
  getVisibleMaterials,
  getVisibleTools,
  hasRequiredEvidence,
  isConclusionUnlocked,
  reduceSandboxLabSession,
  type SandboxLabSessionState,
} from "../engine/sandboxLabSession";

export interface SandboxLabSession {
  readonly state: SandboxLabSessionState;
  readonly selectedMaterialId: string;
  readonly hasRequiredEvidence: boolean;
  readonly canUseConclusions: boolean;
  readonly currentStage: ReturnType<typeof getCurrentStage>;
  readonly visibleMaterials: ReturnType<typeof getVisibleMaterials>;
  readonly visibleTools: ReturnType<typeof getVisibleTools>;
  readonly dismissFeedback: () => void;
  readonly isConclusionUnlocked: (conclusion: SandboxLabConclusion) => boolean;
  readonly selectMaterial: (materialId: string) => void;
  readonly applyTool: (toolId: string) => void;
  readonly submitConclusion: (conclusionId: string) => void;
  readonly reset: () => void;
}

export function useSandboxLabSession(
  mission: SandboxLabMission,
): SandboxLabSession {
  const [state, dispatch] = useReducer(
    reduceSandboxLabSession,
    mission,
    createSandboxLabSession,
  );

  const requiredEvidenceReady = hasRequiredEvidence(state) && !state.pendingFeedback;
  const conclusionUnlocks = useMemo(
    () =>
      new Map(
        mission.presentation.conclusions.map((conclusion) => [
          conclusion.id,
          isConclusionUnlocked(state, conclusion),
        ]),
      ),
    [mission.presentation.conclusions, state],
  );

  return {
    state,
    selectedMaterialId: state.selectedMaterialId,
    hasRequiredEvidence: requiredEvidenceReady,
    canUseConclusions: requiredEvidenceReady,
    currentStage: getCurrentStage(state),
    visibleMaterials: getVisibleMaterials(state),
    visibleTools: getVisibleTools(state),
    dismissFeedback: () => dispatch({ type: "dismiss-feedback" }),
    isConclusionUnlocked: (conclusion) =>
      conclusionUnlocks.get(conclusion.id) ?? false,
    selectMaterial: (materialId) =>
      dispatch({ type: "select-material", materialId }),
    applyTool: (toolId) => dispatch({ type: "apply-tool", toolId }),
    submitConclusion: (conclusionId) =>
      dispatch({ type: "submit-conclusion", conclusionId }),
    reset: () => dispatch({ type: "reset" }),
  };
}
