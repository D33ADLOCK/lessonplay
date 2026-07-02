/**
 * ExperimentLab model — the value types for the cause → effect experiment loop.
 *
 * Where the SandboxLab model authors a fixed outcome per `material × tool`
 * (a guided slideshow of pre-written reveals), ExperimentLab models a tiny
 * *consistent simulation*: every sample carries hidden ground-truth
 * `properties`, every tool is an operator, and a first-match-wins
 * {@link ExperimentRuleSet} computes the visible {@link ExperimentEffect} from
 * those properties. Because outcomes are derived from state (never hand-written
 * per pair), the same cause always yields the same effect, so a learner can
 * probe freely and build a real mental model — the heart of the
 * Predict → Act → Observe → Reconcile loop.
 *
 * This module is React-free value types only; the deterministic engine that
 * consumes them lives in `engine/experimentRules.ts`.
 */

/** A single hidden property reading, e.g. `particleSize: "fine"`. */
export type ExperimentPropertyValue = string;

/**
 * The current property readings of one sample during play. Starts as the
 * sample's hidden `properties` and may evolve as effects apply `setState`
 * (e.g. a suspension becomes `settled` after standing), so later causes can
 * depend on earlier ones.
 */
export type ExperimentSampleState = Readonly<
  Record<string, ExperimentPropertyValue>
>;

/** A mystery sample on the bench. Its `properties` drive every outcome. */
export interface ExperimentSample {
  readonly id: string;
  /** Public, learner-facing label such as `"Unknown A"`. Never the answer. */
  readonly label: string;
  /** Hidden ground-truth the simulation reasons over. Not shown to the player. */
  readonly properties: ExperimentSampleState;
  /** Internal classification id used for grading, e.g. `"colloid"`. */
  readonly categoryId: ExperimentCategory["id"];
  /** Optional real-world identity for the reveal, e.g. `"diluted milk"`. */
  readonly revealLabel?: string;
}

/** A tool the learner can apply to any sample (an operator over state). */
export interface ExperimentTool {
  readonly id: string;
  readonly label: string;
  readonly description?: string;
}

/** The catalog of visible reactions the viewport can animate for a cause. */
export const EXPERIMENT_VISUALS = [
  "beam",
  "settle",
  "residue",
  "fizz",
  "color-change",
  "gas",
  "precipitate",
  // Added for chapter-activity coverage (e.g. Class 10 Acids, Bases and Salts):
  "conductivity", // a bulb/LED in the test circuit glows or stays dark
  "temperature", // the mixture warms or cools (thermometer moves)
  "ph-scale", // a strip/indicator lands on a spot of the 0–14 colour scale
  "odour", // a distinct smell is released (shown as a scent cue)
  "none",
] as const;

export type ExperimentVisual = (typeof EXPERIMENT_VISUALS)[number];

/**
 * The kinds of structured, quantitative-ish reading a cause can produce. A
 * readout turns "what is seen" into first-class *data* — the specific colour, a
 * point on the pH scale, whether the bulb lit — so the analyzer can treat two
 * otherwise same-visual outcomes as distinct evidence (see
 * `engine/experimentSignature.ts`). Each maps to the visual that renders it.
 */
export const EXPERIMENT_READOUT_KINDS = [
  "color", // e.g. "red", "blue", "pink", "colourless" — pairs with color-change
  "ph-scale", // e.g. "2", "7", "12" on the 0–14 scale — pairs with ph-scale
  "conductivity", // "on" | "off" (bulb glows / stays dark) — pairs with conductivity
  "temperature", // "hot" | "warm" | "cold" — pairs with temperature
  "odour", // e.g. "pungent", "none" — pairs with odour
] as const;

export type ExperimentReadoutKind = (typeof EXPERIMENT_READOUT_KINDS)[number];

/**
 * A structured reading attached to an effect, e.g. `{ kind: "color", value:
 * "red" }` or `{ kind: "ph-scale", value: "2" }`. `value` is the discriminating
 * datum a learner records; unlike free-text `observation`, it feeds the
 * distinguishability signature, so a difference in `value` alone (red vs blue
 * litmus, bulb on vs off) counts as evidence.
 */
export interface ExperimentReadout {
  readonly kind: ExperimentReadoutKind;
  readonly value: string;
}

/**
 * What the learner observes from one cause. The `observation` text is strictly
 * *what is seen*, never the inference — the player draws the conclusion.
 */
