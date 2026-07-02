import { describe, expect, it } from "vitest";
import {
  effectEvidenceToken,
  sampleSignature,
  distinguishable,
} from "../src/engine/experimentSignature";
import { runExperimentStep } from "../src/engine/experimentRules";
import { solveExperiment } from "../src/engine/solveExperiment";
import { validateExperimentGame } from "../src/engine/validateExperimentGame";
import type {
  ExperimentDefinition,
  ExperimentGame,
  ExperimentLevel,
} from "../src/model/experimentLab";

/**
 * A minimal indicator bench where the *only* discriminating information is the
 * readout token: both an acid and a base turn the indicator, so their visual is
 * identically `color-change` — they differ solely in the recorded colour. This
 * is the case Slice 1 exists to serve: colour as first-class evidence.
 */
const indicatorBench: ExperimentDefinition = {
  samples: [
    {
      id: "acid",
      label: "Bottle 1",
      properties: { nature: "acid" },
      categoryId: "acidic",
    },
    {
      id: "base",
      label: "Bottle 2",
      properties: { nature: "base" },
      categoryId: "basic",
    },
  ],
  tools: [
    { id: "litmus", label: "Litmus" },
    { id: "phenolphthalein", label: "Phenolphthalein" },
  ],
  ruleSet: {
    rules: [
      {
        toolId: "litmus",
        when: { nature: "acid" },
        effect: {
          observationId: "litmus-acid",
          observation: "The strip turns a strong red.",
          visual: "color-change",
          readout: { kind: "color", value: "red" },
        },
      },
      {
        toolId: "litmus",
        when: { nature: "base" },
        effect: {
          observationId: "litmus-base",
          observation: "The strip turns a deep blue.",
          visual: "color-change",
          readout: { kind: "color", value: "blue" },
        },
      },
      {
        toolId: "phenolphthalein",
        when: { nature: "acid" },
        effect: {
          observationId: "phth-acid",
          observation: "It stays colourless.",
          visual: "color-change",
          readout: { kind: "color", value: "colourless" },
        },
      },
      {
        toolId: "phenolphthalein",
        when: { nature: "base" },
        effect: {
          observationId: "phth-base",
          observation: "It flushes bright pink.",
          visual: "color-change",
          readout: { kind: "color", value: "pink" },
        },
      },
    ],
    defaultEffect: {
      observationId: "none",
      observation: "Nothing happens.",
      visual: "none",
    },
  },
};

function bench(overrides: Partial<ExperimentDefinition> = {}): ExperimentDefinition {
  return { ...indicatorBench, ...overrides };
}

function level(overrides: Partial<ExperimentLevel> = {}): ExperimentLevel {
  return {
    id: "probe",
    title: "Probe",
    intro: "",
    sampleIds: ["acid", "base"],
    toolIds: ["litmus"],
    goal: { classifyIds: ["acid", "base"], categoryIds: ["acidic", "basic"] },
    scaffolding: "guided", // guided so brute-force/rail checks don't mask the point
    predictionRequired: false,
    hints: [],
    ...overrides,
  };
}

describe("effectEvidenceToken", () => {
  it("distinguishes same-visual effects by their readout value", () => {
    const red = effectEvidenceToken({
      observationId: "a",
      observation: "",
      visual: "color-change",
      readout: { kind: "color", value: "red" },
    });
    const blue = effectEvidenceToken({
      observationId: "b",
      observation: "",
      visual: "color-change",
      readout: { kind: "color", value: "blue" },
    });
    expect(red).not.toEqual(blue);
  });

  it("distinguishes same-visual gas effects by their gas label", () => {
    const h2 = effectEvidenceToken({
      observationId: "a",
      observation: "",
      visual: "gas",
      gasLabel: "H₂",
    });
    const co2 = effectEvidenceToken({
      observationId: "b",
      observation: "",
      visual: "gas",
      gasLabel: "CO₂",
    });
    expect(h2).not.toEqual(co2);
  });

  it("treats effects with the same visual and no detail as identical", () => {
    const a = effectEvidenceToken({ observationId: "a", observation: "", visual: "none" });
    const b = effectEvidenceToken({ observationId: "b", observation: "", visual: "none" });
    expect(a).toEqual(b);
  });
});

describe("sampleSignature + distinguishable", () => {
  it("tells an acid and a base apart on colour alone (same visual)", () => {
    const acid = indicatorBench.samples[0];
    const base = indicatorBench.samples[1];
    const sigA = sampleSignature(acid, ["litmus"], indicatorBench.ruleSet);
    const sigB = sampleSignature(base, ["litmus"], indicatorBench.ruleSet);
    // Same visual (both color-change) — only the readout separates them.
    expect(runExperimentStep(acid.properties, "litmus", indicatorBench.ruleSet).effect.visual).toBe(
      "color-change",
    );
    expect(distinguishable(sigA, sigB, ["litmus"])).toBe(true);
  });
});

