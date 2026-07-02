import { describe, expect, it } from "vitest";
import {
  validateExperimentGame,
  validateExperimentMission,
} from "../src/engine/validateExperimentGame";
import { solveExperiment } from "../src/engine/solveExperiment";
import { acidsBasesSaltsGame } from "./fixtures/experimentAcidsBasesSalts";

/**
 * The worked-example acceptance gate (PRD issue #89): the "Acids, Bases and
 * Salts" chapter game must pass the full build-time gate — structural
 * validation plus per-level analysis — with zero errors, proving the expanded
 * template covers a real chapter's identity activities end to end.
 */
describe("Acids, Bases and Salts worked example", () => {
  it("passes structural validation", () => {
    expect(validateExperimentGame(acidsBasesSaltsGame)).toEqual({
      ok: true,
      errors: [],
    });
  });

  it("passes the full mission gate (structural + analysis)", () => {
    expect(validateExperimentMission(acidsBasesSaltsGame)).toEqual({
      ok: true,
      errors: [],
    });
  });

  it("is a genuine combine-causes bench: the open level needs more than one tool", () => {
    const open = acidsBasesSaltsGame.levels.find((l) => l.id === "open-bench")!;
    const analysis = solveExperiment(acidsBasesSaltsGame.definition, open);
    expect(analysis.winnable).toBe(true);
    expect(analysis.railed).toBe(false);
    expect(analysis.bruteForceable).toBe(false);
    // Salt vs sugar are only split by conductivity; no single tool separates all
    // four categories.
    expect(analysis.toolsNeeded).toBeGreaterThan(1);
  });
});
