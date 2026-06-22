import { describe, expect, it } from "vitest";
import {
  createSandboxLabSession,
  hasRequiredEvidence,
  isConclusionUnlocked,
  reduceSandboxLabSession,
  validateSandboxLabPresentation,
  GUIDED_LAB_APPARATUS_LABELS,
  GUIDED_LAB_REACTION_LABELS,
  STATION_VISUAL_KINDS,
  type SandboxLabMissionPresentation,
} from "../src";
import { sandboxSaltSandMission } from "./fixtures/sandboxMixtures";

describe("validateSandboxLabPresentation", () => {
  it("exports the guided lab reaction kit vocabulary", () => {
    expect(STATION_VISUAL_KINDS).toContain("evaporating-dish");
    expect(STATION_VISUAL_KINDS).toContain("condenser");
    expect(STATION_VISUAL_KINDS).toContain("magnet");
    expect(GUIDED_LAB_APPARATUS_LABELS["evaporating-dish"]).toBe(
      "Evaporating dish",
    );
    expect(GUIDED_LAB_REACTION_LABELS["gas-bubbles"]).toBe("Gas bubbles form");
    expect(GUIDED_LAB_REACTION_LABELS["magnetic-pull"]).toBe(
      "Magnet pulls metal",
    );
  });

  it("accepts authored sandbox lab data", () => {
    expect(
      validateSandboxLabPresentation(
        sandboxSaltSandMission.scenario,
        sandboxSaltSandMission.presentation,
      ),
    ).toEqual({ ok: true, errors: [] });
  });

  it("rejects generated data that cannot be played", () => {
    const invalid = {
      scenarioId: "wrong",
      question: "",
      materials: [{ id: "sample", label: "Sample", stationId: "missing" }],
      tools: [{ id: "tool", label: "Tool", action: { type: "pour", reagent: "missing" } }],
      interactions: [
        {
          id: "bad",
          materialId: "missing-material",
          toolId: "missing-tool",
          evidenceId: "evidence",
          feedbackCard: {
            action: "",
            result: "",
            why: "",
            next: "",
            notebook: "",
          },
          soundCue: "bad-cue",
          reactionEffect: "bad-effect",
          effectTags: ["unknown"],
        },
      ],
      stages: [
        {
          id: "bad-stage",
          title: "",
          goal: "",
          materialIds: ["missing-material"],
          toolIds: ["missing-tool"],
          requiredEvidence: ["unreachable"],
          nextPrompt: "",
        },
      ],
      conclusions: [
        {
          id: "bad-conclusion",
          label: "Bad",
          correct: false,
          requiresEvidence: ["missing-evidence"],
          feedback: "No.",
        },
      ],
      notebook: { goal: "Test" },
      stationVisuals: [{ stationId: "missing", kind: "unknown" }],
    } as unknown as SandboxLabMissionPresentation;

    const result = validateSandboxLabPresentation(
      sandboxSaltSandMission.scenario,
      invalid,
    );

    expect(result.ok).toBe(false);
    expect(result.errors).toContain(
      'presentation.scenarioId "wrong" must match scenario "salt-sand-separation"',
    );
    expect(result.errors).toContain('material "sample" uses unknown station "missing"');
    expect(result.errors).toContain('tool "tool" pours unknown entity "missing"');
    expect(result.errors).toContain(
      'interaction "bad" uses unknown material "missing-material"',
    );
    expect(result.errors).toContain(
      'interaction "bad" uses unknown tool "missing-tool"',
    );
    expect(result.errors).toContain(
      'interaction "bad" uses unknown effect tag "unknown"',
    );
    expect(result.errors).toContain('interaction "bad" feedback must include an action');
    expect(result.errors).toContain('interaction "bad" feedback must include a result');
    expect(result.errors).toContain(
      'interaction "bad" feedback must include why it matters',
    );
    expect(result.errors).toContain(
      'interaction "bad" feedback must include a next step',
    );
    expect(result.errors).toContain(
      'interaction "bad" feedback must include notebook evidence',
    );
    expect(result.errors).toContain(
      'interaction "bad" uses unknown sound cue "bad-cue"',
    );
    expect(result.errors).toContain(
      'interaction "bad" uses unknown reaction effect "bad-effect"',
    );
    expect(result.errors).toContain(
      "presentation.question must ask one simple mission question",
    );
    expect(result.errors).toContain('stage "bad-stage" must include a title');
    expect(result.errors).toContain('stage "bad-stage" must include a simple goal');
    expect(result.errors).toContain('stage "bad-stage" must include a next prompt');
    expect(result.errors).toContain(
      'stage "bad-stage" uses unknown material "missing-material"',
    );
    expect(result.errors).toContain(
      'stage "bad-stage" uses unknown tool "missing-tool"',
    );
    expect(result.errors).toContain(
      'stage "bad-stage" requires evidence "unreachable" that cannot be collected',
    );
    expect(result.errors).toContain(
      'conclusion "bad-conclusion" requires unknown evidence "missing-evidence"',
    );
    expect(result.errors).toContain(
      "presentation.conclusions must include at least one correct conclusion",
    );
    expect(result.errors).toContain(
      'station visual "missing" does not exist in scenario.stations',
    );
    expect(result.errors).toContain(
      'station visual "missing" uses unknown kind "unknown"',
    );
  });
});

