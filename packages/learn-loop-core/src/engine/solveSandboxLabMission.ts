import type {
  SandboxLabInteraction,
  SandboxLabMission,
  SandboxLabStage,
  SandboxLabConclusion,
} from "../model/sandboxLab";

/**
 * Result of a deterministic solvability check on a SandboxLab mission.
 *
 * `solvable` is true only when a real player, using the exact runtime rules,
 * can clear every stage in order and then unlock at least one *correct*
 * conclusion. `errors` accumulates every reachability problem found, named so
 * that the generating agent (or a human author) can fix the scenario precisely.
 */
export interface SandboxLabSolveResult {
  readonly solvable: boolean;
  readonly errors: string[];
}

/**
 * Prove (or disprove) that a SandboxLab mission has a winning path.
 *
 * This mirrors the runtime session reducer (`sandboxLabSession.ts`) exactly:
 *
 * - Stages clear in order; the player cannot reach stage *N+1* until stage *N*'s
 *   `requiredEvidence` is fully collected.
 * - An interaction's evidence is collectable only when that interaction's
 *   material **and** tool are both visible in a stage the player has reached.
 * - Collected evidence accumulates across stages and is never lost.
 * - Within a reached stage the player can perform every available interaction,
 *   so all evidence from interactions visible at that stage is obtainable.
 * - A conclusion unlocks only when every stage's `requiredEvidence` is collected
 *   **and** that conclusion's own `requiresEvidence` is collected.
 * - The mission is solvable iff every stage clears in order and at least one
 *   correct conclusion is then unlockable.
 *
 * It performs no I/O and depends only on the mission model, so it is a deep,
 * deterministic, easily-tested module. It assumes structurally valid input (run
 * {@link validateSandboxLabMission} to enforce that first) but degrades to plain
 * "cannot be produced" errors when references are missing rather than throwing.
 */
export function solveSandboxLabMission(
  mission: SandboxLabMission,
): SandboxLabSolveResult {
  const { stages, interactions, conclusions } = mission.presentation;
  const errors: string[] = [];

  const producersByEvidence = new Map<string, SandboxLabInteraction[]>();
  for (const interaction of interactions) {
    const existing = producersByEvidence.get(interaction.evidenceId);
    if (existing) {
      existing.push(interaction);
    } else {
      producersByEvidence.set(interaction.evidenceId, [interaction]);
    }
  }

  // Walk stages in order, accumulating the evidence a player can collect along
  // the winning path. A stage that cannot clear blocks every later stage.
  const collected = new Set<string>();
  let blocked = false;

  for (const stage of stages) {
    const visibleMaterials = new Set(stage.materialIds);
    const visibleTools = new Set(stage.toolIds);

    for (const interaction of interactions) {
      if (
        visibleMaterials.has(interaction.materialId) &&
        visibleTools.has(interaction.toolId)
      ) {
        collected.add(interaction.evidenceId);
      }
    }

    const missing = stage.requiredEvidence.filter((id) => !collected.has(id));
    if (missing.length > 0) {
      for (const evidenceId of missing) {
        errors.push(
          describeUnreachableStageEvidence(
            stage,
            evidenceId,
            producersByEvidence,
          ),
        );
      }
      // The player is permanently stuck here, so later stages are unreachable.
      blocked = true;
      break;
    }
  }

  if (blocked) {
    return { solvable: false, errors };
  }

  // Every stage cleared, so `collected` now holds all reachable evidence.
  const correctConclusions = conclusions.filter(
    (conclusion) => conclusion.correct,
  );
  let anyCorrectReachable = false;

  for (const conclusion of correctConclusions) {
    const missing = conclusion.requiresEvidence.filter(
      (id) => !collected.has(id),
    );
    if (missing.length === 0) {
      anyCorrectReachable = true;
    } else {
      for (const evidenceId of missing) {
        errors.push(
          describeUnreachableConclusionEvidence(
            conclusion,
            evidenceId,
            producersByEvidence,
          ),
        );
      }
    }
  }

  if (correctConclusions.length > 0 && !anyCorrectReachable) {
    errors.push(
      "no correct conclusion is reachable: every stage can be cleared, but no correct conclusion's required evidence can be fully collected",
    );
  }

  return { solvable: errors.length === 0, errors };
}

function describeProducers(
  producers: readonly SandboxLabInteraction[] | undefined,
): string | null {
  if (!producers || producers.length === 0) {
    return null;
  }
  return producers
    .map(
      (interaction) =>
        `interaction "${interaction.id}" (material "${interaction.materialId}" + tool "${interaction.toolId}")`,
    )
    .join(", ");
}

function describeUnreachableStageEvidence(
  stage: SandboxLabStage,
  evidenceId: string,
  producersByEvidence: Map<string, SandboxLabInteraction[]>,
): string {
  const producers = describeProducers(producersByEvidence.get(evidenceId));
  if (!producers) {
    return `stage "${stage.id}" requires evidence "${evidenceId}" but no interaction produces it`;
  }
  return `stage "${stage.id}" requires evidence "${evidenceId}" but the player cannot collect it before this stage must clear: it is only produced by ${producers}, whose material and tool are never both visible in this stage or an earlier one`;
}

function describeUnreachableConclusionEvidence(
  conclusion: SandboxLabConclusion,
  evidenceId: string,
  producersByEvidence: Map<string, SandboxLabInteraction[]>,
): string {
  const producers = describeProducers(producersByEvidence.get(evidenceId));
  if (!producers) {
    return `correct conclusion "${conclusion.id}" requires evidence "${evidenceId}" but no interaction produces it`;
  }
  return `correct conclusion "${conclusion.id}" requires evidence "${evidenceId}" that can never be collected: it is only produced by ${producers}, whose material and tool are never both visible in any reachable stage`;
}
