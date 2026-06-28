/**
 * Theme tokens for {@link SandboxLabViewport}.
 *
 * The investigation layout is fixed (the grid in `sandboxLab.css` owns region
 * order and sizing). This module only governs the *skin* — palette, accent,
 * intensity — plus one safe layout knob (`headerDensity`) that adjusts the HUD
 * row without touching the `minmax(0, 1fr)` experiment row, so it can never
 * collapse the grid.
 *
 * Tokens resolve to CSS classes consumed by `sandboxLab.css` via
 * {@link sandboxLabThemeClasses}. Unknown values fall back to the default and
 * are reported through `diagnostics` (mirrors the template config pattern).
 */

export const SANDBOX_LAB_PALETTES = [
  "clean-lab",
  "warm-lab",
  "night-lab",
  "field-notes",
] as const;

export type SandboxLabPalette = (typeof SANDBOX_LAB_PALETTES)[number];

export const SANDBOX_LAB_ACCENTS = ["blue", "green", "amber", "rose"] as const;

export type SandboxLabAccent = (typeof SANDBOX_LAB_ACCENTS)[number];

export const SANDBOX_LAB_INTENSITIES = [
  "calm",
  "standard",
  "high-contrast",
] as const;

export type SandboxLabIntensity = (typeof SANDBOX_LAB_INTENSITIES)[number];

export const SANDBOX_LAB_HEADER_DENSITIES = ["standard", "compact"] as const;

export type SandboxLabHeaderDensity =
  (typeof SANDBOX_LAB_HEADER_DENSITIES)[number];

export interface SandboxLabTheme {
  palette: SandboxLabPalette;
  accent: SandboxLabAccent;
  intensity: SandboxLabIntensity;
  headerDensity: SandboxLabHeaderDensity;
}

export type SandboxLabThemeInput = Partial<
  Record<keyof SandboxLabTheme, unknown>
>;

export interface SandboxLabThemeDiagnostic {
  key: keyof SandboxLabTheme;
  received: unknown;
  fallback: string;
  allowed: readonly string[];
}

export interface NormalizedSandboxLabTheme {
  theme: SandboxLabTheme;
  diagnostics: SandboxLabThemeDiagnostic[];
}

export const DEFAULT_SANDBOX_LAB_THEME = {
  palette: "clean-lab",
  accent: "blue",
  intensity: "standard",
  headerDensity: "standard",
} as const satisfies SandboxLabTheme;

export function normalizeSandboxLabTheme(
  input: SandboxLabThemeInput = {},
): NormalizedSandboxLabTheme {
  const diagnostics: SandboxLabThemeDiagnostic[] = [];

  const theme: SandboxLabTheme = {
    palette: normalizeToken({
      key: "palette",
      received: input.palette,
      allowed: SANDBOX_LAB_PALETTES,
      fallback: DEFAULT_SANDBOX_LAB_THEME.palette,
      diagnostics,
    }),
    accent: normalizeToken({
      key: "accent",
      received: input.accent,
      allowed: SANDBOX_LAB_ACCENTS,
      fallback: DEFAULT_SANDBOX_LAB_THEME.accent,
      diagnostics,
    }),
    intensity: normalizeToken({
      key: "intensity",
      received: input.intensity,
      allowed: SANDBOX_LAB_INTENSITIES,
      fallback: DEFAULT_SANDBOX_LAB_THEME.intensity,
      diagnostics,
    }),
    headerDensity: normalizeToken({
      key: "headerDensity",
      received: input.headerDensity,
      allowed: SANDBOX_LAB_HEADER_DENSITIES,
      fallback: DEFAULT_SANDBOX_LAB_THEME.headerDensity,
      diagnostics,
    }),
  };

  return { theme, diagnostics };
}

export function assertSandboxLabTheme(
  input: SandboxLabThemeInput = {},
): SandboxLabTheme {
  const normalized = normalizeSandboxLabTheme(input);

  if (normalized.diagnostics.length > 0) {
    const details = normalized.diagnostics
      .map(
        (diagnostic) =>
          `${diagnostic.key} received ${JSON.stringify(
            diagnostic.received,
          )}; expected one of ${diagnostic.allowed.join(", ")}`,
      )
      .join("; ");

    throw new Error(`Invalid SandboxLab theme: ${details}`);
  }

  return normalized.theme;
}

/**
 * Resolve a theme (full or partial) into the space-separated class list applied
 * to the `.sandbox-lab-app` root. Unknown tokens fall back silently here; use
 * {@link normalizeSandboxLabTheme} when you need the diagnostics.
 */
export function sandboxLabThemeClasses(
  input: SandboxLabThemeInput = {},
): string {
  const { theme } = normalizeSandboxLabTheme(input);

  return [
    `sl-palette-${theme.palette}`,
    `sl-accent-${theme.accent}`,
    `sl-intensity-${theme.intensity}`,
    `sl-header-${theme.headerDensity}`,
  ].join(" ");
}

function normalizeToken<const TToken extends string>(options: {
  key: keyof SandboxLabTheme;
  received: unknown;
  allowed: readonly TToken[];
  fallback: TToken;
  diagnostics: SandboxLabThemeDiagnostic[];
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
