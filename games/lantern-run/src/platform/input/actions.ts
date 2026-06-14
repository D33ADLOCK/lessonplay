/**
 * Semantic input actions.
 *
 * Every physical input (touch, pointer, keyboard) maps onto exactly these
 * semantic actions. Game code only ever reacts to semantic actions, never to
 * raw device events — this is the contract that lets the same slice play on a
 * phone, a trackpad, and a keyboard (PRD user stories 17, 18, 23).
 *
 * Slice 1 fixes the vocabulary; Slice 2 (#12) implements the device adapters.
 */
export type SemanticAction =
  | "aim" // move the prediction marker / aim point
  | "chargeStart" // begin selecting push strength
  | "chargeChange" // adjust push strength
  | "launch" // commit and fire the lantern cart
  | "retry" // reset and try again
  | "pause" // open the pause control
  | "confirm" // accept a dialog / advance a beat
  | "cancel"; // dismiss a dialog

/** A normalized action event, decoupled from the device that produced it. */
export interface SemanticActionEvent {
  readonly action: SemanticAction;
  /**
   * Optional continuous magnitude in [0, 1] for analog actions such as
   * `aim` (position along the course) or `chargeChange` (push strength).
   */
  readonly value?: number;
  /** Optional 2D position in playfield-normalized coordinates [0, 1]. */
  readonly point?: { readonly x: number; readonly y: number };
  /** Which device family produced the action (for analytics/debug only). */
  readonly source: InputSource;
}

export type InputSource = "touch" | "pointer" | "keyboard";

export type SemanticActionListener = (event: SemanticActionEvent) => void;
