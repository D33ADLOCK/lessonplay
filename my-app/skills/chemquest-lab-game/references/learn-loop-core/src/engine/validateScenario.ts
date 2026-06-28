/**
 * Scenario validator. Pure. Catches a malformed scenario before it reaches a
 * learner — the safety net that makes "scenarios are just data" viable.
 *
 * Beyond referential integrity, it is the guard that keeps the locked-but-
 * unimplemented vocabulary safe: it rejects any scenario whose rules or steps
 * use an action type or transform kind the engine has not implemented yet, so we
 * never ship data the engine cannot run.
 */

import { IMPLEMENTED_ACTIONS } from "../model/actions";
import {
  IMPLEMENTED_TRANSFORMS,
  type Scenario,
  type ValidationResult,
} from "../model/scenario";

/**
 * Validate a scenario config. Returns `{ ok, errors }` where `errors` lists
 * every problem found (validation does not stop at the first failure).
 */
export function validateScenario(scenario: Scenario): ValidationResult {
  const errors: string[] = [];

  if (!scenario.id) errors.push("Scenario is missing an id.");
  if (!scenario.title) errors.push("Scenario is missing a title.");

  const knownIds = new Set(scenario.entities.map((e) => e.id));
  if (knownIds.size !== scenario.entities.length) {
    errors.push("Duplicate entity ids in the entities list.");
  }
  const ref = (id: string, where: string) => {
    if (!knownIds.has(id)) {
      errors.push(`${where} references unknown entity "${id}".`);
    }
  };

  const stationIds = Object.keys(scenario.stations);
  const knownStations = new Set(stationIds);
  const refStation = (id: string, where: string) => {
    if (!knownStations.has(id)) {
      errors.push(`${where} references unknown station "${id}".`);
    }
  };

  // A tray may legitimately be empty for a pure filter/heat scenario; it is
  // only an error when a step actually asks the learner to pour.
  const shelf = new Set(scenario.shelf);
  const hasPourStep = scenario.steps.some((s) => s.expect.type === "pour");
  if (scenario.shelf.length === 0 && hasPourStep) {
    errors.push("A step expects a pour but the reagent shelf is empty.");
  }
  for (const id of scenario.shelf) ref(id, "Shelf reagent");

  if (stationIds.length === 0) {
    errors.push("Scenario has no stations.");
  }
  for (const [sid, station] of Object.entries(scenario.stations)) {
    for (const id of station.contents) {
      ref(id, `Station "${sid}" content`);
    }
  }

  if (scenario.rules.length === 0) {
    errors.push("Scenario has no rules.");
  }
  for (const rule of scenario.rules) {
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
    if (t.kind === "split") {
      refStation(t.solidTo, `Rule "${rule.id}" split solidTo`);
      refStation(t.liquidTo, `Rule "${rule.id}" split liquidTo`);
    }
    if (t.kind === "evaporate") {
      for (const id of t.leaves) ref(id, `Rule "${rule.id}" evaporate leaves`);
      for (const id of t.emits ?? []) ref(id, `Rule "${rule.id}" evaporate emits`);
    }
    if (t.kind === "distil") {
      for (const id of t.volatile) ref(id, `Rule "${rule.id}" distil volatile`);
      refStation(t.collectTo, `Rule "${rule.id}" distil collectTo`);
    }
  }

  if (scenario.steps.length === 0) {
    errors.push("Scenario has no steps.");
  }
  for (const step of scenario.steps) {
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
    if (step.expect.reagent) {
      ref(step.expect.reagent, `Step "${step.id}" expect`);
      if (step.expect.type === "pour" && !shelf.has(step.expect.reagent)) {
        errors.push(
          `Step "${step.id}" pours "${step.expect.reagent}", which is not on the shelf.`,
        );
      }
    }
    if (step.expect.target) {
      refStation(step.expect.target, `Step "${step.id}" expect target`);
    }
    if (step.expect.source) {
      refStation(step.expect.source, `Step "${step.id}" expect source`);
    }
  }

  return { ok: errors.length === 0, errors };
}
