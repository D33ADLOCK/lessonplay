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

/** Placeholder composer; Slice 3 (#13) replaces with surface-aware copy. */
export const defaultFeedbackComposer: FeedbackComposer = (ctx) => ({
  message: `The cart came to rest on the ${ctx.surfaceName}.`,
  predictionError: ctx.actual - ctx.predicted,
});
