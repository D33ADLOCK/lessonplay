import { describe, expect, it } from "vitest";
import {
  applyAction,
  validateScenario,
  type Workspace,
} from "@learn-loop/core";
import { distillationScenario } from "../src/content/distillation";
import { crystallizationScenario } from "../src/content/crystallization";

/** A fresh workspace from an experiment's starting stations. */
function freshWorkspace(stations: Workspace["stations"]): Workspace {
  return { stations: structuredClone(stations) };
}

describe("separation scenarios — distillation (distil)", () => {
  const { stations, rules, entities } = distillationScenario;

  it("boils the lower-boiling acetone over into the receiver, leaving water behind", () => {
    const { workspace, result } = applyAction(
      freshWorkspace(stations),
      { type: "heat", target: "flask" },
      rules,
      entities,
    );

    expect(result.visibleChange).toBe(true);
    expect(result.heat).toBe("hot");

    // Acetone recovered as liquid in the receiver — not lost as vapour.
    expect(workspace.stations.acetoneJar.contents).toEqual(["acetone"]);
    // Water stays in the flask; acetone has left it.
    expect(workspace.stations.flask.contents).toEqual(["water"]);
    expect(workspace.stations.flask.contents).not.toContain("acetone");
  });

  it("on a second heat, sends the remaining water over to the second receiver", () => {
    const first = applyAction(
      freshWorkspace(stations),
      { type: "heat", target: "flask" },
      rules,
      entities,
    );
    // First-match-wins now picks the water rule, the acetone rule no longer matching.
    const second = applyAction(
      first.workspace,
      { type: "heat", target: "flask" },
      rules,
      entities,
    );

    expect(second.result.visibleChange).toBe(true);
    expect(second.workspace.stations.waterJar.contents).toEqual(["water"]);
    expect(second.workspace.stations.flask.contents).toEqual([]);
  });
});

describe("separation scenarios — crystallisation", () => {
  const { stations, rules, entities } = crystallizationScenario;

  it("dissolves the copper sulfate when water is poured in", () => {
    const { workspace, result } = applyAction(
      freshWorkspace(stations),
      { type: "pour", reagent: "water", target: "dish" },
      rules,
      entities,
    );
    expect(result.visibleChange).toBe(true);
    expect(result.newColor).toBeDefined();
    expect(workspace.stations.dish.contents).toContain("copper-sulfate");
    expect(workspace.stations.dish.contents).toContain("water");
  });

  it("crystallises the copper sulfate when the solution is heated", () => {
    const dissolved: Workspace = {
      stations: {
        dish: {
          contents: ["copper-sulfate", "water"],
          color: "#7aa9dd",
          heat: "room",
          phase: "solution",
        },
      },
    };
    const { workspace, result } = applyAction(
      dissolved,
      { type: "heat", target: "dish" },
      rules,
      entities,
    );
    expect(result.visibleChange).toBe(true);
    expect(result.heat).toBe("hot");
    expect(result.emits?.map((e) => e.gas)).toEqual(["water-vapour"]);
    // Crystals remain; the water has left as vapour.
    expect(workspace.stations.dish.contents).toEqual(["copper-sulfate"]);
  });
});

describe("validateScenario — separation scenarios", () => {
  it("accepts the distillation scenario (uses the implemented distil transform)", () => {
    expect(validateScenario(distillationScenario)).toEqual({
      ok: true,
      errors: [],
    });
  });

  it("accepts the crystallisation scenario", () => {
    expect(validateScenario(crystallizationScenario)).toEqual({
      ok: true,
      errors: [],
    });
  });
});
