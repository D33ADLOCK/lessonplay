import type {
  ExperimentEffect,
  ExperimentRule,
  ExperimentRuleSet,
  ExperimentSampleState,
} from "../model/experimentLab";

/**
 * The deterministic cause → effect engine for ExperimentLab.
 *
 * It is pure and depends only on the model: given a sample's current state, a
 * tool id, and a {@link ExperimentRuleSet}, it returns the visible effect and
 * the sample's next state. The same inputs always produce the same output, so a
 * learner probing the system sees a *consistent* world they can reason about —
 * the property the whole experiment loop rests on.
 *
 * Rules are evaluated first-match-wins (mirroring the SandboxLab/`Scenario`
 * rule engine), so authors order specific rules before general ones. When no
 * rule matches, the rule set's `defaultEffect` fires and state is unchanged.
 */

/** Result of applying one tool to one sample: what is seen and the new state. */
export interface ExperimentStepResult {
  readonly effect: ExperimentEffect;
  readonly nextState: ExperimentSampleState;
  /** True when a declared rule matched; false when the default fallback fired. */
  readonly matched: boolean;
}

/** True when every constraint in `when` is satisfied by the sample `state`. */
export function matchesWhen(
  state: ExperimentSampleState,
  when: ExperimentSampleState,
): boolean {
  for (const key of Object.keys(when)) {
    if (state[key] !== when[key]) {
      return false;
    }
  }
  return true;
}

/** Find the first rule for `toolId` whose `when` matches `state`, if any. */
function firstMatchingRule(
  state: ExperimentSampleState,
  toolId: string,
  ruleSet: ExperimentRuleSet,
): ExperimentRule | undefined {
  return ruleSet.rules.find(
    (rule) => rule.toolId === toolId && matchesWhen(state, rule.when),
  );
}

/**
 * Apply one tool to a sample's current state. Returns the visible effect and
 * the next state (the prior state with the effect's `setState` merged in).
 */
export function runExperimentStep(
  state: ExperimentSampleState,
  toolId: string,
  ruleSet: ExperimentRuleSet,
): ExperimentStepResult {
  const rule = firstMatchingRule(state, toolId, ruleSet);
  const effect = rule ? rule.effect : ruleSet.defaultEffect;
  const nextState = effect.setState
    ? { ...state, ...effect.setState }
    : state;
  return { effect, nextState, matched: rule !== undefined };
}

/**
 * Apply an ordered sequence of tools to one starting state, threading the
 * evolving state through each step. Useful for the solver and for tests that
 * exercise effects which depend on a prior cause.
 */
export function runExperimentSequence(
  initialState: ExperimentSampleState,
  toolIds: readonly string[],
  ruleSet: ExperimentRuleSet,
): {
  readonly results: readonly ExperimentStepResult[];
  readonly finalState: ExperimentSampleState;
} {
  const results: ExperimentStepResult[] = [];
  let state = initialState;
  for (const toolId of toolIds) {
    const result = runExperimentStep(state, toolId, ruleSet);
    results.push(result);
    state = result.nextState;
  }
  return { results, finalState: state };
}
