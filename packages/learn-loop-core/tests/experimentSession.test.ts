import { describe, expect, it } from "vitest";
import {
  canClassify,
  createExperimentSession,
  currentLevel,
  reduceExperimentSession,
  type ExperimentSessionEvent,
  type ExperimentSessionState,
} from "../src/engine/experimentSession";
import type { ExperimentGame } from "../src/model/experimentLab";
import { particleGame } from "./fixtures/experimentParticles";

function run(
  state: ExperimentSessionState,
  ...events: ExperimentSessionEvent[]
): ExperimentSessionState {
  return events.reduce(reduceExperimentSession, state);
}

/** A one-level game whose level needs no prediction, for the fast path. */
const openOnlyGame: ExperimentGame = {
  ...particleGame,
  levels: [particleGame.levels[2]],
};

describe("createExperimentSession", () => {
  it("starts at the first level in the intro phase", () => {
    const state = createExperimentSession(particleGame);
    expect(state.levelIndex).toBe(0);
    expect(state.phase).toBe("intro");
    expect(state.notebook).toEqual([]);
  });
});

describe("the predict → act → observe loop", () => {
  it("requires a prediction before applying a tool when the level demands it", () => {
    let state = run(createExperimentSession(particleGame), { type: "start-level" });
    expect(state.phase).toBe("exploring");

    state = run(
      state,
      { type: "select-sample", sampleId: "unknown-b" },
      { type: "select-tool", toolId: "light" },
    );
    // The tool is chosen but not yet applied — we are awaiting the prediction.
    expect(state.phase).toBe("predicting");
    expect(state.notebook).toHaveLength(0);

    state = run(state, { type: "predict", visual: "beam" });
    expect(state.phase).toBe("observing");
    expect(state.lastObservation?.predictionCorrect).toBe(true);
    expect(state.predictionsMade).toBe(1);
    expect(state.predictionsCorrect).toBe(1);
    expect(state.notebook).toHaveLength(1);
    expect(state.notebook[0]).toMatchObject({ sampleId: "unknown-b", visual: "beam" });
  });

  it("records a wrong prediction without crediting it", () => {
    let state = run(createExperimentSession(particleGame), { type: "start-level" });
    state = run(
      state,
      { type: "select-sample", sampleId: "unknown-b" },
      { type: "select-tool", toolId: "light" },
      { type: "predict", visual: "none" },
    );
    expect(state.lastObservation?.predictionCorrect).toBe(false);
    expect(state.predictionsMade).toBe(1);
    expect(state.predictionsCorrect).toBe(0);
  });

  it("shows only what is observed, never the inference", () => {
    let state = run(createExperimentSession(particleGame), { type: "start-level" });
    state = run(
      state,
      { type: "select-sample", sampleId: "unknown-b" },
      { type: "select-tool", toolId: "light" },
      { type: "predict", visual: "beam" },
    );
    const text = state.lastObservation!.effect.observation.toLowerCase();
    expect(text).not.toContain("suspension");
    expect(text).not.toContain("colloid");
  });

  it("applies a tool immediately when no prediction is required", () => {
    let state = run(createExperimentSession(openOnlyGame), { type: "start-level" });
    state = run(
      state,
      { type: "select-sample", sampleId: "unknown-b" },
      { type: "select-tool", toolId: "light" },
    );
    expect(state.phase).toBe("observing");
    expect(state.lastObservation?.predictedVisual).toBeNull();
    expect(state.lastObservation?.predictionCorrect).toBeNull();
    expect(state.predictionsMade).toBe(0);
  });

  it("returns to exploring after dismissing an observation", () => {
    let state = run(createExperimentSession(openOnlyGame), { type: "start-level" });
    state = run(
      state,
      { type: "select-sample", sampleId: "unknown-b" },
      { type: "select-tool", toolId: "light" },
      { type: "dismiss-observation" },
    );
    expect(state.phase).toBe("exploring");
    expect(state.lastObservation).toBeNull();
  });

  it("keeps one notebook row per (sample, tool) when re-probed", () => {
    let state = run(createExperimentSession(openOnlyGame), { type: "start-level" });
    state = run(
      state,
      { type: "select-sample", sampleId: "unknown-b" },
      { type: "select-tool", toolId: "light" },
      { type: "dismiss-observation" },
      { type: "select-tool", toolId: "light" },
    );
    expect(state.notebook).toHaveLength(1);
  });

  it("keeps distinct stateful observations for the same sample and tool", () => {
    const statefulGame: ExperimentGame = {
      ...particleGame,
      definition: {
        samples: [
          {
            id: "sample",
            label: "Sample",
            properties: { stage: "before" },
            categoryId: "changed",
          },
        ],
        tools: [{ id: "shake", label: "Shake" }],
        ruleSet: {
          rules: [
            {
              toolId: "shake",
              when: { stage: "after" },
              effect: {
                observationId: "after-shake",
                observation: "The liquid stays cloudy after shaking.",
                visual: "none",
              },
            },
            {
              toolId: "shake",
              when: { stage: "before" },
              effect: {
                observationId: "first-shake",
                observation: "A layer breaks apart and clouds the liquid.",
                visual: "settle",
                setState: { stage: "after" },
              },
            },
          ],
          defaultEffect: {
            observationId: "none",
            observation: "Nothing observable happens.",
            visual: "none",
          },
        },
      },
      categories: [{ id: "changed", label: "Changed" }],
      levels: [
        {
          id: "stateful",
          title: "Stateful",
          intro: "Probe twice.",
          sampleIds: ["sample"],
          toolIds: ["shake"],
          goal: { classifyIds: ["sample"], categoryIds: ["changed"] },
          scaffolding: "guided",
          predictionRequired: false,
          hints: [],
        },
      ],
    };

    let state = run(createExperimentSession(statefulGame), { type: "start-level" });
    state = run(
      state,
      { type: "select-tool", toolId: "shake" },
      { type: "dismiss-observation" },
      { type: "select-tool", toolId: "shake" },
    );

    expect(state.notebook.map((entry) => entry.observationId)).toEqual([
      "first-shake",
      "after-shake",
    ]);
  });
});

