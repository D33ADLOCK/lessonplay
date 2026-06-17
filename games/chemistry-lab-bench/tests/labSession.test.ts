import { describe, expect, it } from "vitest";
import type { Experiment } from "../src/contracts/experiment";
import {
  createLabSession,
  currentStep,
  reduce,
  type LabSessionState,
} from "../src/domain/labSession";
import { acidBaseExperiment } from "../src/content/acidBase";
import { saltSandExperiment } from "../src/content/saltSand";

/** A minimal two-step experiment to exercise multi-step advancement. */
const twoStep: Experiment = {
  id: "two-step",
  title: "Two-step probe",
  concept: "test",
  grade: 9,
  chemicals: [
    { id: "a", label: "A", color: "#111", kind: "neutral" },
    { id: "b", label: "B", color: "#222", kind: "neutral" },
    { id: "ab", label: "AB", color: "#333", kind: "salt" },
    { id: "c", label: "C", color: "#444", kind: "neutral" },
    { id: "abc", label: "ABC", color: "#555", kind: "salt" },
  ],
  shelf: ["b", "c"],
  stations: {
    beaker: { contents: ["a"], color: "#111", heat: "room" },
  },
  rules: [
    {
      id: "make-ab",
      on: "pour",
      requires: ["a", "b"],
      transform: { kind: "react", consume: ["a", "b"], produce: ["ab"] },
      observation: "A and B combine.",
    },
    {
      id: "make-abc",
      on: "pour",
      requires: ["ab", "c"],
      transform: { kind: "react", consume: ["ab", "c"], produce: ["abc"] },
      observation: "AB and C combine.",
    },
  ],
  steps: [
    {
      id: "step-1",
      predictPrompt: "?",
      options: [
        { label: "right", correct: true, feedback: "" },
        { label: "wrong", correct: false, feedback: "" },
      ],
      actionPrompt: "pour b",
      expect: { type: "pour", reagent: "b", target: "beaker" },
      explanation: "B reacts with A.",
    },
    {
      id: "step-2",
      predictPrompt: "?",
      options: [
        { label: "right", correct: true, feedback: "" },
        { label: "wrong", correct: false, feedback: "" },
      ],
      actionPrompt: "pour c",
      expect: { type: "pour", reagent: "c", target: "beaker" },
      explanation: "C reacts with AB.",
    },
  ],
};

function pour(reagent: string) {
  return {
    type: "perform" as const,
    action: { type: "pour" as const, reagent, target: "beaker" },
  };
}
const next = { type: "advance-phase" as const };

