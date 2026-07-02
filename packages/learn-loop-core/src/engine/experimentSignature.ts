import type {
  ExperimentEffect,
  ExperimentRuleSet,
  ExperimentSample,
} from "../model/experimentLab";
import { runExperimentStep } from "./experimentRules";

/**
 * The *visible* signature of a sample: the distinguishing evidence each tool
 * produces.
 *
 * Distinguishability is computed on what a learner can actually tell apart, not
 * on `observationId`, on purpose. The salient cause a learner reasons about is
 * what they *see and read off* — a beam, a settling layer, a bulb that lights,
 * the specific colour a strip turns. The designed ambiguity (a colloid and a
 * suspension both scatter light) lives at this evidence level, so measuring
 * separation by evidence is what makes "you must combine causes" mechanically
 * true. Each tool is applied independently to the sample's fresh hidden state,
 * mirroring how a learner probes one cause at a time.
 *
 * Evidence is the {@link ExperimentVisual} plus any discriminating detail the
 * effect carries — a {@link ExperimentReadout} (colour, pH value, bulb state,
 * temperature, odour) or a `gasLabel`. Two effects with the same `visual` but a
 * different readout `value` (red vs blue litmus, bulb on vs off) are therefore
 * distinguishable, which is exactly why readouts are structured data.
 */
export type ExperimentSignature = Readonly<Record<string, string>>;

/**
 * The evidence token for one effect: the visual plus any discriminating detail
 * (gas label, structured readout). This is the single definition of "what a
 * learner can tell apart", shared by the signature here and the stateful
 * signature in the analyzer, so both measure distinguishability identically.
 */
export function effectEvidenceToken(effect: ExperimentEffect): string {
  const parts: string[] = [effect.visual];
  if (effect.gasLabel) {
    parts.push(`gas=${effect.gasLabel}`);
  }
  if (effect.readout) {
    parts.push(`${effect.readout.kind}=${effect.readout.value}`);
  }
  return parts.join("|");
}

/** Compute a sample's visible signature across the given tools. */
export function sampleSignature(
  sample: ExperimentSample,
  toolIds: readonly string[],
  ruleSet: ExperimentRuleSet,
): ExperimentSignature {
  const signature: Record<string, string> = {};
  for (const toolId of toolIds) {
    signature[toolId] = effectEvidenceToken(
      runExperimentStep(sample.properties, toolId, ruleSet).effect,
    );
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
