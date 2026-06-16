/**
 * Experiment validator. Pure. Catches a malformed experiment before it reaches a
 * student — the safety net that makes "experiments are just data" viable.
 *
 * Beyond referential integrity, it is the guard that keeps the locked-but-
 * unimplemented vocabulary safe: it rejects any experiment whose rules or steps
 * use an action type or transform kind the engine has not implemented yet, so we
 * never ship data the engine cannot run.
 */

import { IMPLEMENTED_ACTIONS } from "../contracts/actions";
import {
  IMPLEMENTED_TRANSFORMS,
  type Experiment,
  type ValidationResult,
} from "../contracts/experiment";

/**
 * Validate an experiment config. Returns `{ ok, errors }` where `errors` lists
 * every problem found (validation does not stop at the first failure).
 */
export function validateExperiment(experiment: Experiment): ValidationResult {
  const errors: string[] = [];

  if (!experiment.id) errors.push("Experiment is missing an id.");
  if (!experiment.title) errors.push("Experiment is missing a title.");

  const knownIds = new Set(experiment.chemicals.map((c) => c.id));
  if (knownIds.size !== experiment.chemicals.length) {
    errors.push("Duplicate chemical ids in the chemicals list.");
  }
  const ref = (id: string, where: string) => {
    if (!knownIds.has(id)) {
      errors.push(`${where} references unknown chemical "${id}".`);
    }
  };

  if (experiment.shelf.length === 0) {
    errors.push("The reagent shelf is empty.");
  }
  for (const id of experiment.shelf) ref(id, "Shelf reagent");

  const stationIds = Object.keys(experiment.stations);
  if (stationIds.length === 0) {
    errors.push("Experiment has no stations.");
  }
  for (const [sid, station] of Object.entries(experiment.stations)) {
    for (const id of station.contents) {
      ref(id, `Station "${sid}" content`);
    }
  }

  if (experiment.rules.length === 0) {
    errors.push("Experiment has no reaction rules.");
  }
  for (const rule of experiment.rules) {
    if (!IMPLEMENTED_ACTIONS.includes(rule.on)) {
      errors.push(
        `Rule "${rule.id}" triggers on unimplemented action "${rule.on}".`,
      );
    }
    for (const id of rule.requires) ref(id, `Rule "${rule.id}" requires`);

    const t = rule.transform;
    if (!IMPLEMENTED_TRANSFORMS.includes(t.kind)) {
      errors.push(
        `Rule "${rule.id}" uses unimplemented transform "${t.kind}".`,
      );
    }
    if (t.kind === "react") {
      for (const id of t.consume) ref(id, `Rule "${rule.id}" consume`);
      for (const id of t.produce) ref(id, `Rule "${rule.id}" produce`);
      for (const id of t.emits ?? []) ref(id, `Rule "${rule.id}" emits`);
    }
  }

  if (experiment.steps.length === 0) {
    errors.push("Experiment has no steps.");
  }
  for (const step of experiment.steps) {
    const options = step.options;
    if (options.length < 2) {
      errors.push(`Step "${step.id}" needs at least two prediction options.`);
    }
    const correctCount = options.filter((o) => o.correct).length;
    if (correctCount !== 1) {
      errors.push(
        `Step "${step.id}" must have exactly one correct option (found ${correctCount}).`,
      );
    }
    if (!step.explanation) {
      errors.push(`Step "${step.id}" is missing the explanation text.`);
    }
    if (!IMPLEMENTED_ACTIONS.includes(step.expect.type)) {
      errors.push(
        `Step "${step.id}" expects an unimplemented action "${step.expect.type}".`,
      );
    }
    if (step.expect.reagent) ref(step.expect.reagent, `Step "${step.id}" expect`);
    if (step.expect.target && !experiment.stations[step.expect.target]) {
      errors.push(
        `Step "${step.id}" expects unknown station "${step.expect.target}".`,
      );
    }
  }

  return { ok: errors.length === 0, errors };
}
