import { describe, expect, it } from "vitest";
import {
  experimentGoalKind,
  isClassifyGoal,
  isPredictOutcomeGoal,
  isReachTargetStateGoal,
  type ExperimentGame,
  type ExperimentLevel,
} from "../src/model/experimentLab";
import { solveExperiment } from "../src/engine/solveExperiment";
import { validateExperimentMission } from "../src/engine/validateExperimentGame";
import {
  createExperimentSession,
  reduceExperimentSession,
  type ExperimentSessionEvent,
  type ExperimentSessionState,
} from "../src/engine/experimentSession";
import {
  transformBench,
  transformCategories,
} from "./fixtures/experimentTransform";

function run(
  state: ExperimentSessionState,
  ...events: ExperimentSessionEvent[]
): ExperimentSessionState {
  return events.reduce(reduceExperimentSession, state);
}

/** A one-level game over the transform bench with the given level. */
function gameWith(level: ExperimentLevel): ExperimentGame {
  return {
    id: "transform-test",
    title: "Transform test",
    definition: transformBench,
    categories: transformCategories,
    levels: [level],
  };
}

const baseLevel = {
  id: "lvl",
  title: "Level",
  intro: "",
  scaffolding: "open" as const,
  predictionRequired: false,
  hints: [],
};

// ---------------------------------------------------------------------------
// Model guards
// ---------------------------------------------------------------------------

