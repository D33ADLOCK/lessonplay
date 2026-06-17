/**
 * The full vocabulary of things a student can do at the bench.
 *
 * The whole union is locked so future apparatus drops into an obvious slot
 * without reshaping the schema. `pour`, `filter`, and `heat` are implemented; the
 * validator rejects any experiment that asks for a still-reserved action, so we
 * never ship data the engine cannot run.
 *
 * An action is only the student's *gesture* (which station they act on). The
 * chemistry it triggers — products, routing destinations, emissions — lives on
 * the matched rule's transform, never on the action itself.
 */

import type { ChemicalId, StationId } from "./chemistry";

/** Implemented — drop a reagent from the shelf into a station. */
export interface PourAction {
  readonly type: "pour";
  readonly reagent: ChemicalId;
  readonly target: StationId;
}

/** Reserved — pour the whole of one station into another. */
export interface TransferAction {
  readonly type: "transfer";
  readonly source: StationId;
  readonly target: StationId;
}

/**
 * Implemented — filter a station. Just the gesture: which station is poured
 * through the funnel. A matched `split` transform carries where the residue and
 * filtrate go.
 */
export interface FilterAction {
  readonly type: "filter";
  readonly source: StationId;
}

/** Implemented — apply heat to a station (may trigger an evaporate transform). */
export interface HeatAction {
  readonly type: "heat";
  readonly target: StationId;
}

/** Reserved — stir a station. */
export interface StirAction {
  readonly type: "stir";
  readonly target: StationId;
}

export type Action =
  | PourAction
  | TransferAction
  | FilterAction
  | HeatAction
  | StirAction;

export type ActionType = Action["type"];

/** Action types the engine actually runs. The validator guards the rest. */
export const IMPLEMENTED_ACTIONS: readonly ActionType[] = [
  "pour",
  "filter",
  "heat",
];
