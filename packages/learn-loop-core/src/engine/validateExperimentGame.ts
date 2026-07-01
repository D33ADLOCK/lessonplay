import type { ExperimentGame } from "../model/experimentLab";
import type { ValidationResult } from "../model/scenario";
import { analyzeExperimentGame } from "./solveExperiment";

/**
 * Structural / referential validation for an {@link ExperimentGame}.
 *
 * This catches authoring mistakes before play: dangling references, an
 * observation id that means two different things, and — to protect the
 * "discovery before naming" principle — a concept
 * name leaking into observation text. Distinguishability (can the level actually
 * be reasoned out?) is intentionally left to {@link solveExperiment}, because it
 * is per-level and must not false-positive on reference samples like a control
 * that is deliberately indistinguishable from a solution.
 *
 * Errors are accumulated (not thrown) and named precisely so a generating agent
 * can fix each one.
 */
export function validateExperimentGame(game: ExperimentGame): ValidationResult {
  const errors: string[] = [];

  const sampleIds = new Set<string>();
  for (const sample of game.definition.samples) {
    if (sampleIds.has(sample.id)) {
      errors.push(`duplicate sample id "${sample.id}"`);
    }
    sampleIds.add(sample.id);
  }

  const toolIds = new Set<string>();
  for (const tool of game.definition.tools) {
    if (toolIds.has(tool.id)) {
      errors.push(`duplicate tool id "${tool.id}"`);
    }
    toolIds.add(tool.id);
  }

  const categoryIds = new Set<string>();
  for (const category of game.categories) {
    if (categoryIds.has(category.id)) {
      errors.push(`duplicate category id "${category.id}"`);
    }
    categoryIds.add(category.id);
  }

  const levelIds = new Set<string>();
  for (const level of game.levels) {
    if (levelIds.has(level.id)) {
      errors.push(`duplicate level id "${level.id}"`);
    }
    levelIds.add(level.id);
  }

  // Every classify sample's category must be a declared category, so the reveal
  // has a concept name to show.
  for (const sample of game.definition.samples) {
    if (!categoryIds.has(sample.categoryId)) {
      errors.push(
        `sample "${sample.id}" has categoryId "${sample.categoryId}" which is not a declared category`,
      );
    }
  }

  // Rules must reference known tools; an observation id must mean one thing.
  const observationText = new Map<string, string>();
  const recordObservation = (id: string, text: string) => {
    const prior = observationText.get(id);
    if (prior !== undefined && prior !== text) {
      errors.push(
        `observation id "${id}" is used for two different observations ("${prior}" vs "${text}"); an observation id must be stable`,
      );
    } else {
      observationText.set(id, text);
    }
  };
  for (const rule of game.definition.ruleSet.rules) {
    if (!toolIds.has(rule.toolId)) {
      errors.push(`rule references unknown tool "${rule.toolId}"`);
    }
    recordObservation(rule.effect.observationId, rule.effect.observation);
  }
  recordObservation(
    game.definition.ruleSet.defaultEffect.observationId,
    game.definition.ruleSet.defaultEffect.observation,
  );

  // Discovery before naming: observation text must not state a concept name.
  const categoryLabels = game.categories.map((c) => ({
    id: c.id,
    label: c.label.toLowerCase(),
  }));
  const checkObservation = (id: string, text: string) => {
    const lowered = text.toLowerCase();
    for (const { label } of categoryLabels) {
      if (label && new RegExp(`\\b${escapeRegExp(label)}\\b`).test(lowered)) {
        errors.push(
          `observation "${id}" names the concept "${label}"; observation text must describe only what is seen, never the inference`,
        );
      }
    }
  };
  for (const rule of game.definition.ruleSet.rules) {
    checkObservation(rule.effect.observationId, rule.effect.observation);
  }
  checkObservation(
    game.definition.ruleSet.defaultEffect.observationId,
    game.definition.ruleSet.defaultEffect.observation,
  );

  // Levels: references resolve, the goal is coherent, offered tools are not inert.
  for (const level of game.levels) {
    for (const id of level.sampleIds) {
      if (!sampleIds.has(id)) {
        errors.push(`level "${level.id}" references unknown sample "${id}"`);
      }
    }
    for (const id of level.toolIds) {
      if (!toolIds.has(id)) {
        errors.push(`level "${level.id}" references unknown tool "${id}"`);
      }
    }
    const levelSamples = new Set(level.sampleIds);
    for (const id of level.goal.classifyIds) {
      if (!levelSamples.has(id)) {
        errors.push(
          `level "${level.id}" classifies sample "${id}" which is not present on the bench in that level`,
        );
      }
    }
    for (const id of level.goal.categoryIds) {
      if (!categoryIds.has(id)) {
        errors.push(
          `level "${level.id}" offers unknown category "${id}" as a choice`,
        );
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

/**
 * The single build-time gate for an ExperimentLab game: structural validation
 * first (referential integrity, discovery-before-naming), and only when that
 * passes, the per-level quality analysis (winnable, not brute-forceable, not
 * railed). Structural errors are primary and returned alone, mirroring
 * {@link validateSandboxLabMission}.
 */
export function validateExperimentMission(
  game: ExperimentGame,
): ValidationResult {
  const structural = validateExperimentGame(game);
  if (!structural.ok) return structural;
  return analyzeExperimentGame(game);
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
