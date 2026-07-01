import { describe, expect, it } from "vitest";
import {
  analyzeExperimentGame,
  solveExperiment,
} from "../src/engine/solveExperiment";
import type { ExperimentLevel } from "../src/model/experimentLab";
import { particleGame } from "./fixtures/experimentParticles";

const { definition, levels } = particleGame;

function levelById(id: string): ExperimentLevel {
  const found = levels.find((l) => l.id === id);
  if (!found) throw new Error(`No fixture level "${id}"`);
  return found;
}

/** A bench level over the shared physics, with sensible defaults. */
function makeLevel(overrides: Partial<ExperimentLevel>): ExperimentLevel {
  return {
    id: "probe",
    title: "Probe",
    intro: "",
    sampleIds: ["unknown-a", "unknown-b", "unknown-c"],
    toolIds: ["light", "settle", "filter"],
    goal: {
      classifyIds: ["unknown-a", "unknown-b", "unknown-c"],
      categoryIds: ["solution", "suspension", "colloid"],
    },
    scaffolding: "open",
    predictionRequired: false,
    hints: [],
    ...overrides,
  };
}

describe("solveExperiment — a genuine experiment", () => {
  it("accepts the open three-unknown case as winnable and clean", () => {
    const analysis = solveExperiment(definition, levelById("open-case"));
    expect(analysis.winnable).toBe(true);
    expect(analysis.bruteForceable).toBe(false);
    expect(analysis.railed).toBe(false);
    expect(analysis.indistinguishablePairs).toEqual([]);
    expect(analysis.errors).toEqual([]);
  });

  it("reports that more than one tool is needed (a real combine-causes level)", () => {
    const analysis = solveExperiment(definition, levelById("open-case"));
    expect(analysis.toolsNeeded).toBe(2);
  });

  it("does not flag an intentionally simple tutorial as brute-forceable or railed", () => {
    const analysis = solveExperiment(definition, levelById("learn-the-light"));
    expect(analysis.winnable).toBe(true);
    expect(analysis.bruteForceable).toBe(false);
    expect(analysis.railed).toBe(false);
    expect(analysis.errors).toEqual([]);
  });
});

describe("solveExperiment — rejecting fake experiments", () => {
  it("flags a level a single tool fully separates as railed", () => {
    const analysis = solveExperiment(
      definition,
      makeLevel({
        sampleIds: ["unknown-a", "unknown-b"],
        toolIds: ["light", "settle"],
        goal: {
          classifyIds: ["unknown-a", "unknown-b"],
          categoryIds: ["solution", "suspension"],
        },
      }),
    );
    // Light alone splits the clear solution from the cloudy suspension.
    expect(analysis.railed).toBe(true);
    expect(analysis.toolsNeeded).toBe(1);
    expect(analysis.errors.some((e) => e.includes("railed"))).toBe(true);
  });

  it("flags a single-sample goal as brute-forceable", () => {
    const analysis = solveExperiment(
      definition,
      makeLevel({
        goal: {
          classifyIds: ["unknown-b"],
          categoryIds: ["solution", "suspension", "colloid"],
        },
      }),
    );
    expect(analysis.bruteForceable).toBe(true);
    expect(analysis.errors.some((e) => e.includes("brute-forceable"))).toBe(true);
  });

  it("flags indistinguishable different-category samples as unwinnable", () => {
    const analysis = solveExperiment(
      definition,
      makeLevel({
        sampleIds: ["control", "unknown-a"],
        goal: {
          classifyIds: ["control", "unknown-a"],
          categoryIds: ["control", "solution"],
        },
      }),
    );
    // A control and a (dissolved) solution are both `tiny`: optically identical.
    expect(analysis.winnable).toBe(false);
    expect(analysis.indistinguishablePairs).toContainEqual([
      "control",
      "unknown-a",
    ]);
    expect(analysis.toolsNeeded).toBe(Number.POSITIVE_INFINITY);
  });

  it("flags a category that is not offered as a choice", () => {
    const analysis = solveExperiment(
      definition,
      makeLevel({ goal: { classifyIds: ["unknown-c"], categoryIds: ["solution"] } }),
    );
    expect(analysis.winnable).toBe(false);
    expect(analysis.errors.some((e) => e.includes("not offered"))).toBe(true);
  });
});

describe("analyzeExperimentGame", () => {
  it("passes the whole reference game", () => {
    expect(analyzeExperimentGame(particleGame)).toEqual({ ok: true, errors: [] });
  });

  it("fails a game that contains a defective level", () => {
    const broken = {
      definition,
      levels: [makeLevel({ id: "bad", goal: { classifyIds: ["unknown-b"], categoryIds: ["suspension"] } })],
    };
    const result = analyzeExperimentGame(broken);
    expect(result.ok).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
