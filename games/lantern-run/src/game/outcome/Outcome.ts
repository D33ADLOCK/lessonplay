import type { OutcomeQuality } from "../../emotional/events/GameplayEvent";
import type { Target } from "../course/Course";

export interface Outcome {
  readonly quality: OutcomeQuality;
  readonly deliveryAccuracy: number;
  readonly distanceFromTarget: number;
}

export function classifyOutcome(
  stopPosition: number,
  target: Target,
  courseLength: number,
): Outcome {
  const delta = stopPosition - target.center;
  const distance = Math.abs(delta);
  const nearMissRadius = target.radius * 1.8;
  let quality: OutcomeQuality;

  if (stopPosition < 0 || stopPosition > courseLength) quality = "crash";
  else if (distance <= target.perfectRadius) quality = "perfect";
  else if (distance <= target.radius) quality = "success";
  else if (distance <= nearMissRadius) quality = "nearMiss";
  else quality = delta < 0 ? "undershoot" : "overshoot";

  return {
    quality,
    distanceFromTarget: distance,
    deliveryAccuracy: Math.max(0, 1 - distance / Math.max(target.radius * 3, 1)),
  };
}

export function predictionAccuracy(
  predicted: number,
  actual: number,
  courseLength: number,
): number {
  return Math.max(0, 1 - Math.abs(actual - predicted) / Math.max(courseLength * 0.35, 1));
}