describe("the classify gate", () => {
  it("blocks classification until every classify sample has been probed", () => {
    let state = run(createExperimentSession(openOnlyGame), { type: "start-level" });
    expect(canClassify(state)).toBe(false);
    state = run(state, { type: "open-classify" });
    expect(state.phase).toBe("exploring"); // refused — no evidence yet

    // Probe all three unknowns, then the gate opens.
    for (const sampleId of ["unknown-a", "unknown-b", "unknown-c"]) {
      state = run(
        state,
        { type: "select-sample", sampleId },
        { type: "select-tool", toolId: "light" },
        { type: "dismiss-observation" },
      );
    }
    expect(canClassify(state)).toBe(true);
    state = run(state, { type: "open-classify" });
    expect(state.phase).toBe("classifying");
  });
});

describe("classification and reveal", () => {
  function probedTutorialSession(): ExperimentSessionState {
    let state = run(createExperimentSession(particleGame), { type: "start-level" });
    state = run(
      state,
      { type: "select-sample", sampleId: "unknown-b" },
      { type: "select-tool", toolId: "light" },
      { type: "predict", visual: "beam" },
      { type: "dismiss-observation" },
      { type: "open-classify" },
    );
    return state;
  }

  it("reveals on a fully correct classification", () => {
    let state = probedTutorialSession();
    expect(state.phase).toBe("classifying");
    state = run(
      state,
      { type: "assign-category", sampleId: "unknown-b", categoryId: "suspension" },
      { type: "submit-classification" },
    );
    expect(state.phase).toBe("revealed");
    expect(state.classificationResult?.correct).toBe(true);
  });

  it("stays in classifying and marks the miss on a wrong classification", () => {
    let state = probedTutorialSession();
    state = run(
      state,
      { type: "assign-category", sampleId: "unknown-b", categoryId: "colloid" },
      { type: "submit-classification" },
    );
    expect(state.phase).toBe("classifying");
    expect(state.classificationResult?.correct).toBe(false);
    expect(state.classificationResult?.perSample["unknown-b"]).toBe(false);
  });

  it("advances to the next level after a reveal", () => {
    let state = probedTutorialSession();
    state = run(
      state,
      { type: "assign-category", sampleId: "unknown-b", categoryId: "suspension" },
      { type: "submit-classification" },
      { type: "next-level" },
    );
    expect(state.levelIndex).toBe(1);
    expect(state.phase).toBe("intro");
    expect(state.notebook).toEqual([]); // fresh bench for the new level
    expect(currentLevel(state).id).toBe("combine-causes");
  });

  it("reaches the complete phase after the final level's reveal", () => {
    let state = run(createExperimentSession(openOnlyGame), { type: "start-level" });
    for (const sampleId of ["unknown-a", "unknown-b", "unknown-c"]) {
      state = run(
        state,
        { type: "select-sample", sampleId },
        { type: "select-tool", toolId: "light" },
        { type: "dismiss-observation" },
      );
    }
    state = run(
      state,
      { type: "open-classify" },
      { type: "assign-category", sampleId: "unknown-a", categoryId: "solution" },
      { type: "assign-category", sampleId: "unknown-b", categoryId: "suspension" },
      { type: "assign-category", sampleId: "unknown-c", categoryId: "colloid" },
      { type: "submit-classification" },
    );
    expect(state.phase).toBe("revealed");
    state = run(state, { type: "next-level" });
    expect(state.phase).toBe("complete");
  });
});

