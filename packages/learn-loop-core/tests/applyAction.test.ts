import { describe, expect, it } from "vitest";
import type { Workspace } from "../src/model/entity";
import type { Rule } from "../src/model/scenario";
import { applyAction } from "../src/engine/applyAction";
import { acidBaseScenario } from "./fixtures/acidBase";
import { metalAcidScenario } from "./fixtures/metalAcid";
import { saltSandScenario } from "./fixtures/saltSand";
import { distillationScenario } from "./fixtures/distillation";
import { crystallizationScenario } from "./fixtures/crystallization";

/** A fresh workspace from a scenario's starting stations. */
function freshWorkspace(stations: Workspace["stations"]): Workspace {
  return { stations: structuredClone(stations) };
}

describe("applyAction — react (acid + base)", () => {
  const { stations, rules, entities } = acidBaseScenario;

  it("turns the indicator pink, warms the beaker, and swaps inputs for products", () => {
    const { workspace, result } = applyAction(
      freshWorkspace(stations),
      { type: "pour", reagent: "sodium-hydroxide", target: "beaker" },
      rules,
      entities,
    );

    expect(result.visibleChange).toBe(true);
    expect(result.newColor).toBe("#e8508f");
    expect(result.heat).toBe("warm");

    const beaker = workspace.stations.beaker;
    expect(beaker.color).toBe("#e8508f");
    expect(beaker.heat).toBe("warm");
    expect(beaker.contents).not.toContain("dilute-acid");
    expect(beaker.contents).not.toContain("sodium-hydroxide");
    expect(beaker.contents).toContain("sodium-chloride");
    expect(beaker.contents).toContain("water");
    expect(beaker.contents).toContain("phenolphthalein");
  });

  it("nudges with no visible change when the distractor is poured", () => {
    const { workspace, result } = applyAction(
      freshWorkspace(stations),
      { type: "pour", reagent: "distilled-water", target: "beaker" },
      rules,
      entities,
    );
    expect(result.visibleChange).toBe(false);
    expect(result.newColor).toBeUndefined();
    expect(result.observation).toMatch(/no visible change/i);
    expect(workspace.stations.beaker.contents).toContain("distilled-water");
  });
});

describe("applyAction — react with emission (metal + acid)", () => {
  const { stations, rules, entities } = metalAcidScenario;

  it("produces salt and emits hydrogen as a separate emission, not in the liquid", () => {
    const { workspace, result } = applyAction(
      freshWorkspace(stations),
      { type: "pour", reagent: "zinc", target: "beaker" },
      rules,
      entities,
    );

    expect(result.visibleChange).toBe(true);
    expect(result.heat).toBe("warm");
    expect(result.emits).toBeDefined();
    expect(result.emits?.map((e) => e.gas)).toEqual(["hydrogen"]);

    const beaker = workspace.stations.beaker;
    expect(beaker.contents).toContain("zinc-chloride");
    expect(beaker.contents).not.toContain("hydrogen");
    expect(beaker.contents).not.toContain("zinc");
    expect(beaker.contents).not.toContain("dilute-acid");
  });

  it("does not react with the unreactive distractor metal", () => {
    const { result } = applyAction(
      freshWorkspace(stations),
      { type: "pour", reagent: "copper", target: "beaker" },
      rules,
      entities,
    );
    expect(result.visibleChange).toBe(false);
    expect(result.emits).toBeUndefined();
  });
});

describe("applyAction — split (filtration)", () => {
  const { rules, entities } = saltSandScenario;

  function dissolvedWorkspace(): Workspace {
    return {
      stations: {
        mixture: {
          contents: ["salt", "sand", "water"],
          color: "#d9d2c0",
          heat: "room",
          phase: "solution",
        },
        filtrate: { contents: [], color: "#dfe9f5", heat: "room", phase: "empty" },
        residue: { contents: [], color: "#dfe9f5", heat: "room", phase: "empty" },
      },
    };
  }

  it("routes insoluble sand to the residue and the salt solution to the filtrate", () => {
    const { workspace, result } = applyAction(
      dissolvedWorkspace(),
      { type: "filter", source: "mixture" },
      rules,
      entities,
    );

    expect(result.visibleChange).toBe(true);
    expect(workspace.stations.mixture.contents).toEqual([]);
    expect(workspace.stations.residue.contents).toEqual(["sand"]);
    expect(workspace.stations.filtrate.contents).toContain("salt");
    expect(workspace.stations.filtrate.contents).toContain("water");
    expect(workspace.stations.filtrate.contents).not.toContain("sand");
  });

  it("merges into any contents the destination stations already hold", () => {
    const ws = dissolvedWorkspace();
    const seeded: Workspace = {
      stations: {
        ...ws.stations,
        residue: { ...ws.stations.residue, contents: ["grit"] },
      },
    };
    const { workspace } = applyAction(
      seeded,
      { type: "filter", source: "mixture" },
      rules,
      entities,
    );
    expect(workspace.stations.residue.contents).toContain("grit");
    expect(workspace.stations.residue.contents).toContain("sand");
  });
});

