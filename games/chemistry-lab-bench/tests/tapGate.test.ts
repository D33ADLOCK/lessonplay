import { describe, expect, it } from "vitest";
import { gateTap, hintTargetFor } from "../src/domain/tapGate";
import { saltSandExperiment } from "../src/content/saltSand";
import { acidBaseExperiment } from "../src/content/acidBase";

const [pourStep, filterStep, heatStep] = saltSandExperiment.steps;
const [neutraliseStep] = acidBaseExperiment.steps;

describe("gateTap", () => {
  it("runs the engine when the tapped action is the step's expected move", () => {
    expect(gateTap(pourStep, "pour")).toEqual({ kind: "perform" });
    expect(gateTap(filterStep, "filter")).toEqual({ kind: "perform" });
    expect(gateTap(heatStep, "heat")).toEqual({ kind: "perform" });
  });

  it("defers reagent judgement to the engine: any pour on a pour step performs", () => {
    // The distilled-water/copper distractor is judged by the engine, not gated
    // here — gating is keyed on action type only.
    expect(gateTap(neutraliseStep, "pour")).toEqual({ kind: "perform" });
  });

  it("nudges (never performs) when the tapped action is the wrong family", () => {
    const filterOnPour = gateTap(pourStep, "filter");
    expect(filterOnPour.kind).toBe("nudge");
    const heatOnPour = gateTap(pourStep, "heat");
    expect(heatOnPour.kind).toBe("nudge");
  });

  it("returns the step's authored nudge text for a wrong tool", () => {
    expect(gateTap(pourStep, "filter")).toEqual({
      kind: "nudge",
      text: pourStep.hints?.filter,
    });
    expect(gateTap(filterStep, "heat")).toEqual({
      kind: "nudge",
      text: filterStep.hints?.heat,
    });
  });

  it("gates the salt–sand filter step's off-family taps so the dry-sand desync cannot occur", () => {
    // The `filter` rule requires only [sand], present from step one — only the
    // gate stops a pour/heat step's filter tap from firing it prematurely.
    expect(gateTap(pourStep, "filter").kind).toBe("nudge");
    expect(gateTap(heatStep, "filter").kind).toBe("nudge");
  });

  it("falls back to a generic nudge when a step authored no hint for that action", () => {
    const bare = { ...pourStep, hints: undefined };
    const outcome = gateTap(bare, "filter");
    expect(outcome).toEqual({ kind: "nudge", text: expect.any(String) });
    expect((outcome as { text: string }).text.length).toBeGreaterThan(0);
  });
});

describe("hintTargetFor", () => {
  it("points at the expected reagent bottle for a pour step", () => {
    expect(hintTargetFor(pourStep)).toEqual({
      kind: "reagent",
      reagentId: "water",
    });
    expect(hintTargetFor(neutraliseStep)).toEqual({
      kind: "reagent",
      reagentId: "sodium-hydroxide",
    });
  });

  it("points at the Filter tile for a filter step", () => {
    expect(hintTargetFor(filterStep)).toEqual({ kind: "filter" });
  });

  it("points at the Heat tile for a heat step", () => {
    expect(hintTargetFor(heatStep)).toEqual({ kind: "heat" });
  });
});
