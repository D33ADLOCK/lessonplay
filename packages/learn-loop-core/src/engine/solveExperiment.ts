import {
  isPredictOutcomeGoal,
  isReachTargetStateGoal,
  type ClassifyGoal,
  type ExperimentDefinition,
  type ExperimentGoalKind,
  type ExperimentLevel,
  type ExperimentRuleSet,
  type ExperimentSample,
  type ExperimentSampleState,
  type PredictOutcomeGoal,
  type ReachTargetStateGoal,
} from "../model/experimentLab";
import type { ValidationResult } from "../model/scenario";
import {
  matchesWhen,
  runExperimentSequence,
  runExperimentStep,
} from "./experimentRules";
import { effectEvidenceToken } from "./experimentSignature";

/**
 * Search depth cap for the reach-target-state reachability proof. Real
 * transformation activities reach their target in a handful of moves; the cap
 * keeps the breadth-first search bounded on the (finite) property state space.
 */
const REACH_MAX_DEPTH = 8;

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
  /** Which goal shape was analysed (the checks below are goal-specific). */
  readonly goalKind: ExperimentGoalKind;
  /**
   * The level is achievable *and* fair for its goal kind:
   *   - classify: every different-category sample pair can be told apart.
   *   - predict-outcome: prompts are valid and not answerable by one guess.
   *   - reach-target-state: the target is reachable and not already satisfied.
   */
  readonly winnable: boolean;
  /**
   * The answer can be reached without evidence. For classify: too few
   * samples/categories to reason about. For predict-outcome: the prompts share a
   * single answer, so one repeated guess wins. Never flagged for
   * reach-target-state. (Also false on guided tutorials, which may be trivial.)
   */
  readonly bruteForceable: boolean;
  /**
   * classify-only: a single tool already separates every category (no real
   * "combine causes"), or fewer than two tools are offered. False otherwise.
   */
  readonly railed: boolean;
  /** classify-only: different-category sample pairs that share a signature. */
  readonly indistinguishablePairs: readonly (readonly [string, string])[];
  /**
   * classify: smallest tool subset that separates all categories (`> 1` marks a
   * genuine "combine causes" level). reach-target-state: the fewest actions that
   * reach the target. `Infinity` when unachievable; `0` when not applicable.
   */
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
 * Prove a level is winnable by reasoning and reject the cheats appropriate to
 * its goal kind. Pure and dependent only on the definition + level, so it is a
 * deep, deterministic module that anchors both the build-time gate and the
 * reviewer. Dispatches on the goal's discriminant.
 */
export function solveExperiment(
  definition: ExperimentDefinition,
  level: ExperimentLevel,
): ExperimentAnalysis {
  const goal = level.goal;
  if (isPredictOutcomeGoal(goal)) {
    return solvePredictOutcome(definition, level, goal);
  }
  if (isReachTargetStateGoal(goal)) {
    return solveReachTargetState(definition, level, goal);
  }
  return solveClassify(definition, level, goal);
}

/**
 * classify: prove every different-category pair is distinguishable, and reject
 * the brute-force (too few samples/categories) and rail (one tool separates
 * everything, or fewer than two tools) cheats.
 */
function solveClassify(
  definition: ExperimentDefinition,
  level: ExperimentLevel,
  goal: ClassifyGoal,
): ExperimentAnalysis {
  const errors: string[] = [];
  const { samples: classifySamples, missing } = resolveSamples(
    goal.classifyIds,
    definition,
  );
  for (const id of missing) {
    errors.push(
      `level "${level.id}" classifies sample "${id}" but no such sample exists`,
    );
  }

  const offered = new Set(goal.categoryIds);
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
    goalKind: "classify",
    winnable,
    bruteForceable,
    railed,
    indistinguishablePairs,
    toolsNeeded,
    errors,
  };
}

/**
 * predict-outcome: prove each prompt names a real sample/tool on the bench and
 * that the prompts are not answerable by one repeated guess — the correct
 * visual must vary across at least two prompts (guided tutorials are exempt, as
 * they may teach a single beat).
 */
