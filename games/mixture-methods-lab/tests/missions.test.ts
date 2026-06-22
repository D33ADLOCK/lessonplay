import { describe, expect, it } from "vitest";
import type { Action, Scenario, Workspace } from "@learn-loop/core";
import {
  applyAction,
  createSandboxLabSession,
  reduceSandboxLabSession,
  validateGuidedLabPresentation,
  validateSandboxLabPresentation,
  validateScenario,
} from "@learn-loop/core";
import {
  chromatographyScenario,
  classifyMixturesScenario,
  crystallizationScenario,
  distillationScenario,
  guidedLabMissions,
  missionPresentations,
  missions,
  sandboxLabMissions,
  sandboxMissionPresentations,
  saltSandScenario,
} from "../src/content/missions";

function actionForStep(scenario: Scenario, index: number): Action {
  const expectStep = scenario.steps[index].expect;
  if (expectStep.type === "pour") {
    return {
      type: "pour",
      reagent: expectStep.reagent ?? "",
      target: expectStep.target ?? "",
    };
  }
  if (expectStep.type === "filter") {
    return { type: "filter", source: expectStep.source ?? "" };
  }
  return {
    type: expectStep.type,
    target: expectStep.target ?? "",
  } as Action;
}

function runScenario(scenario: Scenario): Workspace {
  let workspace: Workspace = { stations: structuredClone(scenario.stations) };
  for (let index = 0; index < scenario.steps.length; index += 1) {
    const result = applyAction(
      workspace,
      actionForStep(scenario, index),
      scenario.rules,
      scenario.entities,
    );
    expect(result.result.visibleChange, scenario.steps[index].id).toBe(true);
    workspace = result.workspace;
  }
  return workspace;
}

describe("mixture methods missions", () => {
  it("keeps all authored missions valid", () => {
    for (const mission of guidedLabMissions) {
      expect(validateScenario(mission.scenario), mission.scenario.id).toEqual({
        ok: true,
        errors: [],
      });
      expect(
        validateGuidedLabPresentation(mission.scenario, mission.presentation),
        mission.scenario.id,
      ).toEqual({
        ok: true,
        errors: [],
      });
    }
  });

  it("keeps all sandbox missions valid", () => {
    for (const mission of sandboxLabMissions) {
      expect(mission.presentation.question.trim(), mission.scenario.id).not.toBe("");
      expect(mission.presentation.stages.length, mission.scenario.id).toBeGreaterThanOrEqual(2);
      expect(mission.presentation.stages.length, mission.scenario.id).toBeLessThanOrEqual(4);
      expect(validateScenario(mission.scenario), mission.scenario.id).toEqual({
        ok: true,
        errors: [],
      });
      expect(
        validateSandboxLabPresentation(mission.scenario, mission.presentation),
        mission.scenario.id,
      ).toEqual({
        ok: true,
        errors: [],
      });
    }
  });

  it("keeps scenario and presentation lists in lockstep", () => {
    expect(missionPresentations.map((presentation) => presentation.scenarioId)).toEqual(
      missions.map((mission) => mission.id),
    );
    expect(sandboxMissionPresentations.map((presentation) => presentation.scenarioId)).toEqual(
      missions.map((mission) => mission.id),
    );
  });

  it("covers the five planned chapter missions", () => {
    expect(missions.map((mission) => mission.id)).toEqual([
      "classify-mixtures",
      "salt-sand",
      "crystallization",
      "distillation",
      "chromatography",
    ]);
  });

  it("classifies colloids and suspensions through light, settling, and filtration", () => {
    const workspace = runScenario(classifyMixturesScenario);
    expect(workspace.stations.testTube.contents).toEqual([]);
    expect(workspace.stations.residue.contents).toContain("chalk-suspension");
    expect(workspace.stations.residue.contents).toContain("settled-chalk");
  });

  it("recovers salt after dissolving, filtering, and evaporating", () => {
    const workspace = runScenario(saltSandScenario);
    expect(workspace.stations.residue.contents).toEqual(["sand"]);
    expect(workspace.stations.filtrate.contents).toEqual(["salt"]);
  });

  it("grows crystals by cooling a filtered hot solution", () => {
    const workspace = runScenario(crystallizationScenario);
    expect(workspace.stations.residue.contents).toEqual(["impurity"]);
    expect(workspace.stations.filtrate.contents).toContain("crystals");
  });

  it("recovers acetone and water into separate receivers", () => {
    const workspace = runScenario(distillationScenario);
    expect(workspace.stations.acetoneReceiver.contents).toEqual(["acetone"]);
    expect(workspace.stations.waterReceiver.contents).toEqual(["water"]);
  });

  it("separates black ink into pigment bands", () => {
    const workspace = runScenario(chromatographyScenario);
    expect(workspace.stations.paper.contents).toContain("pigment-bands");
  });

  it("lets the sandbox salt-sand mission collect evidence through tools", () => {
    const mission = sandboxLabMissions.find((entry) => entry.scenario.id === "salt-sand");
    expect(mission).toBeDefined();
    expect(
      mission!.presentation.stationVisuals.find(
        (visual) => visual.stationId === "filtrate",
      ),
    ).toMatchObject({
      kind: "evaporating-dish",
      effectTags: expect.arrayContaining(["grow-crystals", "vapour"]),
    });
    let state = createSandboxLabSession(mission!);

    state = reduceSandboxLabSession(state, { type: "apply-tool", toolId: "add-water" });
    expect(state.pendingFeedback?.card.result).toBe(
      "Salt mixes into the water. Sand stays as solid grains.",
    );
    state = reduceSandboxLabSession(state, { type: "dismiss-feedback" });
    state = reduceSandboxLabSession(state, { type: "apply-tool", toolId: "filter" });
    state = reduceSandboxLabSession(state, { type: "dismiss-feedback" });
    state = reduceSandboxLabSession(state, {
      type: "select-material",
      materialId: "filtrate",
    });
    state = reduceSandboxLabSession(state, { type: "apply-tool", toolId: "heat" });
    state = reduceSandboxLabSession(state, { type: "dismiss-feedback" });

    expect(state.collectedEvidence).toEqual([
      "salt-dissolves",
      "sand-residue",
      "salt-crystals",
    ]);
    expect(state.workspace.stations.residue.contents).toEqual(["sand"]);
    expect(state.workspace.stations.filtrate.contents).toEqual(["salt"]);
    expect(state.notebookEvidence.map((entry) => entry.evidenceId)).toEqual([
      "salt-dissolves",
      "sand-residue",
      "salt-crystals",
    ]);
    state = reduceSandboxLabSession(state, {
      type: "submit-conclusion",
      conclusionId: "separate-salt-sand",
    });
    expect(state.phase).toBe("concluded");
    expect(state.conclusionAttempt?.success).toBe(true);
  });

  it("keeps a useful non-result in the sandbox distillation mission", () => {
    const mission = sandboxLabMissions.find((entry) => entry.scenario.id === "distillation");
    expect(mission).toBeDefined();
    let state = createSandboxLabSession(mission!);

    state = reduceSandboxLabSession(state, { type: "apply-tool", toolId: "filter" });

    expect(state.collectedEvidence).toContain("filter-not-for-liquids");
    expect(state.pendingFeedback?.soundCue).toBe("wrong-tool");
    expect(state.observations.at(-1)?.observation).toBe(
      "The filter does not separate two liquids mixed together.",
    );
  });
});