describe("graduated hints", () => {
  it("reveals hints one at a time, capped at the level's hint count", () => {
    let state = run(createExperimentSession(particleGame), { type: "start-level" });
    expect(state.hintsRevealed).toBe(0);
    state = run(state, { type: "request-hint" });
    expect(state.hintsRevealed).toBe(1);
    // The tutorial has a single hint; further requests are no-ops.
    state = run(state, { type: "request-hint" });
    expect(state.hintsRevealed).toBe(1);
  });
});

describe("guards and reset", () => {
  it("ignores selecting a sample outside the exploring phase", () => {
    const state = createExperimentSession(particleGame); // intro phase
    const next = run(state, { type: "select-sample", sampleId: "unknown-b" });
    expect(next.selectedSampleId).toBe(state.selectedSampleId);
  });

  it("ignores an assignment to an unknown category", () => {
    let state = run(createExperimentSession(openOnlyGame), { type: "start-level" });
    for (const sampleId of ["unknown-a", "unknown-b", "unknown-c"]) {
      state = run(
        state,
        { type: "select-sample", sampleId },
        { type: "select-tool", toolId: "light" },
        { type: "dismiss-observation" },
      );
    }
    state = run(state, { type: "open-classify" });
    const next = run(state, {
      type: "assign-category",
      sampleId: "unknown-a",
      categoryId: "not-a-category",
    });
    expect(next.assignments["unknown-a"]).toBeUndefined();
  });

  it("reset returns to a fresh first-level session", () => {
    let state = run(createExperimentSession(particleGame), { type: "start-level" });
    state = run(
      state,
      { type: "select-sample", sampleId: "unknown-b" },
      { type: "select-tool", toolId: "light" },
      { type: "predict", visual: "beam" },
      { type: "reset" },
    );
    expect(state.phase).toBe("intro");
    expect(state.notebook).toEqual([]);
    expect(state.levelIndex).toBe(0);
  });

  it("does not mutate the input state", () => {
    const state = run(createExperimentSession(particleGame), { type: "start-level" });
    const snapshot = JSON.stringify(state);
    run(state, { type: "select-sample", sampleId: "unknown-b" });
    expect(JSON.stringify(state)).toBe(snapshot);
  });
});
