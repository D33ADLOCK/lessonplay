/**
 * The scenario contract — the heart of the templating bet. A `Scenario` is pure
 * data: stations, entities, a declarative rule registry, and an ordered list of
 * guided steps. Adding the next scenario means writing one of these, with no
 * engine changes.
 *
 * Rules are data-only (no functions) so a scenario stays serialisable and
 * authorable by a teacher — or, later, drafted by an AI for human review.
 */

import type { ActionType } from "./actions";
import type {
  Entity,
  EntityId,
  HeatLevel,
  Station,
  StationId,
} from "./entity";

/**
 * What a matched rule does to a station. The full vocabulary is locked;
 * `react`, `split`, `evaporate`, and `distil` are implemented. The validator
 * rejects any rule that uses a still-reserved transform kind.
 */
export type Transform =
  | ReactTransform
  | SplitTransform
  | EvaporateTransform
  | DistilTransform
  | MoveAllTransform;

/**
 * Implemented. Remove `consume`d entities from the station, add the `produce`d
 * outputs to it, release any `emits` (they leave the station), and set the
 * station's colour and heat level if given.
 */
export interface ReactTransform {
  readonly kind: "react";
  readonly consume: readonly EntityId[];
  readonly produce: readonly EntityId[];
  /** Released entities — routed to the result's emissions, never left in contents. */
  readonly emits?: readonly EntityId[];
  readonly newColor?: string;
  readonly heat?: HeatLevel;
}

/**
 * Implemented — filtration. Route the acted-on (source) station's contents by
 * each entity's solubility: insoluble entities collect in `solidTo` (the
 * residue), everything else — soluble solutes plus the solvent — passes to
 * `liquidTo` (the filtrate). The source station empties.
 */
export interface SplitTransform {
  readonly kind: "split";
  readonly solidTo: StationId;
  readonly liquidTo: StationId;
}

/**
 * Implemented — boil a station down. Keep only the `leaves` entities (e.g. the
 * dissolved salt as crystals); everything else is driven off, with any `emits`
 * routed to the result's emissions (the solvent leaving as vapour). Sets the
 * station's colour and heat if given.
 */
export interface EvaporateTransform {
  readonly kind: "evaporate";
  readonly leaves: readonly EntityId[];
  /** Vapours driven off — routed to the result's emissions, never left behind. */
  readonly emits?: readonly EntityId[];
  readonly newColor?: string;
  readonly heat?: HeatLevel;
}

/**
 * Implemented — distillation. Heat a still pot: the `volatile` entities boil
 * off, travel through the condenser, and **collect as a liquid** in `collectTo`
 * (the receiver) — unlike `evaporate`, the vapour is recovered, not lost.
 * Everything else (the higher-boiling liquid, a dissolved solid) stays in the
 * source. Routing is by id, never hard-coded: list what comes over.
 */
export interface DistilTransform {
  readonly kind: "distil";
  /** Entities that boil off and condense into the collector as liquid. */
  readonly volatile: readonly EntityId[];
  /** Station the recovered distillate collects in. */
  readonly collectTo: StationId;
  /** Colour the distillate gives the receiver; defaults to the volatile's own colour. */
  readonly collectColor?: string;
  /** Colour the source still pot takes on once the volatile has left. */
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
  "distil",
];

/**
 * One declarative rule. The engine matches the first rule whose `on` matches the
 * action type and whose `requires` set is fully present in the acted-on station,
 * then applies its `transform`.
 */
export interface Rule {
  readonly id: string;
  /** Which action triggers this rule (pour / filter / heat are implemented). */
  readonly on: ActionType;
  /** Which station the rule reads/writes; defaults to the action's target. */
  readonly at?: "target" | "source";
  /** Entity ids that must all be present in the station for this rule to fire. */
  readonly requires: readonly EntityId[];
  readonly transform: Transform;
  /** Learner-facing observation of what happened. */
  readonly observation: string;
  /** Plain-language "why" text, surfaced in the Explain phase. */
  readonly explanation?: string;
}

/** A single tappable prediction choice. */
export interface PredictionOption {
  readonly label: string;
  readonly correct: boolean;
  /** Feedback shown after the learner taps this option (non-blocking). */
  readonly feedback: string;
}

/** The action a step expects the learner to perform to advance. */
export interface ExpectedAction {
  readonly type: ActionType;
  readonly reagent?: EntityId;
  readonly target?: StationId;
  /** The station a non-target action (e.g. filter) reads from. */
  readonly source?: StationId;
}

/**
 * One guided step. The learner is dropped at the live bench and must choose the
 * action that advances it — the *action is the decision*. A scenario is an
 * ordered list of these.
 *
 * `predictPrompt` / `options` are retained as authored data (the validator still
 * requires options) for a skin that wants to surface a prediction beat.
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

export interface Scenario {
  readonly id: string;
  readonly title: string;
  /** Concept tag, e.g. "Separation of Mixtures — distillation". */
  readonly concept: string;
  /** Target grade, e.g. 9. */
  readonly grade: number;
  /** Every entity referenced anywhere in this scenario. */
  readonly entities: readonly Entity[];
  /** Entity ids offered to the learner in the tray, in order. */
  readonly shelf: readonly EntityId[];
  /** Starting state of every station, keyed by id. */
  readonly stations: Readonly<Record<StationId, Station>>;
  /** Declarative rule registry, evaluated first-match-wins. */
  readonly rules: readonly Rule[];
  /** Ordered guided steps. */
  readonly steps: readonly Step[];
}

/** Result of validating a scenario before it reaches a learner. */
export interface ValidationResult {
  readonly ok: boolean;
  readonly errors: readonly string[];
}