function solvePredictOutcome(
  definition: ExperimentDefinition,
  level: ExperimentLevel,
  goal: PredictOutcomeGoal,
): ExperimentAnalysis {
  const errors: string[] = [];
  const onBench = new Set(level.sampleIds);
  const offeredTools = new Set(level.toolIds);
  const isTutorial = level.scaffolding === "guided";

  if (goal.prompts.length === 0) {
    errors.push(
      `level "${level.id}" is a predict-outcome level but lists no prompts`,
    );
  }

  // The distinct *visuals* a learner would have to predict across the prompts.
  const predictedVisuals: string[] = [];
  for (const prompt of goal.prompts) {
    const sample = definition.samples.find((s) => s.id === prompt.sampleId);
    if (!sample) {
      errors.push(
        `level "${level.id}" prompts sample "${prompt.sampleId}" but no such sample exists`,
      );
      continue;
    }
    if (!onBench.has(prompt.sampleId)) {
      errors.push(
        `level "${level.id}" prompts sample "${prompt.sampleId}" which is not on the bench in that level`,
      );
    }
    if (!offeredTools.has(prompt.toolId)) {
      errors.push(
        `level "${level.id}" prompts tool "${prompt.toolId}" which is not offered in that level`,
      );
    }
    const { effect } = runExperimentStep(
      sample.properties,
      prompt.toolId,
      definition.ruleSet,
    );
    predictedVisuals.push(effect.visual);
  }

  const distinctVisuals = new Set(predictedVisuals).size;
  const guessable =
    !isTutorial && (goal.prompts.length < 2 || distinctVisuals < 2);
  if (guessable) {
    errors.push(
      `level "${level.id}" is guessable: its predict-outcome prompts do not have at least two different answers, so a single repeated prediction wins`,
    );
  }

  return {
    levelId: level.id,
    goalKind: "predict-outcome",
    winnable: errors.length === 0,
    bruteForceable: guessable,
    railed: false,
    indistinguishablePairs: [],
    toolsNeeded: 0,
    errors,
  };
}

/**
 * reach-target-state: prove the target is actually reachable from the sample's
 * initial state with the offered tools (a breadth-first search over the finite
 * property state space), and that it is not already satisfied at the start (a
 * trivially-reachable goal asks for no action).
 */
function solveReachTargetState(
  definition: ExperimentDefinition,
  level: ExperimentLevel,
  goal: ReachTargetStateGoal,
): ExperimentAnalysis {
  const errors: string[] = [];
  const sample = definition.samples.find((s) => s.id === goal.sampleId);

  if (!sample) {
    errors.push(
      `level "${level.id}" targets sample "${goal.sampleId}" but no such sample exists`,
    );
    return {
      levelId: level.id,
      goalKind: "reach-target-state",
      winnable: false,
      bruteForceable: false,
      railed: false,
      indistinguishablePairs: [],
      toolsNeeded: Number.POSITIVE_INFINITY,
      errors,
    };
  }

  if (!level.sampleIds.includes(goal.sampleId)) {
    errors.push(
      `level "${level.id}" targets sample "${goal.sampleId}" which is not on the bench in that level`,
    );
  }
  if (Object.keys(goal.target).length === 0) {
    errors.push(`level "${level.id}" has an empty reach-target-state target`);
  }

  const triviallyReachable = matchesWhen(sample.properties, goal.target);
  if (triviallyReachable) {
    errors.push(
      `level "${level.id}" target is already satisfied by the sample's initial state, so it needs no action` +
        ` — for a reversible round-trip (e.g. heat then rehydrate back to the start colour), set a history marker in the forward step's setState and include that marker in the target so the goal state is distinct from the start`,
    );
  }

  const stepsToTarget = minStepsToTarget(
    sample.properties,
    goal.target,
    level.toolIds,
    definition.ruleSet,
  );
  const reachable = Number.isFinite(stepsToTarget);
  if (!triviallyReachable && !reachable) {
    errors.push(
      `level "${level.id}" target cannot be reached from the sample's initial state with the offered tools`,
    );
  }

  return {
    levelId: level.id,
    goalKind: "reach-target-state",
    winnable: reachable && !triviallyReachable && errors.length === 0,
    bruteForceable: false,
    railed: false,
    indistinguishablePairs: [],
    toolsNeeded: stepsToTarget,
    errors,
  };
}

/** Stable key for a property state, so the BFS can dedupe visited states. */
function stateKey(state: ExperimentSampleState): string {
  return Object.keys(state)
    .sort()
    .map((k) => `${k}=${state[k]}`)
    .join("&");
}

/**
 * Fewest tool applications that drive `initial` to a state satisfying `target`,
 * or `Infinity` if no sequence within {@link REACH_MAX_DEPTH} does. A plain BFS
 * over the finite property state space; each tool is a deterministic edge.
 */
function minStepsToTarget(
  initial: ExperimentSampleState,
  target: ExperimentSampleState,
  toolIds: readonly string[],
  ruleSet: ExperimentRuleSet,
): number {
  if (matchesWhen(initial, target)) return 0;
  const visited = new Set<string>([stateKey(initial)]);
  let frontier: ExperimentSampleState[] = [initial];
  for (let depth = 1; depth <= REACH_MAX_DEPTH; depth++) {
    const next: ExperimentSampleState[] = [];
    for (const state of frontier) {
      for (const toolId of toolIds) {
        const { nextState } = runExperimentStep(state, toolId, ruleSet);
        const key = stateKey(nextState);
        if (visited.has(key)) continue;
        visited.add(key);
        if (matchesWhen(nextState, target)) return depth;
        next.push(nextState);
      }
    }
    if (next.length === 0) break;
    frontier = next;
  }
  return Number.POSITIVE_INFINITY;
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
