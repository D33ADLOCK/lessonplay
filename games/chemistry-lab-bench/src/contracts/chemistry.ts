/**
 * Core chemistry value types. Framework-agnostic — no React, no Canvas.
 *
 * The model is deliberately qualitative for NCERT Class 9. A *workspace* holds
 * named *stations* (apparatus); each station holds a *set* of chemicals
 * (presence, not volume) plus lasting state a student can see or feel — its
 * liquid colour and its heat level. A reaction *transforms* a station: it
 * consumes reagents, produces persistent products, and may release a gas that
 * leaves the liquid. There is no titration, mmol tracking, or enthalpy maths.
 */

export type ChemicalId = string;

/**
 * What a chemical *is*. Drives nothing in the engine (rules are matched by id),
 * but lets authoring tools and the UI reason about a reagent.
 */
export type ChemicalKind =
  | "acid"
  | "base"
  | "indicator"
  | "salt"
  | "neutral"
  | "metal"
  | "gas";

export interface Chemical {
  readonly id: ChemicalId;
  /** Display label shown on the shelf and in explanations. */
  readonly label: string;
  /** CSS colour of the reagent as it sits on the shelf / pours in. */
  readonly color: string;
  readonly kind: ChemicalKind;
  /**
   * Reserved for a future filtration experiment — whether the chemical
   * dissolves. Unused by the v2 engine; declared so the schema is stable.
   */
  readonly solubility?: "soluble" | "insoluble";
}

/**
 * A station's heat as an ordered, named level. We never show a numeric
 * temperature — an exact figure would imply a measurement we do not have. A
 * reaction *sets* the new level (no level arithmetic); it persists until another
 * reaction changes it.
 */
export type HeatLevel = "cool" | "room" | "warm" | "hot";

export type StationId = string;

/**
 * One piece of apparatus. Its `contents` are a set of chemical ids (order and
 * quantity are not modelled). `color` and `heat` are lasting state a reaction
 * may overwrite; `phase` is a reserved hint for future separation experiments.
 */
export interface Station {
  readonly contents: readonly ChemicalId[];
  /** Current liquid colour (CSS). */
  readonly color: string;
  /** Current heat level. */
  readonly heat: HeatLevel;
  /** Reserved physical-state hint; unused by the v2 engine. */
  readonly phase?: "solution" | "precipitate" | "solid" | "empty";
}

/** The whole bench: a set of named stations. The v2 UI renders one of them. */
export interface Workspace {
  readonly stations: Readonly<Record<StationId, Station>>;
}

/**
 * A gas released by a reaction. It leaves the liquid — it is *not* added back to
 * the station's contents — so the UI gets a clean signal for bubbles / pop-test.
 */
export interface Emission {
  readonly gas: ChemicalId;
  /** Student-facing note, e.g. "Bubbles of gas rise and a pop-test cracks." */
  readonly observation: string;
}

/**
 * The outcome of resolving an action against a workspace. Rendering-free: the UI
 * decides how to animate the colour, heat level, and any emissions.
 */
export interface ReactionResult {
  /** One-line, student-facing observation of what happened. */
  readonly observation: string;
  /** True when something the student can see/measure changed. */
  readonly visibleChange: boolean;
  /** Liquid colour after the reaction, if it changed. */
  readonly newColor?: string;
  /** Heat level the station was set to, if the reaction changed it. */
  readonly heat?: HeatLevel;
  /** Gases released by the reaction, if any (they leave the liquid). */
  readonly emits?: readonly Emission[];
  /** Plain-language "why it happened" text, revealed in the Explain phase. */
  readonly explanation?: string;
}