describe("goal guards", () => {
  it("treats a goal with no kind as classify (back-compat)", () => {
    const goal = { classifyIds: ["acid-x"], categoryIds: ["acid"] };
    expect(experimentGoalKind(goal)).toBe("classify");
    expect(isClassifyGoal(goal)).toBe(true);
    expect(isPredictOutcomeGoal(goal)).toBe(false);
  });

  it("narrows predict-outcome and reach-target-state by their discriminant", () => {
    const predict = {
      kind: "predict-outcome" as const,
      prompts: [{ sampleId: "acid-x", toolId: "zinc" }],
    };
    const reach = {
      kind: "reach-target-state" as const,
      sampleId: "acid-x",
      target: { nature: "neutral" },
      targetLabel: "Make it neutral",
    };
    expect(experimentGoalKind(predict)).toBe("predict-outcome");
    expect(isPredictOutcomeGoal(predict)).toBe(true);
    expect(isReachTargetStateGoal(reach)).toBe(true);
    expect(isClassifyGoal(reach)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Analyzer — predict-outcome
// ---------------------------------------------------------------------------

describe("solveExperiment — predict-outcome", () => {
  it("accepts prompts whose correct answers differ (gas on acid vs nothing on neutral)", () => {
    const level: ExperimentLevel = {
      ...baseLevel,
      sampleIds: ["acid-x", "neutral-z"],
      toolIds: ["zinc"],
      goal: {
        kind: "predict-outcome",
        prompts: [
          { sampleId: "acid-x", toolId: "zinc" },
          { sampleId: "neutral-z", toolId: "zinc" },
        ],
      },
    };
    const analysis = solveExperiment(transformBench, level);
    expect(analysis.goalKind).toBe("predict-outcome");
    expect(analysis.winnable).toBe(true);
    expect(analysis.errors).toEqual([]);
  });

  it("flags a level as guessable when every prompt has the same answer", () => {
    const level: ExperimentLevel = {
      ...baseLevel,
      sampleIds: ["base-y", "neutral-z"],
      toolIds: ["zinc"],
      goal: {
        kind: "predict-outcome",
        prompts: [
          { sampleId: "base-y", toolId: "zinc" }, // nothing
          { sampleId: "neutral-z", toolId: "zinc" }, // nothing
        ],
      },
    };
    const analysis = solveExperiment(transformBench, level);
    expect(analysis.winnable).toBe(false);
    expect(analysis.bruteForceable).toBe(true);
    expect(analysis.errors.join(" ")).toContain("guessable");
  });

  it("does not flag a single-prompt guided tutorial", () => {
    const level: ExperimentLevel = {
      ...baseLevel,
      scaffolding: "guided",
      sampleIds: ["acid-x"],
      toolIds: ["zinc"],
      goal: {
        kind: "predict-outcome",
        prompts: [{ sampleId: "acid-x", toolId: "zinc" }],
      },
    };
    expect(solveExperiment(transformBench, level).errors).toEqual([]);
  });

  it("names a prompt that references a tool not offered in the level", () => {
    const level: ExperimentLevel = {
      ...baseLevel,
      sampleIds: ["acid-x", "neutral-z"],
      toolIds: ["zinc"],
      goal: {
        kind: "predict-outcome",
        prompts: [
          { sampleId: "acid-x", toolId: "add-base" }, // not offered
          { sampleId: "neutral-z", toolId: "zinc" },
        ],
      },
    };
    expect(solveExperiment(transformBench, level).errors.join(" ")).toContain(
      "not offered",
    );
  });
});

// ---------------------------------------------------------------------------
// Analyzer — reach-target-state
// ---------------------------------------------------------------------------

describe("solveExperiment — reach-target-state", () => {
  const reachLevel = (toolIds: string[], target: Record<string, string>): ExperimentLevel => ({
    ...baseLevel,
    sampleIds: ["acid-x"],
    toolIds,
    goal: {
      kind: "reach-target-state",
      sampleId: "acid-x",
      target,
      targetLabel: "Make it neutral",
    },
  });

  it("accepts a target reachable in one action and not already satisfied", () => {
    const analysis = solveExperiment(
      transformBench,
      reachLevel(["litmus", "add-base", "zinc"], { nature: "neutral" }),
    );
    expect(analysis.goalKind).toBe("reach-target-state");
    expect(analysis.winnable).toBe(true);
    expect(analysis.toolsNeeded).toBe(1);
    expect(analysis.errors).toEqual([]);
  });

  it("flags a target that no offered tool can reach", () => {
    const analysis = solveExperiment(
      transformBench,
      reachLevel(["litmus", "zinc"], { nature: "neutral" }),
    );
    expect(analysis.winnable).toBe(false);
    expect(analysis.toolsNeeded).toBe(Number.POSITIVE_INFINITY);
    expect(analysis.errors.join(" ")).toContain("cannot be reached");
  });

  it("flags a target already satisfied at the start as trivial", () => {
    const analysis = solveExperiment(
      transformBench,
      reachLevel(["litmus", "add-base"], { nature: "acid" }),
    );
    expect(analysis.winnable).toBe(false);
    expect(analysis.errors.join(" ")).toContain("already satisfied");
    // The message steers the author toward the fix (a history marker) rather
    // than only naming the defect — so a weaker agent can self-correct.
    expect(analysis.errors.join(" ")).toContain("history marker");
  });
});

// ---------------------------------------------------------------------------
// Structural validator — new variants through the full mission gate
// ---------------------------------------------------------------------------

describe("validateExperimentMission — new goal variants", () => {
  it("passes a well-formed predict-outcome game", () => {
    const game = gameWith({
      ...baseLevel,
      sampleIds: ["acid-x", "neutral-z"],
      toolIds: ["zinc"],
      goal: {
        kind: "predict-outcome",
        prompts: [
          { sampleId: "acid-x", toolId: "zinc" },
          { sampleId: "neutral-z", toolId: "zinc" },
        ],
      },
    });
    expect(validateExperimentMission(game)).toEqual({ ok: true, errors: [] });
  });

  it("passes a well-formed reach-target-state game", () => {
    const game = gameWith({
      ...baseLevel,
      sampleIds: ["acid-x"],
      toolIds: ["litmus", "add-base"],
      goal: {
        kind: "reach-target-state",
        sampleId: "acid-x",
        target: { nature: "neutral" },
        targetLabel: "Make it neutral",
      },
    });
    expect(validateExperimentMission(game)).toEqual({ ok: true, errors: [] });
  });

  it("rejects a predict-outcome prompt whose sample is not on the bench", () => {
    const game = gameWith({
      ...baseLevel,
      sampleIds: ["acid-x"],
      toolIds: ["zinc"],
      goal: {
        kind: "predict-outcome",
        prompts: [{ sampleId: "base-y", toolId: "zinc" }],
      },
    });
    const result = validateExperimentMission(game);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toContain("not present on the bench");
  });

  it("rejects a reach-target-state goal with an empty target and no label", () => {
    const game = gameWith({
      ...baseLevel,
      sampleIds: ["acid-x"],
      toolIds: ["add-base"],
      goal: {
        kind: "reach-target-state",
        sampleId: "acid-x",
        target: {},
        targetLabel: "  ",
      },
    });
    const result = validateExperimentMission(game);
    expect(result.ok).toBe(false);
    expect(result.errors.join(" ")).toContain("empty reach-target-state target");
    expect(result.errors.join(" ")).toContain("targetLabel");
  });
});

// ---------------------------------------------------------------------------
// Reducer — playing the new goals
// ---------------------------------------------------------------------------

describe("reduceExperimentSession — predict-outcome flow", () => {
  const game = gameWith({
    ...baseLevel,
    sampleIds: ["acid-x", "neutral-z"],
    toolIds: ["zinc"],
    goal: {
      kind: "predict-outcome",
      prompts: [
        { sampleId: "acid-x", toolId: "zinc" }, // gas
        { sampleId: "neutral-z", toolId: "zinc" }, // none
      ],
    },
  });

  it("walks the prompts in order and grades each prediction", () => {
    let state = run(createExperimentSession(game), { type: "start-level" });
    // Opens straight into the first prompt, pre-selected.
    expect(state.phase).toBe("predicting");
    expect(state.selectedSampleId).toBe("acid-x");
    expect(state.selectedToolId).toBe("zinc");

    // Correct call on the acid (gas), then dismiss to advance.
    state = run(state, { type: "predict", visual: "gas" });
    expect(state.phase).toBe("observing");
    expect(state.lastObservation?.predictionCorrect).toBe(true);
    state = run(state, { type: "dismiss-observation" });
    expect(state.phase).toBe("predicting");
    expect(state.promptIndex).toBe(1);
    expect(state.selectedSampleId).toBe("neutral-z");

    // Wrong call on the neutral (it does nothing), then finish.
    state = run(state, { type: "predict", visual: "gas" });
    expect(state.lastObservation?.predictionCorrect).toBe(false);
    state = run(state, { type: "dismiss-observation" });
    expect(state.phase).toBe("revealed");
    expect(state.predictionsCorrect).toBe(1);
    expect(state.predictionsMade).toBe(2);
  });
});

describe("reduceExperimentSession — reach-target-state flow", () => {
  const game = gameWith({
    ...baseLevel,
    sampleIds: ["acid-x"],
    toolIds: ["litmus", "add-base"],
    goal: {
      kind: "reach-target-state",
      sampleId: "acid-x",
      target: { nature: "neutral" },
      targetLabel: "Make it neutral",
    },
  });

  it("wins the moment the sample reaches the target state", () => {
    let state = run(createExperimentSession(game), { type: "start-level" });
    expect(state.phase).toBe("exploring");

    // Probing without changing state keeps the level open.
    state = run(
      state,
      { type: "select-tool", toolId: "litmus" },
      { type: "dismiss-observation" },
    );
    expect(state.phase).toBe("exploring");
    expect(state.sampleStates["acid-x"].nature).toBe("acid");

    // Adding base neutralises it → auto-win.
    state = run(
      state,
      { type: "select-tool", toolId: "add-base" },
      { type: "dismiss-observation" },
    );
    expect(state.sampleStates["acid-x"].nature).toBe("neutral");
    expect(state.phase).toBe("revealed");
  });
});
