/**
 * Lantern-cart simulation (contract).
 *
 * Deterministic, renderer-free 1D motion of the cart along the course, advanced
 * on a fixed timestep so outcomes are reproducible and unit-testable (PRD
 * "Technical Direction", user story 22). Slice 1 fixes the state shape + stepping
 * contract; Slice 2 (#12) fills in the friction integration and emits gameplay
 * events.
 */
export interface SimState {
  /** Cart position along the course, in course units. */
  position: number;
  /** Cart velocity, course units per second. */
  velocity: number;
  /** True once the cart has come to rest. */
  atRest: boolean;
}

export const FIXED_DT = 1 / 120; // seconds per simulation step

export function createSimState(startPosition = 0): SimState {
  return { position: startPosition, velocity: 0, atRest: true };
}
