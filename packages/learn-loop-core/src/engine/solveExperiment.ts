import type {
  ExperimentDefinition,
  ExperimentLevel,
  ExperimentRuleSet,
  ExperimentSample,
} from "../model/experimentLab";
import type { ValidationResult } from "../model/scenario";
import { runExperimentSequence } from "./experimentRules";
import { effectEvidenceToken } from "./experimentSignature";

/**
 * The deterministic quality verdict for one level — the reviewer's backbone.
 *
 * A good level is **winnable by reasoning** yet not winnable by the two cheats
 * the cause→effect loop is meant to defeat:
 *
 *   - **brute-forceable** — the answer can be guessed without evidence (too few
 *     samples or too few distinct categories to reason about).
 *   - **railed** — there is no meaningful choice: a single tool already
 *     separates every category (so "combine causes" is a lie), or fewer than two
 *     tools are offered at all.
 *
 * Tutorial levels (`scaffolding: "guided"`) are intentionally trivial and railed
 * to teach one cause, so those two defects are not flagged for them. The "trap"
 * (the designed ambiguity) is expected on `open` levels and is exactly what
 * keeps a single tool from separating everything.
 */
export interface ExperimentAnalysis {
  readonly levelId: string;
  /** Every different-category sample pair can be told apart by the toolset. */
  readonly winnable: boolean;
  readonly bruteForceable: boolean;
  readonly railed: boolean;
  /** Different-category sample pairs that share an identical signature. */
  readonly indistinguishablePairs: readonly (readonly [string, string])[];
  /** Smallest number of tools whose combined signatures separate all
   * categories; `Infinity` when no toolset can. A value `> 1` is the sign of a
   * genuine "combine causes" experiment. */
  readonly toolsNeeded: number;
  /** Human-readable, ship-blocking problems (empty ⇒ the level is acceptable). */
  readonly errors: readonly string[];
}

function resolveSamples(
  ids: readonly string[],
  definition: ExperimentDefinition,
): { samples: ExperimentSample[]; missing: string[] } {
  const samples: ExperimentSample[] = [];
  const missing: string[] = [];
  for (const id of ids) {
    const found = definition.samples.find((s) => s.id === id);
    if (found) samples.push(found);
    else missing.push(id);
  }
  return { samples, missing };
}

type StatefulExperimentSignature = Readonly<Record<string, string>>;

function signatureKey(toolId: string, index: number): string {
  return `${index}:${toolId}`;
}

/**
 * Compute the visible evidence from applying tools in the same order a learner
 * can apply them during a session, carrying `setState` between probes. Each
 * step is reduced to its {@link effectEvidenceToken}, so a difference in colour,
 * pH value, bulb state, or gas label counts as distinguishing evidence.
 */
function statefulSignature(
  sample: ExperimentSample,
  toolIds: readonly string[],
  ruleSet: ExperimentRuleSet,
): StatefulExperimentSignature {
  const signature: Record<string, string> = {};
  const { results } = runExperimentSequence(sample.properties, toolIds, ruleSet);
  results.forEach((result, index) => {
    signature[signatureKey(toolIds[index], index)] = effectEvidenceToken(
      result.effect,
    );
  });
  return signature;
}

function signaturesDiffer(
  a: StatefulExperimentSignature,
  b: StatefulExperimentSignature,
  toolIds: readonly string[],
): boolean {
  return toolIds.some(
    (toolId, index) => a[signatureKey(toolId, index)] !== b[signatureKey(toolId, index)],
  );
}

/** Do all classify samples of different categories differ under this one tool? */
function toolSeparatesAllCategories(
  toolId: string,
  samples: readonly ExperimentSample[],
  definition: ExperimentDefinition,
): boolean {
  for (let i = 0; i < samples.length; i++) {
    for (let j = i + 1; j < samples.length; j++) {
      if (samples[i].categoryId === samples[j].categoryId) continue;
      const a = statefulSignature(samples[i], [toolId], definition.ruleSet);
      const b = statefulSignature(samples[j], [toolId], definition.ruleSet);
      if (!signaturesDiffer(a, b, [toolId])) return false;
    }
  }
  return true;
}

/** True when this toolset tells every different-category pair apart. */
function toolsSeparateAll(
  toolIds: readonly string[],
  samples: readonly ExperimentSample[],
  definition: ExperimentDefinition,
): boolean {
  for (let i = 0; i < samples.length; i++) {
    for (let j = i + 1; j < samples.length; j++) {
      if (samples[i].categoryId === samples[j].categoryId) continue;
      const a = statefulSignature(samples[i], toolIds, definition.ruleSet);
      const b = statefulSignature(samples[j], toolIds, definition.ruleSet);
      if (!signaturesDiffer(a, b, toolIds)) return false;
    }
  }
  return true;
}

