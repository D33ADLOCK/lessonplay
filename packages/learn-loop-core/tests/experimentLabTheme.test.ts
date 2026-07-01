import { describe, expect, it } from "vitest";
import {
  DEFAULT_EXPERIMENT_LAB_THEME,
  assertExperimentLabTheme,
  experimentLabThemeClasses,
  normalizeExperimentLabTheme,
} from "../src/ui/experimentLabTheme";

describe("normalizeExperimentLabTheme", () => {
  it("returns the dark-glow default with no diagnostics for empty input", () => {
    const result = normalizeExperimentLabTheme();

    expect(result.theme).toEqual(DEFAULT_EXPERIMENT_LAB_THEME);
    expect(result.theme).toEqual({
      palette: "night-lab",
      accent: "cyan",
      intensity: "standard",
    });
    expect(result.diagnostics).toEqual([]);
  });

  it("keeps valid tokens", () => {
    const result = normalizeExperimentLabTheme({
      palette: "warm-lab",
      accent: "violet",
      intensity: "vivid",
    });

    expect(result.theme).toEqual({
      palette: "warm-lab",
      accent: "violet",
      intensity: "vivid",
    });
    expect(result.diagnostics).toEqual([]);
  });

  it("falls back per field and reports diagnostics for unknown tokens", () => {
    const result = normalizeExperimentLabTheme({
      palette: "neon-lab",
      accent: "violet",
    });

    expect(result.theme.palette).toBe(DEFAULT_EXPERIMENT_LAB_THEME.palette);
    expect(result.theme.accent).toBe("violet");
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]).toMatchObject({
      key: "palette",
      received: "neon-lab",
      fallback: DEFAULT_EXPERIMENT_LAB_THEME.palette,
    });
  });

  it("falls back for non-string values", () => {
    const result = normalizeExperimentLabTheme({ intensity: 7 });

    expect(result.theme.intensity).toBe(DEFAULT_EXPERIMENT_LAB_THEME.intensity);
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]?.key).toBe("intensity");
  });
});

describe("assertExperimentLabTheme", () => {
  it("returns the theme when every token is valid", () => {
    expect(assertExperimentLabTheme({ accent: "amber" })).toEqual({
      ...DEFAULT_EXPERIMENT_LAB_THEME,
      accent: "amber",
    });
  });

  it("throws on an invalid token", () => {
    expect(() => assertExperimentLabTheme({ palette: "chrome" })).toThrow(
      /Invalid ExperimentLab theme/,
    );
  });
});

describe("experimentLabThemeClasses", () => {
  it("emits the default class set for empty input", () => {
    expect(experimentLabThemeClasses()).toBe(
      "xl-palette-night-lab xl-accent-cyan xl-intensity-standard",
    );
  });

  it("reflects valid tokens and falls back for unknown ones", () => {
    expect(
      experimentLabThemeClasses({
        palette: "abyss",
        accent: "nope",
        intensity: "vivid",
      }),
    ).toBe("xl-palette-abyss xl-accent-cyan xl-intensity-vivid");
  });
});
