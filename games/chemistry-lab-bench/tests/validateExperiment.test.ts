import { describe, expect, it } from "vitest";
import type { Experiment } from "../src/contracts/experiment";
import { validateExperiment } from "../src/domain/validateExperiment";
import { acidBaseExperiment } from "../src/content/acidBase";

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

  it("rejects an empty reagent shelf", () => {
    const result = validateExperiment({ ...draft(), shelf: [] });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /shelf is empty/i.test(e))).toBe(true);
  });

  it("rejects a prediction without exactly one correct option", () => {
    const broken = draft();
    const result = validateExperiment({
      ...broken,
      task: {
        ...broken.task,
        options: broken.task.options.map((o) => ({ ...o, correct: true })),
      },
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /exactly one correct/i.test(e))).toBe(
      true,
    );
  });
});
