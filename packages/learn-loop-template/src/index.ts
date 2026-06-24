export { LearnLoopGame } from "./LearnLoopGame";
export { SandboxLabViewport as ChemQuestLabGame } from "@learn-loop/core/ui";

export {
  DEFAULT_LEARN_LOOP_TEMPLATE_CONFIG,
  LEARN_LOOP_TEMPLATE_ACCENTS,
  LEARN_LOOP_TEMPLATE_FEEDBACK_VARIANTS,
  LEARN_LOOP_TEMPLATE_HEADER_VARIANTS,
  LEARN_LOOP_TEMPLATE_INTENSITIES,
  LEARN_LOOP_TEMPLATE_PALETTES,
  LEARN_LOOP_TEMPLATE_REGION_RATIOS,
  LEARN_LOOP_TEMPLATE_SECTION_ORDER,
  LEARN_LOOP_TEMPLATE_STAGE_VARIANTS,
  assertLearnLoopTemplateConfig,
  normalizeLearnLoopTemplateConfig,
} from "./config";
export {
  LEARN_LOOP_STATION_VISUAL_KINDS,
  createLearnLoopStationPresentation,
  createLearnLoopTemplatePresentation,
  normalizeLearnLoopPresentation,
} from "./presentation";

export type { LearnLoopGameProps } from "./LearnLoopGame";
export type {
  SandboxLabViewportProps as ChemQuestLabGameProps,
} from "@learn-loop/core/ui";

export type {
  LearnLoopTemplateAccent,
  LearnLoopTemplateConfig,
  LearnLoopTemplateConfigDiagnostic,
  LearnLoopTemplateConfigInput,
  LearnLoopTemplateFeedbackVariant,
  LearnLoopTemplateHeaderVariant,
  LearnLoopTemplateIntensity,
  LearnLoopTemplatePalette,
  LearnLoopTemplateSection,
  LearnLoopTemplateStageVariant,
  LearnLoopTemplateThemeConfig,
  LearnLoopTemplateVariantConfig,
  NormalizedLearnLoopTemplateConfig,
} from "./config";
export type {
  LearnLoopPresentationDiagnostic,
  LearnLoopPresentationInput,
  LearnLoopStationPresentation,
  LearnLoopStationRole,
  LearnLoopStationVisualKind,
  NormalizedLearnLoopPresentation,
  NormalizedLearnLoopStationPresentation,
} from "./presentation";
