import { describe, expect, it } from "vitest";
import {
  matchesWhen,
  runExperimentStep,
  runExperimentSequence,
} from "../src/engine/experimentRules";
import type {
  ExperimentRuleSet,
  ExperimentSample,
} from "../src/model/experimentLab";
import { particleExperiment } from "./fixtures/experimentParticles";

const { ruleSet, samples } = particleExperiment;

function sample(id: string): ExperimentSample {
  const found = samples.find((s) => s.id === id);
  if (!found) throw new Error(`No fixture sample "${id}"`);
  return found;
}

describe("matchesWhen", () => {
  it("matches when every constraint is satisfied", () => {
    expect(matchesWhen({ particleSize: "fine", settled: "no" }, { particleSize: "fine" })).toBe(true);
  });

  it("fails when any constraint differs", () => {
    expect(matchesWhen({ particleSize: "tiny" }, { particleSize: "fine" })).toBe(false);
  });

  it("treats an empty constraint set as a match", () => {
    expect(matchesWhen({ particleSize: "coarse" }, {})).toBe(true);
  });
});

describe("runExperimentStep — the particle physics table", () => {
  const cases: Array<[string, string, string, string]> = [
    // sampleId, toolId, expected observationId, expected visual
    ["unknown-a", "light", "light-no-beam", "none"],
    ["unknown-a", "settle", "settle-none-clear", "none"],
    ["unknown-a", "filter", "filter-passes-clear", "none"],
    ["unknown-b", "light", "light-beam-gritty", "beam"],
    ["unknown-b", "settle", "settle-layer", "settle"],
    ["unknown-b", "filter", "filter-residue", "residue"],
    ["unknown-c", "light", "light-beam-clean", "beam"],
    ["unknown-c", "settle", "settle-none-cloudy", "none"],
    ["unknown-c", "filter", "filter-passes-cloudy", "none"],
    ["control", "light", "light-no-beam", "none"],
  ];

  it.each(cases)(
    "%s + %s -> %s (%s)",
    (sampleId, toolId, observationId, visual) => {
      const result = runExperimentStep(sample(sampleId).properties, toolId, ruleSet);
      expect(result.effect.observationId).toBe(observationId);
      expect(result.effect.visual).toBe(visual);
      expect(result.matched).toBe(true);
    },
  );
});

describe("runExperimentStep — determinism and consistency", () => {
  it("is deterministic: identical inputs give identical results", () => {
    const a = runExperimentStep(sample("unknown-c").properties, "light", ruleSet);
    const b = runExperimentStep(sample("unknown-c").properties, "light", ruleSet);
    expect(a).toEqual(b);
  });

  it("is consistent: samples with the same property react identically", () => {
    // The control and Unknown A are both `tiny`; the engine must not care which.
    const control = runExperimentStep(sample("control").properties, "light", ruleSet);
    const solution = runExperimentStep(sample("unknown-a").properties, "light", ruleSet);
    expect(control.effect).toEqual(solution.effect);
  });

  it("does not mutate the input state", () => {
    const before = sample("unknown-b").properties;
    const snapshot = { ...before };
    runExperimentStep(before, "settle", ruleSet);
    expect(before).toEqual(snapshot);
  });
});

describe("runExperimentStep — the designed ambiguity", () => {
  it("light shows a beam for BOTH colloid and suspension, so it cannot separate them", () => {
    const colloid = runExperimentStep(sample("unknown-c").properties, "light", ruleSet);
    const suspension = runExperimentStep(sample("unknown-b").properties, "light", ruleSet);
    expect(colloid.effect.visual).toBe("beam");
    expect(suspension.effect.visual).toBe("beam");
    // ...yet a second cause (settling) splits them apart.
    const colloidSettle = runExperimentStep(sample("unknown-c").properties, "settle", ruleSet);
    const suspensionSettle = runExperimentStep(sample("unknown-b").properties, "settle", ruleSet);
    expect(colloidSettle.effect.visual).toBe("none");
    expect(suspensionSettle.effect.visual).toBe("settle");
  });
});

describe("runExperimentStep — first-match-wins and fallback", () => {
  it("returns the default effect when no rule matches the tool", () => {
    const result = runExperimentStep(sample("unknown-a").properties, "stir", ruleSet);
    expect(result.matched).toBe(false);
    expect(result.effect).toBe(ruleSet.defaultEffect);
  });

  it("returns the default effect when the tool matches but no property rule does", () => {
    const result = runExperimentStep({ particleSize: "gigantic" }, "light", ruleSet);
    expect(result.matched).toBe(false);
    expect(result.effect.observationId).toBe("no-change");
  });

  it("honours rule order: an earlier matching rule wins", () => {
    const ordered: ExperimentRuleSet = {
      defaultEffect: ruleSet.defaultEffect,
      rules: [
        {
          toolId: "light",
          when: {},
          effect: { observationId: "first", observation: "first", visual: "beam" },
        },
        {
          toolId: "light",
          when: { particleSize: "tiny" },
          effect: { observationId: "second", observation: "second", visual: "none" },
        },
      ],
    };
    const result = runExperimentStep({ particleSize: "tiny" }, "light", ordered);
    expect(result.effect.observationId).toBe("first");
  });
});

describe("runExperimentSequence — state threads through steps", () => {
  it("applies setState so later steps see the evolved state", () => {
    const { results, finalState } = runExperimentSequence(
      sample("unknown-b").properties,
      ["settle", "filter"],
      ruleSet,
    );
    expect(results[0].effect.observationId).toBe("settle-layer");
    expect(results[0].nextState.settled).toBe("yes");
    // The suspension still filters to residue after settling.
    expect(results[1].effect.observationId).toBe("filter-residue");
    expect(finalState.settled).toBe("yes");
    expect(finalState.particleSize).toBe("coarse");
  });
});
