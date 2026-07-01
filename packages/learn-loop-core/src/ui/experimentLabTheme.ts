/**
 * Theme tokens for {@link ExperimentLabViewport}.
 *
 * The discovery layout is fixed (the flex column in `experimentLab.css` owns the
 * region order and the hero beaker geometry). This module only governs the
 * *skin* — `palette` (background + panel + ink), `accent` (the Tyndall beam /
 * glow hero colour), and `intensity` (how strong the glow reads). Tokens resolve
 * to CSS classes on the `.experiment-lab-app` root, which flip CSS variables the
 * stylesheet already consumes; the grid/flex layout never changes, so a bad
 * token can never collapse the screen.
 *
 * The default — `night-lab` / `cyan` / `standard` — reproduces the hand-built
 * "Invisible Particle Detective" look exactly. Unknown values fall back to the
 * default and are reported through `diagnostics` (mirrors {@link
 * ./sandboxLabTheme}).
 */

export const EXPERIMENT_LAB_PALETTES = [
  "night-lab",
  "warm-lab",
  "abyss",
] as const;

export type ExperimentLabPalette = (typeof EXPERIMENT_LAB_PALETTES)[number];

export const EXPERIMENT_LAB_ACCENTS = ["cyan", "violet", "amber"] as const;

export type ExperimentLabAccent = (typeof EXPERIMENT_LAB_ACCENTS)[number];

export const EXPERIMENT_LAB_INTENSITIES = [
  "calm",
  "standard",
  "vivid",
] as const;

export type ExperimentLabIntensity =
  (typeof EXPERIMENT_LAB_INTENSITIES)[number];

export interface ExperimentLabTheme {
  palette: ExperimentLabPalette;
  accent: ExperimentLabAccent;
  intensity: ExperimentLabIntensity;
}

export type ExperimentLabThemeInput = Partial<
  Record<keyof ExperimentLabTheme, unknown>
>;

export interface ExperimentLabThemeDiagnostic {
  key: keyof ExperimentLabTheme;
  received: unknown;
  fallback: string;
  allowed: readonly string[];
}

export interface NormalizedExperimentLabTheme {
  theme: ExperimentLabTheme;
  diagnostics: ExperimentLabThemeDiagnostic[];
}

export const DEFAULT_EXPERIMENT_LAB_THEME = {
  palette: "night-lab",
  accent: "cyan",
  intensity: "standard",
} as const satisfies ExperimentLabTheme;

export function normalizeExperimentLabTheme(
  input: ExperimentLabThemeInput = {},
): NormalizedExperimentLabTheme {
  const diagnostics: ExperimentLabThemeDiagnostic[] = [];

  const theme: ExperimentLabTheme = {
    palette: normalizeToken({
      key: "palette",
      received: input.palette,
      allowed: EXPERIMENT_LAB_PALETTES,
      fallback: DEFAULT_EXPERIMENT_LAB_THEME.palette,
      diagnostics,
    }),
    accent: normalizeToken({
      key: "accent",
      received: input.accent,
      allowed: EXPERIMENT_LAB_ACCENTS,
      fallback: DEFAULT_EXPERIMENT_LAB_THEME.accent,
      diagnostics,
    }),
    intensity: normalizeToken({
      key: "intensity",
      received: input.intensity,
      allowed: EXPERIMENT_LAB_INTENSITIES,
      fallback: DEFAULT_EXPERIMENT_LAB_THEME.intensity,
      diagnostics,
    }),
  };

  return { theme, diagnostics };
}

export function assertExperimentLabTheme(
  input: ExperimentLabThemeInput = {},
): ExperimentLabTheme {
  const normalized = normalizeExperimentLabTheme(input);

  if (normalized.diagnostics.length > 0) {
    const details = normalized.diagnostics
      .map(
        (diagnostic) =>
          `${diagnostic.key} received ${JSON.stringify(
            diagnostic.received,
          )}; expected one of ${diagnostic.allowed.join(", ")}`,
      )
      .join("; ");

    throw new Error(`Invalid ExperimentLab theme: ${details}`);
  }

  return normalized.theme;
}

/**
 * Resolve a theme (full or partial) into the space-separated class list applied
 * to the `.experiment-lab-app` root. Unknown tokens fall back silently here; use
 * {@link normalizeExperimentLabTheme} when you need the diagnostics.
 */
export function experimentLabThemeClasses(
  input: ExperimentLabThemeInput = {},
): string {
  const { theme } = normalizeExperimentLabTheme(input);

  return [
    `xl-palette-${theme.palette}`,
    `xl-accent-${theme.accent}`,
    `xl-intensity-${theme.intensity}`,
  ].join(" ");
}

function normalizeToken<const TToken extends string>(options: {
  key: keyof ExperimentLabTheme;
  received: unknown;
  allowed: readonly TToken[];
  fallback: TToken;
  diagnostics: ExperimentLabThemeDiagnostic[];
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
    key: options.key,
    received: options.received,
    fallback: options.fallback,
    allowed: options.allowed,
  });

  return options.fallback;
}
