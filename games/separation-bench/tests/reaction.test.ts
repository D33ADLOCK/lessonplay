import { describe, expect, it } from "vitest";
import { applyAction, type Rule, type Workspace } from "@learn-loop/core";
import { acidBaseScenario } from "../src/content/acidBase";
import { metalAcidScenario } from "../src/content/metalAcid";
import { saltSandScenario } from "../src/content/saltSand";

/** A fresh workspace from an experiment's starting stations. */
function freshWorkspace(stations: Workspace["stations"]): Workspace {
  return { stations: structuredClone(stations) };
}

describe("applyAction — acid + base", () => {
  const { stations, rules, entities } = acidBaseScenario;

  it("turns the indicator pink, warms the beaker, and swaps reagents for products", () => {
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
    // Reagents consumed, products present, indicator untouched.
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
    // The poured reagent still lands in the beaker.
    expect(workspace.stations.beaker.contents).toContain("distilled-water");
  });
});

describe("applyAction — metal + acid", () => {
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
    // Gas left the liquid — it is not in the contents.
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

describe("applyAction — filtration (split)", () => {
  const { rules, entities } = saltSandScenario;

  /** A mixture of dissolved salt + water + suspended sand, plus empty vessels. */
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

    // Source emptied.
    expect(workspace.stations.mixture.contents).toEqual([]);
    // Insoluble → residue.
    expect(workspace.stations.residue.contents).toEqual(["sand"]);
    // Soluble solute + solvent → filtrate.
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
    // Existing residue content is kept, not overwritten.
    expect(workspace.stations.residue.contents).toContain("grit");
    expect(workspace.stations.residue.contents).toContain("sand");
  });
});

describe("applyAction — evaporation", () => {
  const { rules, entities } = saltSandScenario;

  /** A filtrate of dissolved salt + water, ready to boil down. */
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
    // Salt left behind; water gone from the liquid (it left as vapour).
    expect(dish.contents).toEqual(["salt"]);
    expect(dish.contents).not.toContain("water");
    expect(dish.contents).not.toContain("water-vapour");
  });
});

describe("applyAction — engine behaviour", () => {
  it("reports the empty-station observation when pouring into an empty beaker", () => {
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

    // A second pour that matches no rule must not reset the heat.
    const second = applyAction(
      first.workspace,
      { type: "pour", reagent: "distilled-water", target: "beaker" },
      rules,
      entities,
    );
    expect(second.workspace.stations.beaker.heat).toBe("warm");
  });
});