describe("sandbox lab session", () => {
  it("turns material plus tool actions into observations and evidence", () => {
    let state = createSandboxLabSession(sandboxSaltSandMission);

    state = reduceSandboxLabSession(state, {
      type: "apply-tool",
      toolId: "wait",
    });
    expect(state.observations.at(-1)?.evidenceId).toBe("wait-did-not-separate");
    expect(state.observations.at(-1)?.visibleChange).toBe(false);
    expect(state.currentStageIndex).toBe(0);
    expect(state.pendingFeedback?.card.result).toBe(
      "The dry mixture still has salt and sand together.",
    );
    state = reduceSandboxLabSession(state, { type: "dismiss-feedback" });
    expect(state.notebookEvidence.at(-1)?.text).toBe(
      "Waiting alone does not separate dry salt and sand.",
    );

    state = reduceSandboxLabSession(state, {
      type: "apply-tool",
      toolId: "add-water",
    });
    expect(state.pendingFeedback?.soundCue).toBe("pour");
    expect(state.currentStageIndex).toBe(0);
    state = reduceSandboxLabSession(state, { type: "dismiss-feedback" });
    expect(state.currentStageIndex).toBe(1);
    state = reduceSandboxLabSession(state, {
      type: "apply-tool",
      toolId: "filter",
    });
    expect(state.currentStageIndex).toBe(1);
    state = reduceSandboxLabSession(state, { type: "dismiss-feedback" });
    expect(state.currentStageIndex).toBe(2);
    state = reduceSandboxLabSession(state, {
      type: "select-material",
      materialId: "filtrate",
    });
    state = reduceSandboxLabSession(state, {
      type: "apply-tool",
      toolId: "heat",
    });
    expect(hasRequiredEvidence(state)).toBe(true);
    expect(state.pendingFeedback?.stageComplete).toBe(false);
    expect(isConclusionUnlocked(state, sandboxSaltSandMission.presentation.conclusions[0])).toBe(
      false,
    );
    state = reduceSandboxLabSession(state, { type: "dismiss-feedback" });

    expect(state.workspace.stations.residue.contents).toEqual(["sand"]);
    expect(state.workspace.stations.filtrate.contents).toEqual(["salt"]);
    expect(state.observations.map((entry) => entry.evidenceId)).toEqual([
      "wait-did-not-separate",
      "salt-dissolved",
      "sand-residue",
      "salt-crystals",
    ]);
    expect(hasRequiredEvidence(state)).toBe(true);
    expect(state.notebookEvidence.map((entry) => entry.evidenceId)).toEqual([
      "wait-did-not-separate",
      "salt-dissolved",
      "sand-residue",
      "salt-crystals",
    ]);
  });

  it("keeps conclusions hidden until the final stage evidence is collected", () => {
    let state = createSandboxLabSession(sandboxSaltSandMission);
    const correct = sandboxSaltSandMission.presentation.conclusions[0];

    state = reduceSandboxLabSession(state, {
      type: "apply-tool",
      toolId: "add-water",
    });
    expect(hasRequiredEvidence(state)).toBe(false);
    expect(state.pendingFeedback).not.toBeNull();
    expect(isConclusionUnlocked(state, correct)).toBe(false);
  });

  it("turns undefined visible pairs into generic non-results without evidence", () => {
    let state = createSandboxLabSession(sandboxSaltSandMission);

    state = reduceSandboxLabSession(state, {
      type: "apply-tool",
      toolId: "wait",
    });
    state = reduceSandboxLabSession(state, { type: "dismiss-feedback" });
    state = reduceSandboxLabSession(state, {
      type: "apply-tool",
      toolId: "add-water",
    });
    state = reduceSandboxLabSession(state, { type: "dismiss-feedback" });
    state = reduceSandboxLabSession(state, {
      type: "apply-tool",
      toolId: "filter",
    });
    state = reduceSandboxLabSession(state, { type: "dismiss-feedback" });
    state = reduceSandboxLabSession(state, {
      type: "apply-tool",
      toolId: "heat",
    });
    state = reduceSandboxLabSession(state, { type: "dismiss-feedback" });
    state = reduceSandboxLabSession(state, {
      type: "apply-tool",
      toolId: "heat",
    });

    expect(state.observations.at(-1)?.evidenceId).toBe("no-change:filtrate:heat");
    expect(state.collectedEvidence).toEqual([
      "wait-did-not-separate",
      "salt-dissolved",
      "sand-residue",
      "salt-crystals",
    ]);
  });

  it("unlocks conclusions from collected evidence", () => {
    let state = createSandboxLabSession(sandboxSaltSandMission);
    const correct = sandboxSaltSandMission.presentation.conclusions[0];

    expect(isConclusionUnlocked(state, correct)).toBe(false);
    state = reduceSandboxLabSession(state, {
      type: "submit-conclusion",
      conclusionId: correct.id,
    });
    expect(state.conclusionAttempt).toBeNull();

    state = reduceSandboxLabSession(state, {
      type: "apply-tool",
      toolId: "add-water",
    });
    state = reduceSandboxLabSession(state, { type: "dismiss-feedback" });
    state = reduceSandboxLabSession(state, {
      type: "apply-tool",
      toolId: "filter",
    });
    state = reduceSandboxLabSession(state, { type: "dismiss-feedback" });
    state = reduceSandboxLabSession(state, {
      type: "select-material",
      materialId: "filtrate",
    });
    state = reduceSandboxLabSession(state, {
      type: "apply-tool",
      toolId: "heat",
    });
    state = reduceSandboxLabSession(state, { type: "dismiss-feedback" });

    expect(isConclusionUnlocked(state, correct)).toBe(true);
    state = reduceSandboxLabSession(state, {
      type: "submit-conclusion",
      conclusionId: correct.id,
    });
    expect(state.phase).toBe("concluded");
    expect(state.conclusionAttempt?.success).toBe(true);
  });
});
