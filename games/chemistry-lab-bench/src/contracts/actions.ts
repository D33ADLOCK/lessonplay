/**
 * The full vocabulary of things a student can do at the bench.
 *
 * The whole union is locked now so future apparatus drops into an obvious slot
 * without reshaping the schema — but only `pour` is implemented in v2. The
 * engine runs `pour`; the validator rejects any experiment that asks for a
 * reserved action, so we never ship data the engine cannot run.
 */

import type { ChemicalId, StationId } from "./chemistry";

/** The only action the v2 engine resolves. */
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

/** Reserved — filter a station, splitting solid residue from liquid filtrate. */
export interface FilterAction {
  readonly type: "filter";
  readonly source: StationId;
  readonly residue: StationId;
  readonly filtrate: StationId;
}

/** Reserved — apply heat to a station. */
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

/** Action types the v2 engine actually runs. The validator guards the rest. */
export const IMPLEMENTED_ACTIONS: readonly ActionType[] = ["pour"];
