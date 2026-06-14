import type { OutcomeQuality } from "../events/GameplayEvent";

/**
 * Celebration intensity (contract).
 *
 * Celebration scales with result quality so skill feels satisfying (PRD user
 * story 12: "precise deliveries create stronger celebrations"). Returns a tier
 * the presentation layer (Slice 6 / #16) maps to particles, light bloom and
 * music swell. Pure function — unit-tested in Slice 5 (#15).
 */
export type CelebrationTier = "none" | "small" | "medium" | "large" | "grand";

export function celebrationFor(quality: OutcomeQuality): CelebrationTier {
  switch (quality) {
    case "perfect":
      return "grand";
    case "success":
      return "large";
    case "nearMiss":
      return "small";
    case "undershoot":
    case "overshoot":
    case "crash":
      return "none";
  }
}

/** Numeric 0..1 intensity, useful for blending continuous effects. */
export function celebrationIntensity(quality: OutcomeQuality): number {
  const tier = celebrationFor(quality);
  const scale: Record<CelebrationTier, number> = {
    none: 0,
    small: 0.3,
    medium: 0.55,
    large: 0.8,
    grand: 1,
  };
  return scale[tier];
}
