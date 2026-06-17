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
  /** Surface currently under the cart. */
  surfaceId: string;
  /** Elapsed simulation time in seconds. */
  elapsed: number;
}

export const FIXED_DT = 1 / 120; // seconds per simulation step
const FORCE_TO_SPEED = 48;
const FRICTION_TO_DECELERATION = 13;
const STOP_SPEED = 0.04;

export function createSimState(startPosition = 0): SimState {
  return {
    position: startPosition,
    velocity: 0,
    atRest: true,
    surfaceId: "wood",
    elapsed: 0,
  };
}

export function launch(state: SimState, force: number): SimState {
  return {
    ...state,
    velocity: Math.max(0, Math.min(1, force)) * FORCE_TO_SPEED,
    atRest: false,
    elapsed: 0,
  };
}

export type SurfaceResolver = (position: number) => {
  readonly id: string;
  readonly friction: number;
};

export function stepSimulation(
  state: SimState,
  resolveSurface: SurfaceResolver,
  dt = FIXED_DT,
): SimState {
  if (state.atRest) return state;

  const surface = resolveSurface(state.position);
  const deceleration = surface.friction * FRICTION_TO_DECELERATION;
  const nextVelocity = Math.max(0, state.velocity - deceleration * dt);
  const averageVelocity = (state.velocity + nextVelocity) * 0.5;
  const nextPosition = state.position + averageVelocity * dt;
  const stopped = nextVelocity <= STOP_SPEED;

  return {
    position: nextPosition,
    velocity: stopped ? 0 : nextVelocity,
    atRest: stopped,
    surfaceId: surface.id,
    elapsed: state.elapsed + dt,
  };
}

export function simulateLaunch(
  startPosition: number,
  force: number,
  resolveSurface: SurfaceResolver,
  maxSeconds = 20,
): SimState {
  let state = launch(createSimState(startPosition), force);
  const maxSteps = Math.ceil(maxSeconds / FIXED_DT);
  for (let i = 0; i < maxSteps && !state.atRest; i += 1) {
    state = stepSimulation(state, resolveSurface);
  }
  return state;
}