describe("lab session reducer", () => {
  it("starts on the first step in the predict phase", () => {
    const state = createLabSession(twoStep);
    expect(state.stepIndex).toBe(0);
    expect(state.phase).toBe("predict");
    expect(currentStep(state)?.id).toBe("step-1");
  });

  it("records a prediction without blocking progress", () => {
    let state = createLabSession(twoStep);
    state = reduce(state, {
      type: "submit-prediction",
      option: twoStep.steps[0].options[1],
    });
    expect(state.prediction?.label).toBe("wrong");
    expect(state.phase).toBe("predict");
  });

  it("does not pour while still in the predict phase", () => {
    const state = createLabSession(twoStep);
    const after = reduce(state, pour("b"));
    expect(after.result).toBeNull();
    expect(after.phase).toBe("predict");
  });

  it("advances predict → observe → explain → next step", () => {
    let state = createLabSession(twoStep);

    state = reduce(state, next); // predict → observe
    expect(state.phase).toBe("observe");

    state = reduce(state, pour("b")); // a + b → ab
    expect(state.result?.visibleChange).toBe(true);
    expect(state.workspace.stations.beaker.contents).toContain("ab");

    state = reduce(state, next); // observe → explain (resolved)
    expect(state.phase).toBe("explain");

    state = reduce(state, next); // explain → next step
    expect(state.phase).toBe("predict");
    expect(state.stepIndex).toBe(1);
    expect(currentStep(state)?.id).toBe("step-2");
    expect(state.prediction).toBeNull();
    expect(state.result).toBeNull();
  });

  it("gives a nudge for a distractor pour and stays in observe", () => {
    let state = createLabSession(twoStep);
    state = reduce(state, next); // observe
    // Step 1 expects "b"; "c" cannot react with "a" yet → nudge.
    state = reduce(state, pour("c"));
    expect(state.result?.visibleChange).toBe(false);
    expect(state.phase).toBe("observe");
    // Cannot advance to explain until something visibly reacts.
    const blocked = reduce(state, next);
    expect(blocked.phase).toBe("observe");
  });

  it("carries the workspace forward so a later step reacts with earlier products", () => {
    let state = createLabSession(twoStep);
    state = reduce(state, next);
    state = reduce(state, pour("b")); // a + b → ab
    state = reduce(state, next);
    state = reduce(state, next); // step-2, predict
    state = reduce(state, next); // observe
    state = reduce(state, pour("c")); // ab + c → abc
    expect(state.workspace.stations.beaker.contents).toContain("abc");
  });

  it("reaches the complete phase after the final step", () => {
    let state: LabSessionState = createLabSession(twoStep);
    state = reduce(state, next);
    state = reduce(state, pour("b"));
    state = reduce(state, next);
    state = reduce(state, next); // step-2 predict
    state = reduce(state, next); // observe
    state = reduce(state, pour("c"));
    state = reduce(state, next); // explain
    state = reduce(state, next); // complete
    expect(state.phase).toBe("complete");
    expect(currentStep(state)).toBeNull();
  });

  it("runs the salt+sand separation across stations: pour → filter → heat", () => {
    let state = createLabSession(saltSandExperiment);

    // Step 1 — pour water into the mixture; salt dissolves (visible change).
    state = reduce(state, next); // observe
    state = reduce(state, {
      type: "perform",
      action: { type: "pour", reagent: "water", target: "mixture" },
    });
    expect(state.result?.visibleChange).toBe(true);
    expect(state.workspace.stations.mixture.contents).toContain("water");
    state = reduce(state, next); // explain
    state = reduce(state, next); // step 2 predict

    // Step 2 — filter the mixture; sand → residue, salt solution → filtrate.
    state = reduce(state, next); // observe
    state = reduce(state, {
      type: "perform",
      action: { type: "filter", source: "mixture" },
    });
    expect(state.result?.visibleChange).toBe(true);
    expect(state.workspace.stations.residue.contents).toEqual(["sand"]);
    expect(state.workspace.stations.filtrate.contents).toContain("salt");
    expect(state.workspace.stations.mixture.contents).toEqual([]);
    state = reduce(state, next); // explain
    state = reduce(state, next); // step 3 predict

    // Step 3 — heat the carried-forward filtrate; water leaves, salt remains.
    state = reduce(state, next); // observe
    state = reduce(state, {
      type: "perform",
      action: { type: "heat", target: "filtrate" },
    });
    expect(state.result?.emits?.map((e) => e.gas)).toEqual(["water-vapour"]);
    expect(state.workspace.stations.filtrate.contents).toEqual(["salt"]);
    expect(state.workspace.stations.filtrate.heat).toBe("hot");

    state = reduce(state, next); // explain
    state = reduce(state, next); // complete
    expect(state.phase).toBe("complete");
  });

  it("runs the real acid+base experiment end to end", () => {
    let state = createLabSession(acidBaseExperiment);
    state = reduce(state, next); // observe
    state = reduce(state, {
      type: "perform",
      action: { type: "pour", reagent: "sodium-hydroxide", target: "beaker" },
    });
    expect(state.result?.newColor).toBe("#e8508f");
    expect(state.workspace.stations.beaker.heat).toBe("warm");
    state = reduce(state, next); // explain
    expect(state.phase).toBe("explain");
  });
});
