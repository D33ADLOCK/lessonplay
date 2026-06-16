/**
 * Core chemistry value types. Framework-agnostic — no React, no Canvas.
 *
 * The reaction model is deliberately qualitative for NCERT Class 9: a vessel
 * holds a *set* of chemicals (presence, not volume), and a single discrete
 * action (a pour) resolves to one observable result. There is no titration,
 * mmol tracking, or enthalpy maths.
 */

export type ChemicalId = string;

export type ChemicalKind = "acid" | "base" | "indicator" | "salt" | "neutral";

export interface Chemical {
  readonly id: ChemicalId;
  /** Display label shown on the shelf and in explanations. */
  readonly label: string;
  /** CSS colour of the reagent as it sits on the shelf / pours in. */
  readonly color: string;
  readonly kind: ChemicalKind;
}

/**
 * A container of chemicals. Contents are a set of chemical ids — order and
 * quantity are not modelled in v1.
 */
export interface Vessel {
  readonly contents: readonly ChemicalId[];
}

/** The single interaction a student can perform on the vessel. */
export interface PourAction {
  readonly type: "pour";
  readonly reagent: ChemicalId;
}

export type Action = PourAction;

/** Before/after thermometer readings, in degrees Celsius. */
export interface TemperatureChange {
  readonly from: number;
  readonly to: number;
}

/**
 * The outcome of resolving an action against a vessel. Rendering-free: the UI
 * decides how to animate `newColor` and `temperature`.
 */
export interface ReactionResult {
  /** One-line, student-facing observation of what happened. */
  readonly observation: string;
  /** True when something the student can see/measure changed. */
  readonly visibleChange: boolean;
  /** Liquid colour after the reaction, if it changed. */
  readonly newColor?: string;
  /** Thermometer movement, if the reaction was exo/endothermic. */
  readonly temperature?: TemperatureChange;
  /** Plain-language "why it happened" text, revealed in the Explain phase. */
  readonly explanation?: string;
}
