import { describe, expect, it } from "vitest";
import type { Scenario } from "../src/model/scenario";
import { validateScenario } from "../src/engine/validateScenario";
import { acidBaseScenario } from "./fixtures/acidBase";
import { metalAcidScenario } from "./fixtures/metalAcid";
import { saltSandScenario } from "./fixtures/saltSand";
import { distillationScenario } from "./fixtures/distillation";
import { crystallizationScenario } from "./fixtures/crystallization";

/** Clone a shipped scenario so each test can mutate freely. */
function draft(): Scenario {
  return structuredClone(acidBaseScenario);
}

describe("validateScenario", () => {
  it("accepts the acid+base scenario", () => {
    expect(validateScenario(acidBaseScenario)).toEqual({ ok: true, errors: [] });
  });

  it("accepts the metal+acid scenario", () => {
    expect(validateScenario(metalAcidScenario)).toEqual({ ok: true, errors: [] });
  });

  it("accepts the salt+sand separation scenario", () => {
    expect(validateScenario(saltSandScenario)).toEqual({ ok: true, errors: [] });
  });

  it("accepts the distillation scenario (uses the implemented distil transform)", () => {
    expect(validateScenario(distillationScenario)).toEqual({
      ok: true,
      errors: [],
    });
  });

  it("accepts the crystallisation scenario", () => {
    expect(validateScenario(crystallizationScenario)).toEqual({
      ok: true,
      errors: [],
    });
  });

  it("rejects a scenario missing required fields", () => {
    const broken = { ...draft(), id: "", title: "" };
    const result = validateScenario(broken);
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /id/i.test(e))).toBe(true);
    expect(result.errors.some((e) => /title/i.test(e))).toBe(true);
  });

  it("rejects a shelf reagent that is not a known entity", () => {
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

  it("rejects an empty reagent shelf when a step pours", () => {
    const result = validateScenario({ ...draft(), shelf: [] });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /shelf is empty/i.test(e))).toBe(true);
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
    expect(result.errors.some((e) => /unimplemented action/i.test(e))).toBe(true);
  });

  it("rejects a scenario that uses a still-reserved transform kind", () => {
    const broken = draft();
    const result = validateScenario({
      ...broken,
      rules: [
        { ...broken.rules[0], transform: { kind: "moveAll", to: "beaker" } },
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

  it("rejects an evaporate transform that leaves an undeclared entity", () => {
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

  it("rejects a distil transform that collects into an undeclared station", () => {
    const broken = structuredClone(distillationScenario);
    const result = validateScenario({
      ...broken,
      rules: broken.rules.map((r) =>
        r.transform.kind === "distil"
          ? { ...r, transform: { ...r.transform, collectTo: "ghost-jar" } }
          : r,
      ),
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /ghost-jar/.test(e))).toBe(true);
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
    // The distillation scenario is heat-only with an empty shelf — valid.
    expect(validateScenario(distillationScenario).errors.some((e) =>
      /shelf is empty/i.test(e),
    )).toBe(false);
  });
});
