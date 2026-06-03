import { describe, expect, it } from 'vitest';
import { BUILT_IN_PROFILES } from './gravityProfiles.js';
import { createInitialPhysicsState, jump, simulateJump, updatePhysics } from './physics.js';

const profile = (id) => BUILT_IN_PROFILES.find((item) => item.id === id);

describe('gravity physics', () => {
  it('makes Moon jumps higher and longer than Earth jumps', () => {
    const moon = simulateJump(profile('moon'));
    const earth = simulateJump(profile('earth'));

    expect(moon.highestY).toBeGreaterThan(earth.highestY);
    expect(moon.airtime).toBeGreaterThan(earth.airtime);
  });

  it('makes Jupiter jumps lower and shorter than Earth jumps', () => {
    const jupiter = simulateJump(profile('jupiter'));
    const earth = simulateJump(profile('earth'));

    expect(jupiter.highestY).toBeLessThan(earth.highestY);
    expect(jupiter.airtime).toBeLessThan(earth.airtime);
  });

  it('lands on the ground without falling below it', () => {
    const result = simulateJump(profile('earth'));

    expect(result.finalState).toEqual({
      y: 0,
      velocityY: 0,
      grounded: true,
    });
  });

  it('does not trigger a second jump while airborne', () => {
    const earth = profile('earth');
    const firstJump = jump(createInitialPhysicsState(), earth);
    const afterAirTime = updatePhysics(firstJump, earth, 0.1);
    const secondJump = jump(afterAirTime, earth);

    expect(secondJump).toBe(afterAirTime);
  });
});
