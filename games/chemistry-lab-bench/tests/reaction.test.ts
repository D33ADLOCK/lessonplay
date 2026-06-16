import { describe, expect, it } from "vitest";
import type { ReactionRule } from "../src/contracts/experiment";
import type { Vessel } from "../src/contracts/chemistry";
import { simulateReaction } from "../src/domain/reaction";
import { acidBaseExperiment } from "../src/content/acidBase";

const { beaker, rules } = acidBaseExperiment;

describe("simulateReaction", () => {
  it("turns the indicator pink and warms up when the base is poured", () => {
    const result = simulateReaction(
      beaker,
      { type: "pour", reagent: "sodium-hydroxide" },
      rules,
    );
    expect(result.visibleChange).toBe(true);
    expect(result.newColor).toBe("#e8508f");
    expect(result.temperature).toBe("rising");
  });

  it("nudges with no visible change when the distractor is poured", () => {
    const result = simulateReaction(
      beaker,
      { type: "pour", reagent: "distilled-water" },
      rules,
    );
    expect(result.visibleChange).toBe(false);
    expect(result.newColor).toBeUndefined();
    expect(result.observation).toMatch(/no visible change/i);
  });

  it("reports the empty-vessel observation for an empty beaker", () => {
    const empty: Vessel = { contents: [] };
    const result = simulateReaction(
      empty,
      { type: "pour", reagent: "phenolphthalein" },
      [],
    );
    expect(result.visibleChange).toBe(false);
    expect(result.observation).toMatch(/empty/i);
  });

  it("returns the first matching rule (first-match-wins)", () => {
    const orderedRules: ReactionRule[] = [
      {
        id: "first",
        requires: ["a"],
        produce: { observation: "first", visibleChange: true },
      },
      {
        id: "second",
        requires: ["a"],
        produce: { observation: "second", visibleChange: true },
      },
    ];
    const result = simulateReaction(
      { contents: ["a"] },
      { type: "pour", reagent: "a" },
      orderedRules,
    );
    expect(result.observation).toBe("first");
  });
});
