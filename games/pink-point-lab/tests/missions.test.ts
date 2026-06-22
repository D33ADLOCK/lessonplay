import { describe, expect, it } from "vitest";
import type { Action, Scenario, Workspace } from "@learn-loop/core";
import {
  applyAction,
  validateGuidedLabPresentation,
  validateScenario,
} from "@learn-loop/core";
import {
  compareSamplesScenario,
  endpointScenario,
  guidedLabMissions,
  missionPresentations,
  missions,
} from "../src/content/missions";

function actionForStep(scenario: Scenario, index: number): Action {
  const expected = scenario.steps[index].expect;
  if (expected.type === "pour") {
    return {
      type: "pour",
      reagent: expected.reagent ?? "",
      target: expected.target ?? "",
    };
  }
  return {
    type: expected.type,
    target: expected.target ?? "",
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

describe("Pink Point Lab missions", () => {
  it("keeps scenarios and guided presentations valid", () => {
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

  it("keeps scenario and presentation lists in lockstep", () => {
    expect(missionPresentations.map((presentation) => presentation.scenarioId)).toEqual(
      missions.map((mission) => mission.id),
    );
  });

  it("turns phenolphthalein pink only after adding base in the endpoint mission", () => {
    const workspace = runScenario(endpointScenario);
    expect(workspace.stations.flask.color).toBe("#f7a6c8");
    expect(workspace.stations.flask.contents).toContain("phenolphthalein");
    expect(workspace.stations.flask.contents).toContain("basic-mixture");
    expect(workspace.stations.flask.contents).not.toContain("acid-sample");
  });

  it("keeps the neutral sample colorless while the base sample turns pink", () => {
    const workspace = runScenario(compareSamplesScenario);
    expect(workspace.stations.neutralTube.color).toBe("#e7f2f7");
    expect(workspace.stations.neutralTube.contents).toContain("neutral-confirmed");
    expect(workspace.stations.baseTube.color).toBe("#f7a6c8");
    expect(workspace.stations.baseTube.contents).toContain("base-confirmed");
  });
});
