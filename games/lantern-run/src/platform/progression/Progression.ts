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
