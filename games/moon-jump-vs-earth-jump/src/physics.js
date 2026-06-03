export const GROUND_Y = 0;

export function createInitialPhysicsState() {
  return {
    y: GROUND_Y,
    velocityY: 0,
    grounded: true,
  };
}

export function jump(state, profile) {
  if (!state.grounded) {
    return state;
  }

  return {
    ...state,
    velocityY: profile.jumpVelocity,
    grounded: false,
  };
}

export function updatePhysics(state, profile, deltaSeconds) {
  if (state.grounded && state.velocityY === 0 && state.y === GROUND_Y) {
    return state;
  }

  const velocityY = state.velocityY - profile.gravity * deltaSeconds;
  const y = state.y + velocityY * deltaSeconds;

  if (y <= GROUND_Y) {
    return {
      y: GROUND_Y,
      velocityY: 0,
      grounded: true,
    };
  }

  return {
    y,
    velocityY,
    grounded: false,
  };
}

export function simulateJump(profile, stepSeconds = 1 / 60, maxSeconds = 6) {
  let state = jump(createInitialPhysicsState(), profile);
  let highestY = state.y;
  let elapsed = 0;

  while (elapsed < maxSeconds) {
    state = updatePhysics(state, profile, stepSeconds);
    highestY = Math.max(highestY, state.y);
    elapsed += stepSeconds;

    if (state.grounded && elapsed > stepSeconds) {
      break;
    }
  }

  return {
    highestY,
    airtime: elapsed,
    finalState: state,
  };
}