export interface ExperimentEffect {
  /** Stable id so a notebook or analyzer can dedupe identical observations. */
  readonly observationId: string;
  /** Neutral, sensory description of the visible result. No inference. */
  readonly observation: string;
  readonly visual: ExperimentVisual;
  /**
   * Short gas token shown as a chip on the escaping bubbles, e.g. `"H₂"` /
   * `"CO₂"` / `"O₂"`. Only meaningful when `visual === "gas"`; ignored otherwise.
   * Like {@link ExperimentReadout}, it is discriminating evidence and feeds the
   * signature (H₂ from a metal vs CO₂ from a carbonate are different clues).
   */
  readonly gasLabel?: string;
  /**
   * Optional structured reading (colour, pH value, bulb state, temperature,
   * odour). First-class evidence: two effects that share a `visual` but differ
   * in their readout `value` are distinguishable to the analyzer.
   */
  readonly readout?: ExperimentReadout;
  /**
   * Optional persistent state change merged into the sample after this effect,
   * letting later causes depend on earlier ones (e.g. mark a sample settled).
   */
  readonly setState?: ExperimentSampleState;
}

/**
 * One declarative cause → effect rule. The rule fires when its `toolId` is
 * applied to a sample whose current state satisfies every entry in `when`.
 */
export interface ExperimentRule {
  readonly toolId: string;
  /** Property constraints that must all match the sample's current state. */
  readonly when: ExperimentSampleState;
  readonly effect: ExperimentEffect;
}

/**
 * The full physics of an experiment: an ordered, first-match-wins rule list
 * plus the consistent fallback used when a tool matches no rule for a sample.
 */
export interface ExperimentRuleSet {
  readonly rules: readonly ExperimentRule[];
  /** Consistent effect for any tool/state combination no rule covers. */
  readonly defaultEffect: ExperimentEffect;
}

/** An aggregate experiment: the bench, the tools, and the physics. */
export interface ExperimentDefinition {
  readonly samples: readonly ExperimentSample[];
  readonly tools: readonly ExperimentTool[];
  readonly ruleSet: ExperimentRuleSet;
}

/**
 * A classification bucket the learner sorts samples into. The `label` is the
 * concept name (e.g. "Colloid") and is withheld from the bench, surfacing only
 * in the reveal — the "discovery before naming" principle. `definition` is the
 * one-line explanation shown last, as a reward rather than a lecture.
 */
export interface ExperimentCategory {
  readonly id: string;
  readonly label: string;
  readonly definition?: string;
}

/**
 * How much help a level offers. Difficulty climbs by *removing* scaffolding and
 * introducing the trap, never by adding clutter:
 *
 *   - `guided`  — tutorial: teaches one cause/tool; may be intentionally railed.
 *   - `hinted`  — full toolset, hints available on request.
 *   - `open`    — no hints; the designed ambiguity (the trap) is in play.
 */
export type ExperimentScaffolding = "guided" | "hinted" | "open";

export const EXPERIMENT_SCAFFOLDING = [
  "guided",
  "hinted",
  "open",
] as const;

/** One graduated hint, revealed in order only when the learner asks. */
export interface ExperimentHint {
  readonly id: string;
  readonly text: string;
}

/**
 * What a level asks the learner to do: assign each sample in `classifyIds` to
 * one of `categoryIds`. The control/reference samples on the bench are
 * deliberately excluded from `classifyIds` so they aid reasoning without being
 * graded.
 */
export interface ExperimentGoal {
  readonly classifyIds: readonly string[];
  readonly categoryIds: readonly string[];
}

/**
 * One playable level: which subset of the bench is present, the goal, the
 * scaffolding, whether prediction is required, the framing copy, and the
 * ordered hints. Levels share one {@link ExperimentDefinition} (one consistent
 * world) and differ only in what they expose and ask.
 */
export interface ExperimentLevel {
  readonly id: string;
  readonly title: string;
  /** Framing shown before play: the situation and what to do. */
  readonly intro: string;
  /** Shown after a correct classification, before the reveal/next level. */
  readonly outro?: string;
  readonly sampleIds: readonly string[];
  readonly toolIds: readonly string[];
  readonly goal: ExperimentGoal;
  readonly scaffolding: ExperimentScaffolding;
  /**
   * When true, the learner must predict a tool's visible result before it is
   * applied, binding prediction to the action rather than a detached quiz.
   */
  readonly predictionRequired: boolean;
  readonly hints: readonly ExperimentHint[];
}

/**
 * A complete ExperimentLab game: one consistent simulation
 * ({@link ExperimentDefinition}), the categories to discover, and the level
 * ladder. This is the unit the validator and analyzer vet and the reducer runs.
 */
export interface ExperimentGame {
  readonly id: string;
  readonly title: string;
  /** The chapter concept this teaches, for author/teacher trust. */
  readonly conceptName?: string;
  readonly definition: ExperimentDefinition;
  readonly categories: readonly ExperimentCategory[];
  readonly levels: readonly ExperimentLevel[];
}
