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
  useSandboxLabSession,
  type SandboxLabSession,
} from "./useSandboxLabSession";
export { playSandboxLabSoundCue } from "./sandboxLabSound";
export {
  apparatusLabel,
  reactionLabel,
  stationVisualClasses,
} from "./sandboxLabKit";
