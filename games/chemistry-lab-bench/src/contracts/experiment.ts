/**
 * The experiment contract — the heart of the templating bet. An `Experiment` is
 * pure data: apparatus, reagents, a declarative reaction-rule registry, and an
 * ordered list of guided steps. Adding the next experiment means writing one of
 * these, with no engine changes.
 *
 * Rules are data-only (no functions) so an experiment stays serialisable and
 * authorable by a teacher — or, later, drafted by an AI for human review.
 */

import type { ActionType } from "./actions";
import type {
  Chemical,
  ChemicalId,
  HeatLevel,
  Station,
  StationId,
} from "./chemistry";

/**
 * What a matched rule does to a station. The full vocabulary is locked;
 * `react`, `split`, and `evaporate` are implemented. The validator rejects any
 * rule that uses a still-reserved transform kind.
 */
export type Transform =
  | ReactTransform
  | SplitTransform
  | EvaporateTransform
  | MoveAllTransform;

/**
 * Implemented. Remove `consume`d chemicals from the station, add the `produce`d
 * products to it, release any `emits` gases (they leave the liquid), and set the
 * station's colour and heat level if given.
 */
export interface ReactTransform {
  readonly kind: "react";
  readonly consume: readonly ChemicalId[];
  readonly produce: readonly ChemicalId[];
  /** Gases released — routed to the result's emissions, never left in contents. */
  readonly emits?: readonly ChemicalId[];
  readonly newColor?: string;
  readonly heat?: HeatLevel;
}

/**
 * Implemented — filtration. Route the acted-on (source) station's contents by
 * each chemical's solubility: insoluble chemicals collect in `solidTo` (the
 * residue), everything else — soluble solutes plus the solvent — passes to
 * `liquidTo` (the filtrate). The source station empties.
 */
export interface SplitTransform {
  readonly kind: "split";
  readonly solidTo: StationId;
  readonly liquidTo: StationId;
}

/**
 * Implemented — boil a station down. Keep only the `leaves` chemicals (e.g. the
 * dissolved salt as crystals); everything else is driven off, with any `emits`
 * routed to the result's emissions (the solvent leaving as vapour). Sets the
 * station's colour and heat if given.
 */
export interface EvaporateTransform {
  readonly kind: "evaporate";
  readonly leaves: readonly ChemicalId[];
  /** Vapours driven off — routed to the result's emissions, never left behind. */
  readonly emits?: readonly ChemicalId[];
  readonly newColor?: string;
  readonly heat?: HeatLevel;
}

/** Reserved — move all contents to another station (transfer). */
export interface MoveAllTransform {
  readonly kind: "moveAll";
  readonly to: StationId;
}

export type TransformKind = Transform["kind"];

/** Transform kinds the engine actually runs. The validator guards the rest. */
export const IMPLEMENTED_TRANSFORMS: readonly TransformKind[] = [
  "react",
  "split",
  "evaporate",
];

/**
 * One declarative reaction rule. The engine matches the first rule whose `on`
 * matches the action type and whose `requires` set is fully present in the
 * acted-on station, then applies its `transform`.
 */
export interface ReactionRule {
  readonly id: string;
  /** Which action triggers this rule (pour / filter / heat are implemented). */
  readonly on: ActionType;
  /** Which station the rule reads/writes; defaults to the action's target. */
  readonly at?: "target" | "source";
  /** Chemical ids that must all be present in the station for this rule to fire. */
  readonly requires: readonly ChemicalId[];
  readonly transform: Transform;
  /** Student-facing observation of what happened. */
  readonly observation: string;
  /** Plain-language "why" text, surfaced in the Explain phase. */
  readonly explanation?: string;
}

/** A single tappable prediction choice. */
export interface PredictionOption {
  readonly label: string;
  readonly correct: boolean;
  /** Feedback shown after the student taps this option (non-blocking). */
  readonly feedback: string;
}

/** The action a step expects the student to perform to advance. */
export interface ExpectedAction {
  readonly type: ActionType;
  readonly reagent?: ChemicalId;
  readonly target?: StationId;
  /** The station a non-target action (e.g. filter) reads from. */
  readonly source?: StationId;
}

/**
 * One guided step. The student is dropped at the live bench and must choose the
 * action that advances it — the *action is the decision*. An experiment is an
 * ordered list of these.
 *
 * `predictPrompt` / `options` are retained as authored data (the validator still
 * requires options) but are no longer surfaced as a guess screen.
 */
export interface Step {
  readonly id: string;
  readonly predictPrompt: string;
  readonly options: readonly PredictionOption[];
  /**
   * Tool-agnostic cue shown at the bench, naming the *goal* not the tool
   * ("Get the sand out"). Falls back to `actionPrompt` when absent. Presentation
   * only — ignored by the engine and validator.
   */
  readonly goal?: string;
  /**
   * Per-wrong-tool nudge: tapping a tool whose action isn't this step's move
   * shows the matching message and changes nothing on the bench. Keyed by the
   * tapped action type. Presentation only — ignored by the engine and validator.
   */
  readonly hints?: Partial<Record<ActionType, string>>;
  /** Instruction shown during the Observe phase ("Pour the base into the beaker"). */
  readonly actionPrompt: string;
  readonly expect: ExpectedAction;
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
  /** Starting state of every station, keyed by id. */
  readonly stations: Readonly<Record<StationId, Station>>;
  /** Declarative reaction registry, evaluated first-match-wins. */
  readonly rules: readonly ReactionRule[];
  /** Ordered guided steps. */
  readonly steps: readonly Step[];
}

/** Result of validating an experiment before it reaches a student. */
export interface ValidationResult {
  readonly ok: boolean;
  readonly errors: readonly string[];
}
