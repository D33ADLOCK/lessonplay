import { describe, expect, it } from "vitest";
import { solveSandboxLabMission } from "../src";
import type {
  SandboxLabInteraction,
  SandboxLabMission,
  SandboxLabMissionPresentation,
} from "../src";
import { sandboxSaltSandMission } from "./fixtures/sandboxMixtures";
import { sandboxIndicatorMission } from "./fixtures/sandboxIndicator";

/** Build a mission whose presentation is the fixture's with a few overrides. */
function withPresentation(
  mission: SandboxLabMission,
  overrides: Partial<SandboxLabMissionPresentation>,
): SandboxLabMission {
  return {
    ...mission,
    presentation: { ...mission.presentation, ...overrides },
  };
}

describe("solveSandboxLabMission", () => {
  it("accepts a known-good multi-stage mission", () => {
    expect(solveSandboxLabMission(sandboxSaltSandMission)).toEqual({
      solvable: true,
      errors: [],
    });
  });

  it("accepts a known-good single-stage investigation", () => {
    expect(solveSandboxLabMission(sandboxIndicatorMission)).toEqual({
      solvable: true,
      errors: [],
    });
  });

  it("rejects a stage whose required evidence needs a tool that stage never shows", () => {
    // The "recover" stage needs `salt-crystals` from filtrate + heat, but we
    // swap its tool to `filter`, so the heating interaction is never reachable.
    const broken = withPresentation(sandboxSaltSandMission, {
      stages: sandboxSaltSandMission.presentation.stages.map((stage) =>
        stage.id === "recover" ? { ...stage, toolIds: ["filter"] } : stage,
      ),
    });

    const result = solveSandboxLabMission(broken);

    expect(result.solvable).toBe(false);
    expect(result.errors).toContain(
      'stage "recover" requires evidence "salt-crystals" but the player cannot collect it before this stage must clear: it is only produced by interaction "water-vapour" (material "filtrate" + tool "heat"), whose material and tool are never both visible in this stage or an earlier one',
    );
  });

  it("rejects a stage whose required evidence needs a material that stage never shows", () => {
    // The "recover" stage needs the `filtrate` material, but we swap it for the
    // `mixture` material, so the heating interaction can never be performed.
    const broken = withPresentation(sandboxSaltSandMission, {
      stages: sandboxSaltSandMission.presentation.stages.map((stage) =>
        stage.id === "recover" ? { ...stage, materialIds: ["mixture"] } : stage,
      ),
    });

    const result = solveSandboxLabMission(broken);

    expect(result.solvable).toBe(false);
    expect(result.errors).toContain(
      'stage "recover" requires evidence "salt-crystals" but the player cannot collect it before this stage must clear: it is only produced by interaction "water-vapour" (material "filtrate" + tool "heat"), whose material and tool are never both visible in this stage or an earlier one',
    );
  });

  it("stops the playthrough at the first blocked stage so later stages are not reported", () => {
    // Block the very first stage by hiding the only tool that dissolves salt.
    const broken = withPresentation(sandboxSaltSandMission, {
      stages: sandboxSaltSandMission.presentation.stages.map((stage) =>
        stage.id === "dissolve" ? { ...stage, toolIds: ["wait"] } : stage,
      ),
    });

    const result = solveSandboxLabMission(broken);

    expect(result.solvable).toBe(false);
    expect(result.errors).toEqual([
      'stage "dissolve" requires evidence "salt-dissolved" but the player cannot collect it before this stage must clear: it is only produced by interaction "dissolve" (material "mixture" + tool "add-water"), whose material and tool are never both visible in this stage or an earlier one',
    ]);
  });

  it("rejects a correct conclusion whose required evidence can never be collected", () => {
    // Every stage still clears, but the correct conclusion now also demands an
    // evidence whose only producer (filtrate + wait) is never co-visible.
    const hiddenInteraction: SandboxLabInteraction = {
      id: "idle-filtrate",
      materialId: "filtrate",
      toolId: "wait",
      evidenceId: "filtrate-idle",
      feedbackCard: {
        action: "You waited on the filtrate.",
        result: "Nothing useful happens.",
        why: "Waiting does not change the filtrate.",
        next: "Use heat instead.",
        notebook: "Waiting on the filtrate gave no new evidence.",
      },
      soundCue: "wait",
      reactionEffect: "settle",
    };
    const broken = withPresentation(sandboxSaltSandMission, {
      interactions: [
        ...sandboxSaltSandMission.presentation.interactions,
        hiddenInteraction,
      ],
      conclusions: sandboxSaltSandMission.presentation.conclusions.map(
        (conclusion) =>
          conclusion.correct
            ? {
                ...conclusion,
                requiresEvidence: [
                  ...conclusion.requiresEvidence,
                  "filtrate-idle",
                ],
              }
            : conclusion,
      ),
    });

    const result = solveSandboxLabMission(broken);

    expect(result.solvable).toBe(false);
    expect(result.errors).toContain(
      'correct conclusion "correct" requires evidence "filtrate-idle" that can never be collected: it is only produced by interaction "idle-filtrate" (material "filtrate" + tool "wait"), whose material and tool are never both visible in any reachable stage',
    );
  });

  it("rejects a mission whose only correct conclusion is unreachable", () => {
    // The correct conclusion requires an evidence id that nothing produces,
    // while an incorrect conclusion stays reachable.
    const broken = withPresentation(sandboxIndicatorMission, {
      conclusions: sandboxIndicatorMission.presentation.conclusions.map(
        (conclusion) =>
          conclusion.correct
            ? { ...conclusion, requiresEvidence: ["never-produced"] }
            : conclusion,
      ),
    });

    const result = solveSandboxLabMission(broken);

    expect(result.solvable).toBe(false);
    expect(result.errors).toContain(
      'correct conclusion "acid" requires evidence "never-produced" but no interaction produces it',
    );
    expect(result.errors).toContain(
      "no correct conclusion is reachable: every stage can be cleared, but no correct conclusion's required evidence can be fully collected",
    );
  });

  it("reports every unreachable conclusion evidence, not just the first", () => {
    const broken = withPresentation(sandboxIndicatorMission, {
      conclusions: sandboxIndicatorMission.presentation.conclusions.map(
        (conclusion) =>
          conclusion.correct
            ? {
                ...conclusion,
                requiresEvidence: ["never-a", "never-b"],
              }
            : conclusion,
      ),
    });

    const result = solveSandboxLabMission(broken);

    expect(result.solvable).toBe(false);
    expect(result.errors).toContain(
      'correct conclusion "acid" requires evidence "never-a" but no interaction produces it',
    );
    expect(result.errors).toContain(
      'correct conclusion "acid" requires evidence "never-b" but no interaction produces it',
    );
  });
});
