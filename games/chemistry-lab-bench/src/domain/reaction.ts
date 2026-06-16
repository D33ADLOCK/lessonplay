/**
 * The reaction engine. Pure and rendering-free.
 *
 * Pattern adapted to TypeScript from the MIT-licensed nsriram/chem_lab (see
 * NOTICE): iterate a declarative, first-match-wins rule registry; the first rule
 * whose `requires` set is satisfied by the vessel (after the action is applied)
 * produces the result. Simplified for NCERT Class 9 — matching is on chemical
 * *presence* (sets), not volumes.
 */

import type { Action, ReactionResult, Vessel } from "../contracts/chemistry";
import type { ReactionRule } from "../contracts/experiment";

const EMPTY_VESSEL: ReactionResult = {
  observation: "The beaker is empty.",
  visibleChange: false,
};

/** Builds the "nothing visibly happened, try another reagent" nudge. */
function noVisibleReaction(): ReactionResult {
  return {
    observation: "No visible change. Try a different reagent.",
    visibleChange: false,
  };
}

/** The contents of the vessel after the action is applied. */
function contentsAfter(vessel: Vessel, action: Action): readonly string[] {
  if (action.type === "pour" && !vessel.contents.includes(action.reagent)) {
    return [...vessel.contents, action.reagent];
  }
  return vessel.contents;
}

function ruleMatches(
  rule: ReactionRule,
  contents: readonly string[],
  action: Action,
): boolean {
  if (rule.actionType && rule.actionType !== action.type) return false;
  return rule.requires.every((id) => contents.includes(id));
}

/**
 * Resolve `action` against `vessel` using `rules`. Returns the first matching
 * rule's result, or an explicit fallback (empty vessel / no visible reaction).
 */
export function simulateReaction(
  vessel: Vessel,
  action: Action,
  rules: readonly ReactionRule[],
): ReactionResult {
  const contents = contentsAfter(vessel, action);

  for (const rule of rules) {
    if (ruleMatches(rule, contents, action)) {
      return rule.produce;
    }
  }

  // No rule fired. If the beaker started empty there was nothing to react
  // with; otherwise the added reagent simply caused no visible change.
  return vessel.contents.length === 0 ? EMPTY_VESSEL : noVisibleReaction();
}
