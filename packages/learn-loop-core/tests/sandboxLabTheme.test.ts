import { describe, expect, it } from "vitest";
import {
  DEFAULT_SANDBOX_LAB_THEME,
  assertSandboxLabTheme,
  normalizeSandboxLabTheme,
  sandboxLabThemeClasses,
} from "../src/ui/sandboxLabTheme";

describe("normalizeSandboxLabTheme", () => {
  it("returns the default theme with no diagnostics for empty input", () => {
    const result = normalizeSandboxLabTheme();

    expect(result.theme).toEqual(DEFAULT_SANDBOX_LAB_THEME);
    expect(result.diagnostics).toEqual([]);
  });

  it("keeps valid tokens", () => {
    const result = normalizeSandboxLabTheme({
      palette: "night-lab",
      accent: "rose",
      intensity: "high-contrast",
      headerDensity: "compact",
    });

    expect(result.theme).toEqual({
      palette: "night-lab",
      accent: "rose",
      intensity: "high-contrast",
      headerDensity: "compact",
    });
    expect(result.diagnostics).toEqual([]);
  });

  it("falls back per field and reports diagnostics for unknown tokens", () => {
    const result = normalizeSandboxLabTheme({
      palette: "neon-lab",
      accent: "blue",
    });

    expect(result.theme.palette).toBe(DEFAULT_SANDBOX_LAB_THEME.palette);
    expect(result.theme.accent).toBe("blue");
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]).toMatchObject({
      key: "palette",
      received: "neon-lab",
      fallback: DEFAULT_SANDBOX_LAB_THEME.palette,
    });
  });

  it("falls back for non-string values", () => {
    const result = normalizeSandboxLabTheme({ accent: 42 });

    expect(result.theme.accent).toBe(DEFAULT_SANDBOX_LAB_THEME.accent);
    expect(result.diagnostics).toHaveLength(1);
    expect(result.diagnostics[0]?.key).toBe("accent");
  });
});

describe("assertSandboxLabTheme", () => {
  it("returns the theme when every token is valid", () => {
    expect(assertSandboxLabTheme({ palette: "warm-lab" })).toEqual({
      ...DEFAULT_SANDBOX_LAB_THEME,
      palette: "warm-lab",
    });
  });

  it("throws on an invalid token", () => {
    expect(() => assertSandboxLabTheme({ intensity: "loud" })).toThrow(
      /Invalid SandboxLab theme/,
    );
  });
});

describe("sandboxLabThemeClasses", () => {
  it("emits the default class set for empty input", () => {
    expect(sandboxLabThemeClasses()).toBe(
      "sl-palette-clean-lab sl-accent-blue sl-intensity-standard sl-header-standard",
    );
  });

  it("reflects valid tokens and falls back for unknown ones", () => {
    expect(
      sandboxLabThemeClasses({
        palette: "field-notes",
        accent: "nope",
        headerDensity: "compact",
      }),
    ).toBe(
      "sl-palette-field-notes sl-accent-blue sl-intensity-standard sl-header-compact",
    );
  });
});
