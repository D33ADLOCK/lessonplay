/**
 * Which *apparatus shape* a station is drawn as — purely a presentation hint.
 *
 * The chemistry engine models a station as an abstract content-holder; it has no
 * idea whether a vessel is a beaker or a funnel, and it must not. But a student
 * learns from the shape: a funnel with filter paper visibly catching sand teaches
 * the separation in a way two identical boxes never could. So the *look* lives
 * here, in the UI layer, keyed by experiment + station, defaulting to a beaker.
 *
 * This is a deliberate, revisitable choice. Nothing in the chemistry value types,
 * the `Station` schema, the reaction engine, the validator, or the session
 * reducer changes. If apparatus ever proves it belongs in authored data, promoting
 * it to the schema is a separate, tested migration.
 */

/** The vessel silhouettes the apparatus layer knows how to draw. */
export type ApparatusKind = "beaker" | "funnel";

/**
 * Per-experiment, per-station overrides of the default beaker look. Only the
 * stations that need a non-beaker shape appear here; everything else defaults.
 */
const OVERRIDES: Readonly<
  Record<string, Readonly<Record<string, ApparatusKind>>>
> = {
  // Salt + sand separation: the residue station is the filter paper in a funnel,
  // where the insoluble sand is caught — not another beaker.
  "salt-sand-separation": { residue: "funnel" },
};

/**
 * Resolve the apparatus shape for a station. Defaults to `"beaker"`, including
 * for an unknown experiment or station, so a new experiment is dressed as plain
 * glassware with no extra wiring and a missing key never throws.
 */
export function apparatusFor(
  experimentId: string,
  stationId: string,
): ApparatusKind {
  return OVERRIDES[experimentId]?.[stationId] ?? "beaker";
}
