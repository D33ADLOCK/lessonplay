import { describe, expect, it } from "vitest";
import { validateExperimentMission } from "@learn-loop/core";
import { game } from "../src/content/game";

/**
 * The single committed gate for this game — the same gate the LearnPlay runtime
 * agent runs before it will publish. The authored content must be a valid,
 * winnable, non-cheatable experiment: `validateExperimentMission` runs the
 * structural validator and then the quality analyzer (winnable / not railed /
 * not brute-forceable per level), so this one assertion leans entirely on the
 * already-tested `@learn-loop/core` engine. Visual QA is manual.
 */
describe("Mystery Bottles: Acids, Bases and Salts content", () => {
  it("passes the structural + quality mission gate", () => {
    const result = validateExperimentMission(game);
    expect(result.errors).toEqual([]);
    expect(result.ok).toBe(true);
  });
});
