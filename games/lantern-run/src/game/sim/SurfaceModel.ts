/**
 * Surface & friction model (contract + seed data).
 *
 * Three readable surfaces with distinct friction so the same push travels
 * visibly different distances (PRD user story 5). Slice 2 (#12) implements the
 * deterministic motion that consumes these coefficients and adds the
 * force×surface unit tests.
 */
export interface Surface {
  readonly id: string;
  readonly name: string;
  /** Kinetic friction coefficient; higher = stops sooner. */
  readonly friction: number;
  /** Display tint for the rendered segment. */
  readonly color: number;
}

export const SURFACES: Record<string, Surface> = {
  wood: { id: "wood", name: "wooden path", friction: 0.9, color: 0xb5793a },
  grass: { id: "grass", name: "wet grass", friction: 0.6, color: 0x4f8f5a },
  ice: { id: "ice", name: "icy path", friction: 0.15, color: 0x8fd0e8 },
};
