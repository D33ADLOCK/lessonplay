/**
 * Experiment validator. Pure. Catches a malformed experiment before it reaches a
 * student — the safety net that makes "experiments are just data" viable.
 */

import type { Experiment, ValidationResult } from "../contracts/experiment";

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

  if (experiment.shelf.length === 0) {
    errors.push("The reagent shelf is empty.");
  }
  for (const id of experiment.shelf) {
    if (!knownIds.has(id)) {
      errors.push(`Shelf reagent "${id}" is not in the chemicals list.`);
    }
  }

  for (const id of experiment.beaker.contents) {
    if (!knownIds.has(id)) {
      errors.push(`Beaker content "${id}" is not in the chemicals list.`);
    }
  }

  if (experiment.rules.length === 0) {
    errors.push("Experiment has no reaction rules.");
  }
  for (const rule of experiment.rules) {
    for (const id of rule.requires) {
      if (!knownIds.has(id)) {
        errors.push(
          `Rule "${rule.id}" requires unknown chemical "${id}".`,
        );
      }
    }
  }

  const options = experiment.task.options;
  if (options.length < 2) {
    errors.push("Prediction needs at least two options.");
  }
  const correctCount = options.filter((o) => o.correct).length;
  if (correctCount !== 1) {
    errors.push(
      `Prediction must have exactly one correct option (found ${correctCount}).`,
    );
  }
  if (!experiment.task.explanation) {
    errors.push("Task is missing the explanation text.");
  }

  return { ok: errors.length === 0, errors };
}
