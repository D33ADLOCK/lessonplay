/**
 * The full vocabulary of things a learner can do at the bench.
 *
 * The whole union is locked so future tools drop into an obvious slot without
 * reshaping the schema. Most actions are implemented as station-level gestures;
 * the visible effect still lives on the matched rule transform. The validator
 * rejects any scenario that asks for a still-reserved action, so we never ship
 * data the engine cannot run.
 *
 * An action is only the learner's *gesture* (which station they act on). What it
 * triggers — products, routing destinations, emissions — lives on the matched
 * rule's transform, never on the action itself.
 */

import type { EntityId, StationId } from "./entity";

/** Implemented — drop an entity from the tray into a station. */
export interface PourAction {
  readonly type: "pour";
  readonly reagent: EntityId;
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

/** Implemented — apply heat to a station (may trigger an evaporate/distil transform). */
export interface HeatAction {
  readonly type: "heat";
  readonly target: StationId;
}

/** Implemented — let a heated station cool or stand. */
export interface CoolAction {
  readonly type: "cool";
  readonly target: StationId;
}

/** Implemented — wait for settling, diffusion, or another slow visible change. */
export interface WaitAction {
  readonly type: "wait";
  readonly target: StationId;
}

/** Implemented — shine a beam through a station to test scattering. */
export interface ShineLightAction {
  readonly type: "shineLight";
  readonly target: StationId;
}

/** Implemented — run a paper/solvent chromatography test at a station. */
export interface ChromatographAction {
  readonly type: "chromatograph";
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
  | CoolAction
  | WaitAction
  | ShineLightAction
  | ChromatographAction
  | StirAction;

export type ActionType = Action["type"];

/** Action types the engine actually runs. The validator guards the rest. */
export const IMPLEMENTED_ACTIONS: readonly ActionType[] = [
  "pour",
  "filter",
  "heat",
  "cool",
  "wait",
  "shineLight",
  "chromatograph",
];