describe("solveExperiment with readout evidence", () => {
  it("finds a colour-only indicator level winnable", () => {
    const analysis = solveExperiment(indicatorBench, level());
    expect(analysis.winnable).toBe(true);
    expect(analysis.indistinguishablePairs).toEqual([]);
    expect(analysis.errors).toEqual([]);
  });

  it("flags samples indistinguishable when they share visual AND readout", () => {
    const flat = bench({
      samples: [
        { id: "a", label: "A", properties: { nature: "x" }, categoryId: "acidic" },
        { id: "b", label: "B", properties: { nature: "y" }, categoryId: "basic" },
      ],
      ruleSet: {
        rules: [
          {
            toolId: "litmus",
            when: { nature: "x" },
            effect: {
              observationId: "x",
              observation: "Turns red.",
              visual: "color-change",
              readout: { kind: "color", value: "red" },
            },
          },
          {
            toolId: "litmus",
            when: { nature: "y" },
            effect: {
              observationId: "y",
              observation: "Turns red.",
              visual: "color-change",
              readout: { kind: "color", value: "red" }, // identical clue
            },
          },
        ],
        defaultEffect: { observationId: "n", observation: "", visual: "none" },
      },
    });
    const analysis = solveExperiment(
      flat,
      level({ sampleIds: ["a", "b"], goal: { classifyIds: ["a", "b"], categoryIds: ["acidic", "basic"] } }),
    );
    expect(analysis.winnable).toBe(false);
    expect(analysis.indistinguishablePairs).toContainEqual(["a", "b"]);
  });
});

describe("validateExperimentGame — readout + new visuals", () => {
  const game = (def: ExperimentDefinition): ExperimentGame => ({
    id: "g",
    title: "G",
    definition: def,
    categories: [
      { id: "acidic", label: "Acidic" },
      { id: "basic", label: "Basic" },
    ],
    levels: [level()],
  });

  it("accepts a game that uses readout tokens", () => {
    expect(validateExperimentGame(game(indicatorBench)).ok).toBe(true);
  });

  it("rejects an unknown readout kind", () => {
    const bad = bench({
      ruleSet: {
        ...indicatorBench.ruleSet,
        rules: [
          {
            toolId: "litmus",
            when: { nature: "acid" },
            effect: {
              observationId: "x",
              observation: "Turns red.",
              visual: "color-change",
              // deliberately invalid kind for a runtime-authored game
              readout: { kind: "colour" as never, value: "red" },
            },
          },
          ...indicatorBench.ruleSet.rules.slice(1),
        ],
      },
    });
    const result = validateExperimentGame(game(bad));
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("unknown readout kind"))).toBe(true);
  });

  it("rejects a readout with an empty value", () => {
    const bad = bench({
      ruleSet: {
        ...indicatorBench.ruleSet,
        rules: [
          {
            toolId: "litmus",
            when: { nature: "acid" },
            effect: {
              observationId: "x",
              observation: "Turns red.",
              visual: "color-change",
              readout: { kind: "color", value: "  " },
            },
          },
          ...indicatorBench.ruleSet.rules.slice(1),
        ],
      },
    });
    const result = validateExperimentGame(game(bad));
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("empty value"))).toBe(true);
  });

  it("rejects a gas label on a non-gas visual", () => {
    const bad = bench({
      ruleSet: {
        ...indicatorBench.ruleSet,
        rules: [
          {
            toolId: "litmus",
            when: { nature: "acid" },
            effect: {
              observationId: "x",
              observation: "Turns red.",
              visual: "color-change",
              gasLabel: "H₂",
            },
          },
          ...indicatorBench.ruleSet.rules.slice(1),
        ],
      },
    });
    const result = validateExperimentGame(game(bad));
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("gasLabel"))).toBe(true);
  });

  it("rejects an unknown visual", () => {
    const bad = bench({
      ruleSet: {
        ...indicatorBench.ruleSet,
        defaultEffect: {
          observationId: "n",
          observation: "",
          visual: "sparkle" as never,
        },
      },
    });
    const result = validateExperimentGame(game(bad));
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("unknown visual"))).toBe(true);
  });
});

describe("runExperimentStep — readout passthrough", () => {
  it("carries the readout and threads setState with a readout payload", () => {
    const def = bench({
      ruleSet: {
        rules: [
          {
            toolId: "litmus",
            when: { nature: "acid" },
            effect: {
              observationId: "x",
              observation: "Turns red.",
              visual: "color-change",
              readout: { kind: "color", value: "red" },
              setState: { tested: "yes" },
            },
          },
        ],
        defaultEffect: { observationId: "n", observation: "", visual: "none" },
      },
    });
    const result = runExperimentStep({ nature: "acid" }, "litmus", def.ruleSet);
    expect(result.effect.readout).toEqual({ kind: "color", value: "red" });
    expect(result.nextState).toEqual({ nature: "acid", tested: "yes" });
  });
});
