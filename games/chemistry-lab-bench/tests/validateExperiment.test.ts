import { describe, expect, it } from "vitest";
import type { Experiment } from "../src/contracts/experiment";
import { validateExperiment } from "../src/domain/validateExperiment";
import { acidBaseExperiment } from "../src/content/acidBase";
import { metalAcidExperiment } from "../src/content/metalAcid";
import { saltSandExperiment } from "../src/content/saltSand";

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

  it("accepts the shipped salt+sand separation experiment", () => {
    const result = validateExperiment(saltSandExperiment);
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

  it("rejects an experiment that uses a still-reserved action type", () => {
    const broken = draft();
    const result = validateExperiment({
      ...broken,
      rules: [{ ...broken.rules[0], on: "stir" }],
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /unimplemented action/i.test(e))).toBe(
      true,
    );
  });

  it("rejects an experiment that uses a still-reserved transform kind", () => {
    const broken = draft();
    const result = validateExperiment({
      ...broken,
      rules: [
        {
          ...broken.rules[0],
          transform: { kind: "moveAll", to: "beaker" },
        },
      ],
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /unimplemented transform/i.test(e))).toBe(
      true,
    );
  });

  it("rejects a split transform routing to an undeclared station", () => {
    const broken = structuredClone(saltSandExperiment);
    const result = validateExperiment({
      ...broken,
      rules: broken.rules.map((r) =>
        r.transform.kind === "split"
          ? { ...r, transform: { ...r.transform, solidTo: "nowhere" } }
          : r,
      ),
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /nowhere/.test(e))).toBe(true);
  });

  it("rejects an evaporate transform that leaves an undeclared chemical", () => {
    const broken = structuredClone(saltSandExperiment);
    const result = validateExperiment({
      ...broken,
      rules: broken.rules.map((r) =>
        r.transform.kind === "evaporate"
          ? { ...r, transform: { ...r.transform, leaves: ["phantom-salt"] } }
          : r,
      ),
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /phantom-salt/.test(e))).toBe(true);
  });

  it("rejects a filter step whose source station is undeclared", () => {
    const broken = structuredClone(saltSandExperiment);
    const result = validateExperiment({
      ...broken,
      steps: broken.steps.map((s) =>
        s.expect.type === "filter"
          ? { ...s, expect: { ...s.expect, source: "ghost-vessel" } }
          : s,
      ),
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /ghost-vessel/.test(e))).toBe(true);
  });

  it("allows an empty shelf when no step asks for a pour", () => {
    const broken = structuredClone(saltSandExperiment);
    // Drop the pour step and its only shelf reagent; keep filter + heat.
    const result = validateExperiment({
      ...broken,
      shelf: [],
      steps: broken.steps.filter((s) => s.expect.type !== "pour"),
      rules: broken.rules.filter((r) => r.on !== "pour"),
    });
    expect(result.errors.some((e) => /shelf is empty/i.test(e))).toBe(false);
  });
});
