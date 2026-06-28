import {
  GUIDED_LAB_APPARATUS_LABELS,
  GUIDED_LAB_REACTION_LABELS,
  type GuidedLabEffectTag,
  type StationVisual,
  type StationVisualKind,
} from "../model/guidedLabPresentation";
import type { SandboxLabReactionEffect } from "../model/sandboxLab";

export function apparatusLabel(kind: StationVisualKind): string {
  return GUIDED_LAB_APPARATUS_LABELS[kind];
}

export function reactionLabel(
  effect: GuidedLabEffectTag | SandboxLabReactionEffect,
): string {
  return (
    GUIDED_LAB_REACTION_LABELS[effect as GuidedLabEffectTag] ??
    effect
      .split("-")
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join(" ")
  );
}

export function stationVisualClasses(
  visual: StationVisual,
  phase: string,
  active: boolean,
  effectTags: readonly string[],
): string {
  return [
    "sandbox-station",
    `station-${visual.kind}`,
    `phase-${phase}`,
    active ? "active" : "",
    ...((visual.effectTags ?? []).map((tag) => `effect-${tag}`)),
    ...(active ? effectTags.map((tag) => `effect-${tag}`) : []),
  ]
    .filter(Boolean)
    .join(" ");
}
