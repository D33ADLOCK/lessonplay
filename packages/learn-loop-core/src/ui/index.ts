/**
 * `@learn-loop/core/ui` — the optional React shells for the guided-sim loop.
 *
 * Kept behind a separate entry so headless consumers of `@learn-loop/core` never
 * pull in React. A game composes these with its own skin (renderer + apparatus
 * art) to render the loop; all of them are domain-agnostic presentation.
 */

export { Stage, type StageProps } from "./Stage";
export { ToolTray, type ToolTrayProps } from "./ToolTray";
export {
  StepCounter,
  CuePanel,
  ResultPanel,
  CompletePanel,
} from "./panels";
export { titleCase } from "./titleCase";
export { useGuidedSession, type GuidedSession } from "./useGuidedSession";
export {
  GuidedLabViewport,
  type GuidedLabViewportProps,
} from "./GuidedLabViewport";
export {
  SandboxLabViewport,
  type SandboxLabViewportProps,
} from "./SandboxLabViewport";
export {
  SANDBOX_LAB_PALETTES,
  SANDBOX_LAB_ACCENTS,
  SANDBOX_LAB_INTENSITIES,
  SANDBOX_LAB_HEADER_DENSITIES,
  DEFAULT_SANDBOX_LAB_THEME,
  normalizeSandboxLabTheme,
  assertSandboxLabTheme,
  sandboxLabThemeClasses,
  type SandboxLabTheme,
  type SandboxLabThemeInput,
  type SandboxLabPalette,
  type SandboxLabAccent,
  type SandboxLabIntensity,
  type SandboxLabHeaderDensity,
} from "./sandboxLabTheme";
export {
  useSandboxLabSession,
  type SandboxLabSession,
} from "./useSandboxLabSession";
export { playSandboxLabSoundCue } from "./sandboxLabSound";
export {
  apparatusLabel,
  reactionLabel,
  stationVisualClasses,
} from "./sandboxLabKit";
export { Beaker } from "./Beaker";
export {
  ExperimentLabViewport,
  type ExperimentLabViewportProps,
} from "./ExperimentLabViewport";
export {
  useExperimentSession,
  EXPERIMENT_OBSERVE_MS,
  type ExperimentSession,
} from "./useExperimentSession";
export {
  EXPERIMENT_LAB_PALETTES,
  EXPERIMENT_LAB_ACCENTS,
  EXPERIMENT_LAB_INTENSITIES,
  DEFAULT_EXPERIMENT_LAB_THEME,
  normalizeExperimentLabTheme,
  assertExperimentLabTheme,
  experimentLabThemeClasses,
  type ExperimentLabTheme,
  type ExperimentLabThemeInput,
  type ExperimentLabPalette,
  type ExperimentLabAccent,
  type ExperimentLabIntensity,
} from "./experimentLabTheme";
