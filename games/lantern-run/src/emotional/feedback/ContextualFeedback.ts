import type { OutcomeQuality } from "../events/GameplayEvent";

/**
 * Contextual feedback (contract).
 *
 * After a launch, feedback references the event that just happened and compares
 * the player's prediction with the actual outcome — never a quiz (PRD "Learning
 * Design"). Messages stay concise and optional. The real surface-aware copy and
 * the prediction-vs-result comparison land in Slice 3 (#13).
 */
export interface FeedbackContext {
  readonly quality: OutcomeQuality;
  /** Predicted stop position, normalized [0, 1]. */
  readonly predicted: number;
  /** Actual stop position, normalized [0, 1]. */
  readonly actual: number;
  /** Human-readable name of the dominant surface, e.g. "ice", "wood". */
  readonly surfaceName: string;
}

export interface Feedback {
  /** Short, contextual sentence shown to the player (optional to display). */
  readonly message: string;
  /** Signed prediction error (actual - predicted) in normalized units. */
  readonly predictionError: number;
}

export type FeedbackComposer = (ctx: FeedbackContext) => Feedback;

export const defaultFeedbackComposer: FeedbackComposer = (ctx) => ({
  message: feedbackMessage(ctx),
  predictionError: ctx.actual - ctx.predicted,
});

function feedbackMessage(ctx: FeedbackContext): string {
  const prediction =
    Math.abs(ctx.actual - ctx.predicted) < 0.04
      ? "Your prediction was close."
      : ctx.actual > ctx.predicted
        ? "It travelled farther than your marker."
        : "It stopped before your marker.";

  switch (ctx.quality) {
    case "perfect":
      return `Perfect delivery on ${ctx.surfaceName}. ${prediction}`;
    case "success":
      return `The lantern arrived safely. ${prediction}`;
    case "nearMiss":
      return `So close! The ${ctx.surfaceName} changed its stopping distance.`;
    case "undershoot":
      return `The ${ctx.surfaceName} slowed it early. Try a stronger push.`;
    case "overshoot":
      return `It kept moving across ${ctx.surfaceName}. Try a gentler push.`;
    case "crash":
      return `A dramatic landing! Reduce the push and predict again.`;
  }
}
