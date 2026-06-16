import { describe, expect, it } from "vitest";
import type { Experiment } from "../src/contracts/experiment";
import { validateExperiment } from "../src/domain/validateExperiment";
import { acidBaseExperiment } from "../src/content/acidBase";
import { metalAcidExperiment } from "../src/content/metalAcid";

/** Clone the shipped experiment so each test can mutate freely. */
function draft(): Experiment {
  return structuredClone(acidBaseExperiment);
}

describe("validateExperiment", () => {
  it("accepts the shipped acid+base experiment", () => {
    const result = validateExperiment(acidBaseExperiment);
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("accepts the shipped metal+acid experiment", () => {
    const result = validateExperiment(metalAcidExperiment);
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects an experiment missing required fields", () => {
    const broken = { ...draft(), id: "", title: "" };
    const result = validateExperiment(broken);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /id/i.test(e))).toBe(true);
    expect(result.errors.some((e) => /title/i.test(e))).toBe(true);
  });

  it("rejects a shelf reagent that is not a known chemical", () => {
    const broken = draft();
    const result = validateExperiment({
      ...broken,
      shelf: [...broken.shelf, "mystery-goo"],
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /mystery-goo/.test(e))).toBe(true);
  });

  it("rejects a station holding an undeclared chemical", () => {
    const broken = draft();
    const result = validateExperiment({
      ...broken,
      stations: {
        beaker: { ...broken.stations.beaker, contents: ["ghost-reagent"] },
      },
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /ghost-reagent/.test(e))).toBe(true);
  });

  it("rejects a rule that produces or emits an undeclared chemical", () => {
    const broken = draft();
    const rule = broken.rules[0];
    const result = validateExperiment({
      ...broken,
      rules: [
        {
          ...rule,
          transform: {
            kind: "react",
            consume: ["dilute-acid"],
            produce: ["mystery-salt"],
            emits: ["mystery-gas"],
          },
        },
      ],
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /mystery-salt/.test(e))).toBe(true);
    expect(result.errors.some((e) => /mystery-gas/.test(e))).toBe(true);
  });

  it("rejects an empty reagent shelf", () => {
    const result = validateExperiment({ ...draft(), shelf: [] });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /shelf is empty/i.test(e))).toBe(true);
  });

  it("rejects a step without exactly one correct option", () => {
    const broken = draft();
    const step = broken.steps[0];
    const result = validateExperiment({
      ...broken,
      steps: [
        { ...step, options: step.options.map((o) => ({ ...o, correct: true })) },
      ],
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /exactly one correct/i.test(e))).toBe(true);
  });

  it("rejects an experiment that uses a reserved, unimplemented action type", () => {
    const broken = draft();
    const result = validateExperiment({
      ...broken,
      rules: [{ ...broken.rules[0], on: "filter" }],
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /unimplemented action/i.test(e))).toBe(
      true,
    );
  });

  it("rejects an experiment that uses a reserved, unimplemented transform kind", () => {
    const broken = draft();
    const result = validateExperiment({
      ...broken,
      rules: [
        {
          ...broken.rules[0],
          transform: { kind: "evaporate", leaves: ["water"] },
        },
      ],
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /unimplemented transform/i.test(e))).toBe(
      true,
    );
  });
});
