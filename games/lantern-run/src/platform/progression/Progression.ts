/**
 * Progression, scoring, stars and personal bests (contracts).
 *
 * Scoring derives from caused outcomes — prediction accuracy, delivery
 * accuracy, optional goals and efficient completion — never from input volume
 * or speed (PRD "Meaningful choices"). Slice 1 fixes the shapes; Slice 4 (#14)
 * implements the scoring math, star thresholds and PB updates with unit tests.
 */
export interface LevelResult {
  readonly levelId: string;
  /** Spatial accuracy of the player's prediction, 0..1 (1 = exact). */
  readonly predictionAccuracy: number;
  /** Spatial accuracy of the delivery vs. the target, 0..1 (1 = perfect). */
  readonly deliveryAccuracy: number;
  /** Whether the optional mastery objective was met. */
  readonly optionalGoalMet: boolean;
  /** Attempts taken; fewer is more efficient. */
  readonly attempts: number;
}

export interface ScoredResult extends LevelResult {
  readonly score: number;
  readonly stars: 0 | 1 | 2 | 3;
}

export interface PersonalBest {
  readonly levelId: string;
  readonly bestScore: number;
  readonly bestStars: 0 | 1 | 2 | 3;
}

/** Compute score + stars from a level result. Stub — real model in Slice 4. */
export type Scorer = (result: LevelResult) => ScoredResult;

export function scoreResult(
  result: LevelResult,
  thresholds: readonly [number, number, number],
  routeBonus = 0,
): ScoredResult {
  const prediction = Math.round(clamp01(result.predictionAccuracy) * 300);
  const delivery = Math.round(clamp01(result.deliveryAccuracy) * 500);
  const optional = result.optionalGoalMet ? 150 : 0;
  const efficiency = Math.max(0, 150 - Math.max(0, result.attempts - 1) * 35);
  const score = Math.min(1000, prediction + delivery + optional + efficiency + routeBonus);
  const stars = score >= thresholds[2] ? 3 : score >= thresholds[1] ? 2 : score >= thresholds[0] ? 1 : 0;
  return { ...result, score, stars };
}

/** Merge a fresh scored result into the existing personal best. */
export function updatePersonalBest(
  current: PersonalBest | undefined,
  scored: ScoredResult,
): PersonalBest {
  return {
    levelId: scored.levelId,
    bestScore: Math.max(current?.bestScore ?? 0, scored.score),
    bestStars: Math.max(current?.bestStars ?? 0, scored.stars) as 0 | 1 | 2 | 3,
  };
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
