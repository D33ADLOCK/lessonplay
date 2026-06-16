/**
 * The experiment contract — the heart of the templating bet. An `Experiment` is
 * pure data: apparatus, reagents, a declarative reaction-rule registry, and the
 * Predict → Observe → Explain task. Adding the next experiment means writing one
 * of these, with no engine changes.
 *
 * Rules are data-only (no functions) so an experiment stays serialisable and
 * authorable by a teacher or an AI on their behalf.
 */

import type {
  Chemical,
  ChemicalId,
  ReactionResult,
  Vessel,
} from "./chemistry";

/**
 * One declarative reaction rule. The engine matches the first rule whose
 * `requires` set is fully present in the vessel (and whose `actionType`, if
 * given, matches the action) and returns its `produce` result verbatim.
 */
export interface ReactionRule {
  readonly id: string;
  /** Chemical ids that must all be present in the vessel for this rule to fire. */
  readonly requires: readonly ChemicalId[];
  /** Optional action-type guard (only "pour" exists in v1). */
  readonly actionType?: "pour";
  /** The result returned when this rule matches. */
  readonly produce: ReactionResult;
}

/** A single tappable prediction choice. */
export interface PredictionOption {
  readonly label: string;
  readonly correct: boolean;
  /** Feedback shown after the student taps this option (non-blocking). */
  readonly feedback: string;
}

/** The Predict → Observe → Explain task wrapped around the reaction. */
export interface ExperimentTask {
  readonly predictPrompt: string;
  readonly options: readonly PredictionOption[];
  /** Instruction shown during the Observe phase ("Pour the base into the beaker"). */
  readonly actionPrompt: string;
  /** The "why" text revealed in the Explain phase. */
  readonly explanation: string;
}

export interface Experiment {
  readonly id: string;
  readonly title: string;
  /** Concept tag, e.g. "Acids, Bases & Salts — neutralisation". */
  readonly concept: string;
  /** Target grade, e.g. 9. */
  readonly grade: number;
  /** Every chemical referenced anywhere in this experiment. */
  readonly chemicals: readonly Chemical[];
  /** Reagent ids offered to the student, in shelf order. */
  readonly shelf: readonly ChemicalId[];
  /** The beaker's starting contents. */
  readonly beaker: Vessel;
  /** Declarative reaction registry, evaluated first-match-wins. */
  readonly rules: readonly ReactionRule[];
  readonly task: ExperimentTask;
}

/** Result of validating an experiment before it reaches a student. */
export interface ValidationResult {
  readonly ok: boolean;
  readonly errors: readonly string[];
}