/** Smallest subset of `toolIds` that separates all categories, or Infinity. */
function minimalSeparatingSize(
  toolIds: readonly string[],
  samples: readonly ExperimentSample[],
  definition: ExperimentDefinition,
): number {
  for (let size = 1; size <= toolIds.length; size++) {
    const found = subsetsOfSize(toolIds, size).some((subset) =>
      toolsSeparateAll(subset, samples, definition),
    );
    if (found) return size;
  }
  return Number.POSITIVE_INFINITY;
}

function subsetsOfSize(
  items: readonly string[],
  size: number,
): string[][] {
  if (size === 0) return [[]];
  if (size > items.length) return [];
  const [first, ...rest] = items;
  const withFirst = subsetsOfSize(rest, size - 1).map((s) => [first, ...s]);
  const withoutFirst = subsetsOfSize(rest, size);
  return [...withFirst, ...withoutFirst];
}

/**
 * Prove a level is winnable by reasoning and reject the brute-force / rail
 * cheats. Pure and dependent only on the definition + level, so it is a deep,
 * deterministic module that anchors both the build-time gate and the reviewer.
 */
export function solveExperiment(
  definition: ExperimentDefinition,
  level: ExperimentLevel,
): ExperimentAnalysis {
  const errors: string[] = [];
  const { samples: classifySamples, missing } = resolveSamples(
    level.goal.classifyIds,
    definition,
  );
  for (const id of missing) {
    errors.push(
      `level "${level.id}" classifies sample "${id}" but no such sample exists`,
    );
  }

  const offered = new Set(level.goal.categoryIds);
  for (const sample of classifySamples) {
    if (!offered.has(sample.categoryId)) {
      errors.push(
        `level "${level.id}": sample "${sample.id}" is category "${sample.categoryId}" but that category is not offered as a choice`,
      );
    }
  }

  // Distinguishability: every pair of classify samples in *different*
  // categories must differ under the available tools.
  const indistinguishablePairs: (readonly [string, string])[] = [];
  for (let i = 0; i < classifySamples.length; i++) {
    for (let j = i + 1; j < classifySamples.length; j++) {
      const a = classifySamples[i];
      const b = classifySamples[j];
      if (a.categoryId === b.categoryId) continue;
      const sigA = statefulSignature(a, level.toolIds, definition.ruleSet);
      const sigB = statefulSignature(b, level.toolIds, definition.ruleSet);
      if (!signaturesDiffer(sigA, sigB, level.toolIds)) {
        indistinguishablePairs.push([a.id, b.id]);
        errors.push(
          `level "${level.id}": samples "${a.id}" (${a.categoryId}) and "${b.id}" (${b.categoryId}) are indistinguishable with the available tools, so the level cannot be won by reasoning`,
        );
      }
    }
  }

  const winnable =
    missing.length === 0 &&
    indistinguishablePairs.length === 0 &&
    classifySamples.every((s) => offered.has(s.categoryId));

  const distinctCategories = new Set(
    classifySamples.map((s) => s.categoryId),
  ).size;
  const isTutorial = level.scaffolding === "guided";

  const bruteForceable =
    !isTutorial && (classifySamples.length < 2 || distinctCategories < 2);
  if (bruteForceable) {
    errors.push(
      `level "${level.id}" is brute-forceable: with ${classifySamples.length} sample(s) across ${distinctCategories} categor(y/ies) the answer can be guessed without running the distinguishing tests`,
    );
  }

  const singleToolSeparates = level.toolIds.some((toolId) =>
    toolSeparatesAllCategories(toolId, classifySamples, definition),
  );
  const railed =
    !isTutorial && (level.toolIds.length < 2 || singleToolSeparates);
  if (railed) {
    errors.push(
      level.toolIds.length < 2
        ? `level "${level.id}" is railed: fewer than two tools are offered, so there is no meaningful choice`
        : `level "${level.id}" is railed: a single tool already separates every category, so "combine causes" is not actually required`,
    );
  }

  const toolsNeeded = minimalSeparatingSize(
    level.toolIds,
    classifySamples,
    definition,
  );

  return {
    levelId: level.id,
    winnable,
    bruteForceable,
    railed,
    indistinguishablePairs,
    toolsNeeded,
    errors,
  };
}

/**
 * Run {@link solveExperiment} across every level of a game and fold the result
 * into the shared {@link ValidationResult} shape, so the build-time gate can
 * treat a quality defect exactly like a structural one.
 */
export function analyzeExperimentGame(game: {
  readonly definition: ExperimentDefinition;
  readonly levels: readonly ExperimentLevel[];
}): ValidationResult {
  const errors: string[] = [];
  for (const level of game.levels) {
    errors.push(...solveExperiment(game.definition, level).errors);
  }
  return { ok: errors.length === 0, errors };
}
