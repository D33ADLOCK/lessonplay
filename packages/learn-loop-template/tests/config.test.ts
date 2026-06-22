import { describe, expect, it } from "vitest";

import {
  DEFAULT_LEARN_LOOP_TEMPLATE_CONFIG,
  LEARN_LOOP_TEMPLATE_REGION_RATIOS,
  LEARN_LOOP_TEMPLATE_SECTION_ORDER,
  assertLearnLoopTemplateConfig,
  normalizeLearnLoopTemplateConfig,
} from "../src";

describe("Learn Loop template config", () => {
  it("provides stable defaults", () => {
    expect(normalizeLearnLoopTemplateConfig()).toEqual({
      config: DEFAULT_LEARN_LOOP_TEMPLATE_CONFIG,
      diagnostics: [],
    });
  });

  it("preserves approved theme and variant tokens", () => {
    const normalized = normalizeLearnLoopTemplateConfig({
      theme: {
        palette: "night-lab",
        accent: "rose",
        intensity: "high-contrast",
      },
      variants: {
        header: "compact",
        stage: "process-flow",
        feedback: "notebook",
      },
    });

    expect(normalized).toEqual({
      config: {
        theme: {
          palette: "night-lab",
          accent: "rose",
          intensity: "high-contrast",
        },
        variants: {
          header: "compact",
          stage: "process-flow",
          feedback: "notebook",
        },
      },
      diagnostics: [],
    });
  });

  it("defaults unknown values and reports diagnostics", () => {
    const normalized = normalizeLearnLoopTemplateConfig({
      theme: {
        palette: "custom-purple-gradient",
        accent: 17,
      },
      variants: {
        stage: "free-layout",
      },
    });

    expect(normalized.config).toEqual({
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
    });
    expect(normalized.diagnostics).toEqual([
      expect.objectContaining({
        path: "theme.palette",
        received: "custom-purple-gradient",
        fallback: "clean-lab",
      }),
      expect.objectContaining({
        path: "theme.accent",
        received: 17,
        fallback: "blue",
      }),
      expect.objectContaining({
        path: "variants.stage",
        received: "free-layout",
        fallback: "bench",
      }),
    ]);
  });

  it("throws when strict config validation receives invalid tokens", () => {
    expect(() =>
      assertLearnLoopTemplateConfig({
        variants: {
          header: "agent-owned-header",
        },
      }),
    ).toThrow("Invalid Learn Loop template config");
  });

  it("exports the fixed section order and region ratios", () => {
    expect(LEARN_LOOP_TEMPLATE_SECTION_ORDER).toEqual([
      "header",
      "mission",
      "experiment",
      "toolTray",
      "feedback",
      "notebook",
    ]);

    const totalRatio = Object.values(LEARN_LOOP_TEMPLATE_REGION_RATIOS).reduce(
      (sum, ratio) => sum + ratio,
      0,
    );

    expect(totalRatio).toBeCloseTo(1);
  });
});
