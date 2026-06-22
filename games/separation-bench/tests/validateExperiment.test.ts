import { describe, expect, it } from "vitest";
import { validateScenario, type Scenario } from "@learn-loop/core";
import { acidBaseScenario } from "../src/content/acidBase";
import { metalAcidScenario } from "../src/content/metalAcid";
import { saltSandScenario } from "../src/content/saltSand";

/** Clone the shipped scenario so each test can mutate freely. */
function draft(): Scenario {
  return structuredClone(acidBaseScenario);
}

describe("validateScenario", () => {
  it("accepts the shipped acid+base scenario", () => {
    const result = validateScenario(acidBaseScenario);
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("accepts the shipped metal+acid scenario", () => {
    const result = validateScenario(metalAcidScenario);
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("accepts the shipped salt+sand separation scenario", () => {
    const result = validateScenario(saltSandScenario);
    expect(result.ok).toBe(true);
    expect(result.errors).toEqual([]);
  });

  it("rejects a scenario missing required fields", () => {
    const broken = { ...draft(), id: "", title: "" };
    const result = validateScenario(broken);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /id/i.test(e))).toBe(true);
    expect(result.errors.some((e) => /title/i.test(e))).toBe(true);
  });

  it("rejects a shelf entity that is not known", () => {
    const broken = draft();
    const result = validateScenario({
      ...broken,
      shelf: [...broken.shelf, "mystery-goo"],
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /mystery-goo/.test(e))).toBe(true);
  });

  it("rejects a station holding an undeclared entity", () => {
    const broken = draft();
    const result = validateScenario({
      ...broken,
      stations: {
        beaker: { ...broken.stations.beaker, contents: ["ghost-reagent"] },
      },
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /ghost-reagent/.test(e))).toBe(true);
  });

  it("rejects a rule that produces or emits an undeclared entity", () => {
    const broken = draft();
    const rule = broken.rules[0];
    const result = validateScenario({
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
    const result = validateScenario({ ...draft(), shelf: [] });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /shelf/i.test(e))).toBe(true);
  });

  it("rejects a step without exactly one correct option", () => {
    const broken = draft();
    const step = broken.steps[0];
    const result = validateScenario({
      ...broken,
      steps: [
        { ...step, options: step.options.map((o) => ({ ...o, correct: true })) },
      ],
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /exactly one correct/i.test(e))).toBe(true);
  });

  it("rejects a scenario that uses a still-reserved action type", () => {
    const broken = draft();
    const result = validateScenario({
      ...broken,
      rules: [{ ...broken.rules[0], on: "stir" }],
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /unimplemented action/i.test(e))).toBe(
      true,
    );
  });

  it("rejects a scenario that uses a still-reserved transform kind", () => {
    const broken = draft();
    const result = validateScenario({
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
    const broken = structuredClone(saltSandScenario);
    const result = validateScenario({
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
    const broken = structuredClone(saltSandScenario);
    const result = validateScenario({
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
    const broken = structuredClone(saltSandScenario);
    const result = validateScenario({
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
    const broken = structuredClone(saltSandScenario);
    // Drop the pour step and its only shelf reagent; keep filter + heat.
    const result = validateScenario({
      ...broken,
      shelf: [],
      steps: broken.steps.filter((s) => s.expect.type !== "pour"),
      rules: broken.rules.filter((r) => r.on !== "pour"),
    });
    expect(result.errors.some((e) => /shelf/i.test(e))).toBe(false);
  });
});
