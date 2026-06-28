/**
 * Tap gating — the decision logic for the "action is the decision" flow.
 *
 * The bench is open: every tool the scenario owns is tappable on every step.
 * This module decides, purely, what a tap means *before* any transform runs:
 *
 * - If the tapped tool's action is the step's expected move, the engine runs.
 *   (For a pour, the engine still judges the *reagent*, so an in-family
 *   distractor like distilled water produces its own non-visible nudge by really
 *   pouring — that judgement is the engine's, not ours.)
 * - If the tapped tool is the wrong *family* for this step, we surface the step's
 *   authored nudge and the engine never runs, so a stray tap can't mutate or
 *   desync the bench (e.g. a `filter` rule that needs only `[sand]`, present from
 *   step one — gating is what stops it firing on the dry mixture).
 *
 * It is engine- and React-neutral: input is a step plus a tapped action type,
 * output is a plain decision. A skin wires it to state and dispatch.
 */

import type { ActionType } from "../model/actions";
import type { EntityId } from "../model/entity";
import type { Step } from "../model/scenario";

/** What a tap means: run the engine, or show a nudge and change nothing. */
export type TapOutcome =
  | { readonly kind: "perform" }
  | { readonly kind: "nudge"; readonly text: string };

/** Which tool the tray should glow once the learner has tapped a wrong one. */
export type ToolHint =
  | { readonly kind: "reagent"; readonly reagentId: EntityId }
  | { readonly kind: Exclude<ActionType, "pour" | "transfer" | "stir"> }
  | null;

/** Fallback nudges when a step hasn't authored one for the tapped action. */
const GENERIC_NUDGE: Record<ActionType, string> = {
  pour: "That doesn't move things along here. Try a different tool.",
  filter: "There's nothing to filter for this step.",
  heat: "Heating won't help with this step.",
  cool: "Cooling or waiting for it to cool is not the useful move here.",
  wait: "Waiting will not reveal the next change here.",
  shineLight: "A light test will not answer this step.",
  chromatograph: "Chromatography is not the right test for this step.",
  transfer: "That doesn't move things along here. Try a different tool.",
  stir: "That doesn't move things along here. Try a different tool.",
};

/**
 * Decide what tapping `tapped` means for `step`. A matching action runs the
 * engine; a wrong-family action returns the step's authored nudge (or a generic
 * one) and signals nothing should run.
 */
export function gateTap(step: Step, tapped: ActionType): TapOutcome {
  if (tapped === step.expect.type) return { kind: "perform" };
  return { kind: "nudge", text: step.hints?.[tapped] ?? GENERIC_NUDGE[tapped] };
}

/**
 * Which tool to highlight as the safety-net hint after a wrong tap: the expected
 * reagent bottle for a pour step, otherwise the Filter or Heat tile.
 */
export function hintTargetFor(step: Step): ToolHint {
  switch (step.expect.type) {
    case "pour":
      return step.expect.reagent
        ? { kind: "reagent", reagentId: step.expect.reagent }
        : null;
    case "filter":
      return { kind: "filter" };
    case "heat":
      return { kind: "heat" };
    case "cool":
      return { kind: "cool" };
    case "wait":
      return { kind: "wait" };
    case "shineLight":
      return { kind: "shineLight" };
    case "chromatograph":
      return { kind: "chromatograph" };
    default:
      return null;
  }
}
