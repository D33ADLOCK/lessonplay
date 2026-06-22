export const LEARN_LOOP_TEMPLATE_SECTION_ORDER = [
  "header",
  "mission",
  "experiment",
  "toolTray",
  "feedback",
  "notebook",
] as const;

export type LearnLoopTemplateSection =
  (typeof LEARN_LOOP_TEMPLATE_SECTION_ORDER)[number];

export const LEARN_LOOP_TEMPLATE_REGION_RATIOS = {
  header: 0.18,
  mission: 0.1,
  experiment: 0.5,
  toolTray: 0.12,
  feedback: 0.06,
  notebook: 0.04,
} as const satisfies Record<LearnLoopTemplateSection, number>;

export const LEARN_LOOP_TEMPLATE_PALETTES = [
  "clean-lab",
  "warm-lab",
  "night-lab",
  "field-notes",
] as const;

export type LearnLoopTemplatePalette =
  (typeof LEARN_LOOP_TEMPLATE_PALETTES)[number];

export const LEARN_LOOP_TEMPLATE_ACCENTS = [
  "blue",
  "green",
  "amber",
  "rose",
] as const;

export type LearnLoopTemplateAccent =
  (typeof LEARN_LOOP_TEMPLATE_ACCENTS)[number];

export const LEARN_LOOP_TEMPLATE_INTENSITIES = [
  "calm",
  "standard",
  "high-contrast",
] as const;

export type LearnLoopTemplateIntensity =
  (typeof LEARN_LOOP_TEMPLATE_INTENSITIES)[number];

export const LEARN_LOOP_TEMPLATE_HEADER_VARIANTS = [
  "standard",
  "compact",
] as const;

export type LearnLoopTemplateHeaderVariant =
  (typeof LEARN_LOOP_TEMPLATE_HEADER_VARIANTS)[number];

export const LEARN_LOOP_TEMPLATE_STAGE_VARIANTS = [
  "bench",
  "split-bench",
  "process-flow",
] as const;

export type LearnLoopTemplateStageVariant =
  (typeof LEARN_LOOP_TEMPLATE_STAGE_VARIANTS)[number];

export const LEARN_LOOP_TEMPLATE_FEEDBACK_VARIANTS = [
  "inline",
  "notebook",
] as const;

export type LearnLoopTemplateFeedbackVariant =
  (typeof LEARN_LOOP_TEMPLATE_FEEDBACK_VARIANTS)[number];

export interface LearnLoopTemplateThemeConfig {
  palette: LearnLoopTemplatePalette;
  accent: LearnLoopTemplateAccent;
  intensity: LearnLoopTemplateIntensity;
}

export interface LearnLoopTemplateVariantConfig {
  header: LearnLoopTemplateHeaderVariant;
  stage: LearnLoopTemplateStageVariant;
  feedback: LearnLoopTemplateFeedbackVariant;
}

export interface LearnLoopTemplateConfig {
  theme: LearnLoopTemplateThemeConfig;
  variants: LearnLoopTemplateVariantConfig;
}

export type LearnLoopTemplateConfigInput = Partial<{
  theme: Partial<Record<keyof LearnLoopTemplateThemeConfig, unknown>>;
  variants: Partial<Record<keyof LearnLoopTemplateVariantConfig, unknown>>;
}>;

export interface LearnLoopTemplateConfigDiagnostic {
  path: string;
  received: unknown;
  fallback: string;
  allowed: readonly string[];
}

export interface NormalizedLearnLoopTemplateConfig {
  config: LearnLoopTemplateConfig;
  diagnostics: LearnLoopTemplateConfigDiagnostic[];
}

export const DEFAULT_LEARN_LOOP_TEMPLATE_CONFIG = {
  theme: {
    palette: "clean-lab",
    accent: "blue",
    intensity: "standard",
  },
  variants: {
    header: "standard",
    stage: "bench",
    feedback: "inline",
  },
} as const satisfies LearnLoopTemplateConfig;

export function normalizeLearnLoopTemplateConfig(
  input: LearnLoopTemplateConfigInput = {},
): NormalizedLearnLoopTemplateConfig {
  const diagnostics: LearnLoopTemplateConfigDiagnostic[] = [];

  const theme = {
    palette: normalizeToken({
      path: "theme.palette",
      received: input.theme?.palette,
      allowed: LEARN_LOOP_TEMPLATE_PALETTES,
      fallback: DEFAULT_LEARN_LOOP_TEMPLATE_CONFIG.theme.palette,
      diagnostics,
    }),
    accent: normalizeToken({
      path: "theme.accent",
      received: input.theme?.accent,
      allowed: LEARN_LOOP_TEMPLATE_ACCENTS,
      fallback: DEFAULT_LEARN_LOOP_TEMPLATE_CONFIG.theme.accent,
      diagnostics,
    }),
    intensity: normalizeToken({
      path: "theme.intensity",
      received: input.theme?.intensity,
      allowed: LEARN_LOOP_TEMPLATE_INTENSITIES,
      fallback: DEFAULT_LEARN_LOOP_TEMPLATE_CONFIG.theme.intensity,
      diagnostics,
    }),
  };

  const variants = {
    header: normalizeToken({
      path: "variants.header",
      received: input.variants?.header,
      allowed: LEARN_LOOP_TEMPLATE_HEADER_VARIANTS,
      fallback: DEFAULT_LEARN_LOOP_TEMPLATE_CONFIG.variants.header,
      diagnostics,
    }),
    stage: normalizeToken({
      path: "variants.stage",
      received: input.variants?.stage,
      allowed: LEARN_LOOP_TEMPLATE_STAGE_VARIANTS,
      fallback: DEFAULT_LEARN_LOOP_TEMPLATE_CONFIG.variants.stage,
      diagnostics,
    }),
    feedback: normalizeToken({
      path: "variants.feedback",
      received: input.variants?.feedback,
      allowed: LEARN_LOOP_TEMPLATE_FEEDBACK_VARIANTS,
      fallback: DEFAULT_LEARN_LOOP_TEMPLATE_CONFIG.variants.feedback,
      diagnostics,
    }),
  };

  return {
    config: {
      theme,
      variants,
    },
    diagnostics,
  };
}

export function assertLearnLoopTemplateConfig(
  input: LearnLoopTemplateConfigInput = {},
): LearnLoopTemplateConfig {
  const normalized = normalizeLearnLoopTemplateConfig(input);

  if (normalized.diagnostics.length > 0) {
    const details = normalized.diagnostics
      .map(
        (diagnostic) =>
          `${diagnostic.path} received ${JSON.stringify(
            diagnostic.received,
          )}; expected one of ${diagnostic.allowed.join(", ")}`,
      )
      .join("; ");

    throw new Error(`Invalid Learn Loop template config: ${details}`);
  }

  return normalized.config;
}

function normalizeToken<const TToken extends string>(options: {
  path: string;
  received: unknown;
  allowed: readonly TToken[];
  fallback: TToken;
  diagnostics: LearnLoopTemplateConfigDiagnostic[];
}): TToken {
  if (options.received === undefined) {
    return options.fallback;
  }

  if (
    typeof options.received === "string" &&
    (options.allowed as readonly string[]).includes(options.received)
  ) {
    return options.received as TToken;
  }

  options.diagnostics.push({
    path: options.path,
    received: options.received,
    fallback: options.fallback,
    allowed: options.allowed,
  });

  return options.fallback;
}