describe("applyAction — evaporate", () => {
  const { rules, entities } = saltSandScenario;

  function filtrateWorkspace(): Workspace {
    return {
      stations: {
        filtrate: {
          contents: ["salt", "water"],
          color: "#d9d2c0",
          heat: "room",
          phase: "solution",
        },
      },
    };
  }

  it("keeps the salt, drives the water off as a vapour emission, and runs hot", () => {
    const { workspace, result } = applyAction(
      filtrateWorkspace(),
      { type: "heat", target: "filtrate" },
      rules,
      entities,
    );

    expect(result.visibleChange).toBe(true);
    expect(result.heat).toBe("hot");
    expect(result.emits?.map((e) => e.gas)).toEqual(["water-vapour"]);

    const dish = workspace.stations.filtrate;
    expect(dish.heat).toBe("hot");
    expect(dish.contents).toEqual(["salt"]);
    expect(dish.contents).not.toContain("water");
    expect(dish.contents).not.toContain("water-vapour");
  });
});

describe("applyAction — distil (distillation)", () => {
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

  it("on a second heat, sends the remaining water over to the second receiver (first-match-wins)", () => {
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

describe("applyAction — crystallisation", () => {
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
    expect(workspace.stations.dish.contents).toEqual(["copper-sulfate"]);
  });
});

describe("applyAction — station-level observation actions", () => {
  const entities = [
    { id: "milk", label: "Milk", color: "#f4efe4", kind: "colloid" },
    { id: "beam", label: "Scattered beam", color: "#ffe785", kind: "observation" },
  ];
  const rules: Rule[] = [
    {
      id: "light-test",
      on: "shineLight",
      requires: ["milk"],
      transform: {
        kind: "react",
        consume: [],
        produce: ["beam"],
        newColor: "#fff1ba",
      },
      observation: "The light beam becomes visible.",
    },
  ];

  it("runs newly implemented observation actions through normal rules", () => {
    const { workspace, result } = applyAction(
      {
        stations: {
          tube: {
            contents: ["milk"],
            color: "#f4efe4",
            heat: "room",
            phase: "solution",
          },
        },
      },
      { type: "shineLight", target: "tube" },
      rules,
      entities,
    );

    expect(result.visibleChange).toBe(true);
    expect(workspace.stations.tube.contents).toContain("beam");
    expect(workspace.stations.tube.color).toBe("#fff1ba");
  });
});

describe("applyAction — engine behaviour", () => {
  it("reports the empty-station observation when pouring into an empty vessel", () => {
    const workspace: Workspace = {
      stations: { beaker: { contents: [], color: "#dfe9f5", heat: "room" } },
    };
    const { result } = applyAction(
      workspace,
      { type: "pour", reagent: "phenolphthalein", target: "beaker" },
      [],
    );
    expect(result.visibleChange).toBe(false);
    expect(result.observation).toMatch(/empty/i);
  });

  it("returns the first matching rule (first-match-wins)", () => {
    const orderedRules: Rule[] = [
      {
        id: "first",
        on: "pour",
        requires: ["a"],
        transform: { kind: "react", consume: [], produce: [] },
        observation: "first",
      },
      {
        id: "second",
        on: "pour",
        requires: ["a"],
        transform: { kind: "react", consume: [], produce: [] },
        observation: "second",
      },
    ];
    const workspace: Workspace = {
      stations: { beaker: { contents: ["a"], color: "#000", heat: "room" } },
    };
    const { result } = applyAction(
      workspace,
      { type: "pour", reagent: "a", target: "beaker" },
      orderedRules,
    );
    expect(result.observation).toBe("first");
  });

  it("persists the station's heat level across a later, unrelated action", () => {
    const { stations, rules, entities } = acidBaseScenario;
    const first = applyAction(
      freshWorkspace(stations),
      { type: "pour", reagent: "sodium-hydroxide", target: "beaker" },
      rules,
      entities,
    );
    expect(first.workspace.stations.beaker.heat).toBe("warm");

    const second = applyAction(
      first.workspace,
      { type: "pour", reagent: "distilled-water", target: "beaker" },
      rules,
      entities,
    );
    expect(second.workspace.stations.beaker.heat).toBe("warm");
  });
});
