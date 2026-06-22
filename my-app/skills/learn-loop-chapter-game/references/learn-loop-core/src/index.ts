/**
 * `@learn-loop/core` — the headless guided-sim engine.
 *
 * This barrel is React-free: model value types, the rule engine, the scenario
 * validator, the session reducer, the tap-gate, and the stage geometry. A game
 * imports these to run the Predict → Observe → Explain loop without pulling in
 * any UI. The optional React shells live behind the separate `@learn-loop/core/ui`
 * entry so headless consumers never depend on React.
 */

// Model
export type {
  Entity,
  EntityId,
  EntityKind,
  HeatLevel,
  Station,
  StationId,
  Workspace,
  Emission,
  StepResult,
} from "./model/entity";
export type {
  PourAction,
  TransferAction,
  FilterAction,
  HeatAction,
  StirAction,
  Action,
  ActionType,
} from "./model/actions";
export { IMPLEMENTED_ACTIONS } from "./model/actions";
export type {
  Transform,
  ReactTransform,
  SplitTransform,
  EvaporateTransform,
  DistilTransform,
  MoveAllTransform,
  TransformKind,
  Rule,
  PredictionOption,
  ExpectedAction,
  Step,
  Scenario,
  ValidationResult,
} from "./model/scenario";
export { IMPLEMENTED_TRANSFORMS } from "./model/scenario";
export type {
  GuidedLabEffectTag,
  GuidedLabGame,
  GuidedLabMission,
  GuidedLabMissionPresentation,
  StationVisual,
  StationVisualKind,
} from "./model/guidedLabPresentation";
export {
  GUIDED_LAB_EFFECT_TAGS,
  GUIDED_LAB_APPARATUS_LABELS,
  GUIDED_LAB_REACTION_LABELS,
  STATION_VISUAL_KINDS,
  validateGuidedLabPresentation,
} from "./model/guidedLabPresentation";
export type {
  SandboxLabConclusion,
  SandboxLabEffectTag,
  SandboxLabFeedbackCard,
  SandboxLabGame,
  SandboxLabInteraction,
  SandboxLabMaterial,
  SandboxLabMission,
  SandboxLabMissionPresentation,
  SandboxLabNotebook,
  SandboxLabReactionEffect,
  SandboxLabSoundCue,
  SandboxLabTool,
  SandboxLabToolAction,
} from "./model/sandboxLab";
export {
  SANDBOX_LAB_EFFECT_TAGS,
  SANDBOX_LAB_REACTION_EFFECTS,
  SANDBOX_LAB_SOUND_CUES,
  validateSandboxLabPresentation,
} from "./model/sandboxLab";

// Engine
export { applyAction, type ApplyResult } from "./engine/applyAction";
export { validateScenario } from "./engine/validateScenario";
export {
  createSession,
  reduce,
  currentStep,
  isStepResolved,
  type Phase,
  type SessionState,
  type SessionEvent,
} from "./engine/session";
export {
  createSandboxLabSession,
  reduceSandboxLabSession,
  hasRequiredEvidence,
  isConclusionUnlocked,
  type SandboxLabConclusionAttempt,
  type SandboxLabObservation,
  type SandboxLabPhase,
  type SandboxLabSessionEvent,
  type SandboxLabSessionState,
} from "./engine/sandboxLabSession";
export {
  gateTap,
  hintTargetFor,
  type TapOutcome,
  type ToolHint,
} from "./engine/tapGate";

// Stage geometry
export {
  computeStationLayout,
  type Rect,
  type StationBox,
  type StageLayout,
} from "./stage/layout";
