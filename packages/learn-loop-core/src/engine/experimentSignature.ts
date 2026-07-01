import type {
  ExperimentRuleSet,
  ExperimentSample,
  ExperimentVisual,
} from "../model/experimentLab";
import { runExperimentStep } from "./experimentRules";

/**
 * The *visible* signature of a sample: the dramatic effect each tool produces.
 *
 * Distinguishability is computed on `visual`, not on `observationId`, on
 * purpose. The salient cause a learner reasons about is what they *see* — a
 * beam, a settling layer, residue on the paper. The designed ambiguity (a
 * colloid and a suspension both scatter light) lives at the visual level, so
 * measuring separation by visual is what makes "you must combine causes"
 * mechanically true. Each tool is applied independently to the sample's fresh
 * hidden state, mirroring how a learner probes one cause at a time.
 */
export type ExperimentSignature = Readonly<Record<string, ExperimentVisual>>;

/** Compute a sample's visible signature across the given tools. */
export function sampleSignature(
  sample: ExperimentSample,
  toolIds: readonly string[],
  ruleSet: ExperimentRuleSet,
): ExperimentSignature {
  const signature: Record<string, ExperimentVisual> = {};
  for (const toolId of toolIds) {
    signature[toolId] = runExperimentStep(
      sample.properties,
      toolId,
      ruleSet,
    ).effect.visual;
  }
  return signature;
}

/** True when two signatures differ on at least one of the given tools. */
export function distinguishable(
  a: ExperimentSignature,
  b: ExperimentSignature,
  toolIds: readonly string[],
): boolean {
  return toolIds.some((toolId) => a[toolId] !== b[toolId]);
}
