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
export type {
  ClassifyGoal,
  ExperimentCategory,
  ExperimentDefinition,
  ExperimentEffect,
  ExperimentGame,
  ExperimentGoal,
  ExperimentGoalKind,
  ExperimentHint,
  ExperimentLevel,
  ExperimentPrompt,
  ExperimentPropertyValue,
  ExperimentReadout,
  ExperimentReadoutKind,
  ExperimentRule,
  ExperimentRuleSet,
  ExperimentSample,
  ExperimentSampleState,
  ExperimentScaffolding,
  ExperimentTool,
  ExperimentVisual,
  PredictOutcomeGoal,
  ReachTargetStateGoal,
} from "./model/experimentLab";
export {
  EXPERIMENT_READOUT_KINDS,
  EXPERIMENT_SCAFFOLDING,
  EXPERIMENT_VISUALS,
  experimentGoalKind,
  isClassifyGoal,
  isPredictOutcomeGoal,
  isReachTargetStateGoal,
} from "./model/experimentLab";

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
export {
  solveSandboxLabMission,
  type SandboxLabSolveResult,
} from "./engine/solveSandboxLabMission";
export { validateSandboxLabMission } from "./engine/validateSandboxLabMission";
export {
  matchesWhen,
  runExperimentStep,
  runExperimentSequence,
  type ExperimentStepResult,
} from "./engine/experimentRules";
export {
  sampleSignature,
  distinguishable,
  type ExperimentSignature,
} from "./engine/experimentSignature";
export {
  solveExperiment,
  analyzeExperimentGame,
  type ExperimentAnalysis,
} from "./engine/solveExperiment";
export {
  validateExperimentGame,
  validateExperimentMission,
} from "./engine/validateExperimentGame";
export {
  createExperimentSession,
  reduceExperimentSession,
  currentLevel,
  canClassify,
  type ExperimentPhase,
  type ExperimentNotebookEntry,
  type ExperimentObservationResult,
  type ExperimentClassificationResult,
  type ExperimentSessionState,
  type ExperimentSessionEvent,
} from "./engine/experimentSession";

// Stage geometry
export {
  computeStationLayout,
  type Rect,
  type StationBox,
  type StageLayout,
} from "./stage/layout";
