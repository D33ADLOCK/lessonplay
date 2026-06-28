/**
 * Core value types for the guided-sim archetype. Framework-agnostic — no React,
 * no Canvas. These are the de-chemistry'd descendants of chemistry-lab-bench's
 * contracts: an `Entity` is anything a station can hold (a reagent, a material,
 * a token), named by id.
 *
 * The model is deliberately qualitative. A *workspace* holds named *stations*
 * (apparatus / zones); each station holds a *set* of entities (presence, not
 * quantity) plus lasting state a learner can see — its liquid colour and its
 * heat level. A transform changes a station: it consumes inputs, produces
 * persistent outputs, and may release something (a gas/vapour) that leaves the
 * station. There is no volume, mass, or rate maths.
 */

export type EntityId = string;

/**
 * What an entity *is*. Open by design (a plain string) so a non-chemistry game
 * can register its own kinds without touching the core. The engine never matches
 * on kind — rules match by id — so this only informs authoring tools and skins.
 * Common chemistry values: "acid" | "base" | "indicator" | "salt" | "neutral" |
 * "metal" | "gas".
 */
export type EntityKind = string;

export interface Entity {
  readonly id: EntityId;
  /** Display label shown in the tray and in explanations. */
  readonly label: string;
  /** CSS colour of the entity as it sits in the tray / pours in. */
  readonly color: string;
  readonly kind: EntityKind;
  /** Whether the entity dissolves — drives the `split` (filtration) transform. */
  readonly solubility?: "soluble" | "insoluble";
}

/**
 * A station's heat as an ordered, named level. We never show a numeric
 * temperature — an exact figure would imply a measurement we do not have. A
 * transform *sets* the new level (no arithmetic); it persists until another
 * transform changes it.
 */
export type HeatLevel = "cool" | "room" | "warm" | "hot";

export type StationId = string;

/**
 * One station (apparatus / zone). Its `contents` are a set of entity ids (order
 * and quantity are not modelled). `color` and `heat` are lasting state a
 * transform may overwrite; `phase` is an optional physical-state hint a skin can
 * read.
 */
export interface Station {
  readonly contents: readonly EntityId[];
  /** Current liquid colour (CSS). */
  readonly color: string;
  /** Current heat level. */
  readonly heat: HeatLevel;
  /** Optional physical-state hint for the skin. */
  readonly phase?: "solution" | "precipitate" | "solid" | "empty";
}

/** The whole bench: a set of named stations. */
export interface Workspace {
  readonly stations: Readonly<Record<StationId, Station>>;
}

/**
 * Something released by a transform (a gas / vapour). It leaves the station — it
 * is *not* added back to the station's contents — so a skin gets a clean signal
 * for bubbles / a pop-test / rising steam.
 */
export interface Emission {
  readonly gas: EntityId;
  /** Learner-facing note, e.g. "Bubbles of gas rise and a pop-test cracks." */
  readonly observation: string;
}

/**
 * The outcome of resolving an action against a workspace. Rendering-free: a skin
 * decides how to animate the colour, heat level, and any emissions.
 */
export interface StepResult {
  /** One-line, learner-facing observation of what happened. */
  readonly observation: string;
  /** True when something the learner can see/measure changed. */
  readonly visibleChange: boolean;
  /** Liquid colour after the transform, if it changed. */
  readonly newColor?: string;
  /** Heat level the station was set to, if the transform changed it. */
  readonly heat?: HeatLevel;
  /** Things released by the transform, if any (they leave the station). */
  readonly emits?: readonly Emission[];
  /** Plain-language "why it happened" text, revealed in the Explain phase. */
  readonly explanation?: string;
}
