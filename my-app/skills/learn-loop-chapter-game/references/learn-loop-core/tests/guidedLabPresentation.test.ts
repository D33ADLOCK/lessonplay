import { describe, expect, it } from "vitest";
import {
  validateGuidedLabPresentation,
  type GuidedLabMissionPresentation,
} from "../src";
import { saltSandScenario } from "./fixtures/saltSand";

describe("validateGuidedLabPresentation", () => {
  it("accepts a matching guided-lab presentation", () => {
    const presentation: GuidedLabMissionPresentation = {
      scenarioId: saltSandScenario.id,
      stationVisuals: [
        { stationId: "mixture", kind: "beaker" },
        {
          stationId: "residue",
          kind: "filter",
          effectTags: ["trap-residue"],
        },
        {
          stationId: "filtrate",
          kind: "dish",
          effectTags: ["grow-crystals", "distil-vapour"],
        },
      ],
    };

    expect(validateGuidedLabPresentation(saltSandScenario, presentation)).toEqual({
      ok: true,
      errors: [],
    });
  });

  it("rejects metadata that an agent cannot safely render", () => {
    const presentation = {
      scenarioId: "wrong",
      stationVisuals: [
        { stationId: "missing", kind: "beaker", effectTags: ["trap-residue"] },
        { stationId: "mixture", kind: "unknown", effectTags: ["unknown"] },
        { stationId: "mixture", kind: "beaker" },
      ],
    } as unknown as GuidedLabMissionPresentation;

    const result = validateGuidedLabPresentation(saltSandScenario, presentation);

    expect(result.ok).toBe(false);
    expect(result.errors).toEqual([
      'presentation.scenarioId "wrong" must match scenario "salt-sand-separation"',
      'station visual "missing" does not exist in scenario.stations',
      'station visual "mixture" uses unknown kind "unknown"',
      'station visual "mixture" uses unknown effect tag "unknown"',
      'station visual "mixture" is duplicated',
    ]);
  });
});
