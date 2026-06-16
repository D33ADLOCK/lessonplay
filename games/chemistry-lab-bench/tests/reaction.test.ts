import { describe, expect, it } from "vitest";
import type { Workspace } from "../src/contracts/chemistry";
import type { ReactionRule } from "../src/contracts/experiment";
import { applyAction } from "../src/domain/reaction";
import { acidBaseExperiment } from "../src/content/acidBase";
import { metalAcidExperiment } from "../src/content/metalAcid";

/** A fresh workspace from an experiment's starting stations. */
function freshWorkspace(stations: Workspace["stations"]): Workspace {
  return { stations: structuredClone(stations) };
}

describe("applyAction — acid + base", () => {
  const { stations, rules, chemicals } = acidBaseExperiment;

  it("turns the indicator pink, warms the beaker, and swaps reagents for products", () => {
    const { workspace, result } = applyAction(
      freshWorkspace(stations),
      { type: "pour", reagent: "sodium-hydroxide", target: "beaker" },
      rules,
      chemicals,
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
      chemicals,
    );
    expect(result.visibleChange).toBe(false);
    expect(result.newColor).toBeUndefined();
    expect(result.observation).toMatch(/no visible change/i);
    // The poured reagent still lands in the beaker.
    expect(workspace.stations.beaker.contents).toContain("distilled-water");
  });
});

describe("applyAction — metal + acid", () => {
  const { stations, rules, chemicals } = metalAcidExperiment;

  it("produces salt and emits hydrogen as a separate emission, not in the liquid", () => {
    const { workspace, result } = applyAction(
      freshWorkspace(stations),
      { type: "pour", reagent: "zinc", target: "beaker" },
      rules,
      chemicals,
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
      chemicals,
    );
    expect(result.visibleChange).toBe(false);
    expect(result.emits).toBeUndefined();
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
    const orderedRules: ReactionRule[] = [
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
    const { stations, rules, chemicals } = acidBaseExperiment;
    const first = applyAction(
      freshWorkspace(stations),
      { type: "pour", reagent: "sodium-hydroxide", target: "beaker" },
      rules,
      chemicals,
    );
    expect(first.workspace.stations.beaker.heat).toBe("warm");

    // A second pour that matches no rule must not reset the heat.
    const second = applyAction(
      first.workspace,
      { type: "pour", reagent: "distilled-water", target: "beaker" },
      rules,
      chemicals,
    );
    expect(second.workspace.stations.beaker.heat).toBe("warm");
  });
});
