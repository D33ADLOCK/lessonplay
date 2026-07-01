import { describe, expect, it } from "vitest";
import {
  validateExperimentGame,
  validateExperimentMission,
} from "../src/engine/validateExperimentGame";
import type {
  ExperimentGame,
  ExperimentRule,
} from "../src/model/experimentLab";
import { particleGame } from "./fixtures/experimentParticles";

/** Clone the reference game so each test can corrupt one thing in isolation. */
function clone(): ExperimentGame {
  return structuredClone(particleGame);
}

describe("validateExperimentGame — accepts the reference", () => {
  it("passes the hand-crafted gold-standard game", () => {
    expect(validateExperimentGame(particleGame)).toEqual({ ok: true, errors: [] });
  });
});

describe("validateExperimentGame — referential integrity", () => {
  it("rejects a rule that references an unknown tool", () => {
    const game = clone();
    const rogue: ExperimentRule = {
      toolId: "zap",
      when: {},
      effect: { observationId: "zap-x", observation: "A spark.", visual: "none" },
    };
    const result = validateExperimentGame({
      ...game,
      definition: {
        ...game.definition,
        ruleSet: {
          ...game.definition.ruleSet,
          rules: [...game.definition.ruleSet.rules, rogue],
        },
      },
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('unknown tool "zap"'))).toBe(true);
  });

  it("rejects an inert tool offered in a level (no rule ever fires)", () => {
    const game = clone();
    const result = validateExperimentGame({
      ...game,
      definition: {
        ...game.definition,
        tools: [...game.definition.tools, { id: "stir", label: "Stir" }],
      },
      levels: game.levels.map((level, i) =>
        i === 0 ? { ...level, toolIds: [...level.toolIds, "stir"] } : level,
      ),
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("inert"))).toBe(true);
  });

  it("rejects reusing one observation id for two different observations", () => {
    const game = clone();
    const dup: ExperimentRule = {
      toolId: "filter",
      when: { particleSize: "gigantic" },
      effect: {
        observationId: "light-no-beam",
        observation: "A totally different thing happens.",
        visual: "none",
      },
    };
    const result = validateExperimentGame({
      ...game,
      definition: {
        ...game.definition,
        ruleSet: {
          ...game.definition.ruleSet,
          rules: [...game.definition.ruleSet.rules, dup],
        },
      },
    });
    expect(result.ok).toBe(false);
    expect(
      result.errors.some((e) => e.includes("must be stable")),
    ).toBe(true);
  });

  it("rejects a level that references an unknown sample", () => {
    const game = clone();
    const result = validateExperimentGame({
      ...game,
      levels: game.levels.map((level, i) =>
        i === 0 ? { ...level, sampleIds: [...level.sampleIds, "ghost"] } : level,
      ),
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes('unknown sample "ghost"'))).toBe(
      true,
    );
  });
});

describe("validateExperimentGame — discovery before naming", () => {
  it("rejects observation text that names the concept", () => {
    const game = clone();
    const rules = game.definition.ruleSet.rules.map((rule) =>
      rule.effect.observationId === "light-beam-clean"
        ? {
            ...rule,
            effect: {
              ...rule.effect,
              observation: "A beam glows; this is a colloid.",
            },
          }
        : rule,
    );
    const result = validateExperimentGame({
      ...game,
      definition: { ...game.definition, ruleSet: { ...game.definition.ruleSet, rules } },
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("names the concept"))).toBe(true);
  });
});

describe("validateExperimentMission — structural then quality", () => {
  it("passes the reference game end to end", () => {
    expect(validateExperimentMission(particleGame)).toEqual({
      ok: true,
      errors: [],
    });
  });

  it("fails a structurally valid game whose level cannot be reasoned out", () => {
    const game = clone();
    const result = validateExperimentMission({
      ...game,
      levels: [
        {
          id: "impossible",
          title: "Impossible",
          intro: "",
          sampleIds: ["control", "unknown-a"],
          toolIds: ["light", "settle", "filter"],
          goal: {
            classifyIds: ["control", "unknown-a"],
            categoryIds: ["control", "solution"],
          },
          scaffolding: "open",
          predictionRequired: false,
          hints: [],
        },
      ],
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => e.includes("indistinguishable"))).toBe(true);
  });
});
