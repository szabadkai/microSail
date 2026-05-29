import { describe, it, expect } from 'vitest';
import { integrate } from '@/physics/Integration';
import type { BoatState, ForceResult } from '@/core/types';
import { ILCA7 } from '@/config';

function makeState(overrides: Partial<BoatState> = {}): BoatState {
  return {
    position: { x: 0, y: 0 },
    heading: 0,
    speed: 0,
    yawRate: 0,
    heelAngle: 0,
    heelRate: 0,
    sailTrimAngle: 0.5,
    rudderAngle: 0,
    ...overrides,
  };
}

const zeroForce: ForceResult = { forwardForce: 0, lateralForce: 0, yawTorque: 0 };
const dt = 1 / 60;

describe('integrate', () => {
  it('does not move with zero force and zero speed', () => {
    const state = makeState();
    const next = integrate(state, zeroForce, ILCA7, dt);
    expect(next.position.x).toBe(0);
    expect(next.position.y).toBe(0);
    expect(next.speed).toBe(0);
  });

  it('accelerates with forward force', () => {
    const state = makeState();
    const force: ForceResult = { forwardForce: 100, lateralForce: 0, yawTorque: 0 };
    const next = integrate(state, force, ILCA7, dt);
    expect(next.speed).toBeGreaterThan(0);
  });

  it('does not allow negative speed', () => {
    const state = makeState({ speed: 0.001 });
    const force: ForceResult = { forwardForce: -1000, lateralForce: 0, yawTorque: 0 };
    const next = integrate(state, force, ILCA7, dt);
    expect(next.speed).toBeGreaterThanOrEqual(0);
  });

  it('changes heading with yaw torque', () => {
    const state = makeState({ speed: 2 });
    const force: ForceResult = { forwardForce: 0, lateralForce: 0, yawTorque: 50 };
    const next = integrate(state, force, ILCA7, dt);
    expect(next.heading).not.toBe(0);
  });

  it('coasts gradually when force is removed (inertia)', () => {
    const state = makeState({ speed: 3.0 });
    let current = state;
    for (let i = 0; i < 60; i++) {
      current = integrate(current, zeroForce, ILCA7, dt);
    }
    // After 1 second with no force, boat should still be moving (has inertia)
    expect(current.speed).toBeGreaterThan(0.5);
    expect(current.speed).toBeLessThan(3.0);
  });

  it('yaw damping increases with speed', () => {
    // At high speed, same yaw torque should produce less yaw rate change
    const slowState = makeState({ speed: 0.5, yawRate: 0.5 });
    const fastState = makeState({ speed: 4.0, yawRate: 0.5 });
    const force: ForceResult = { forwardForce: 0, lateralForce: 0, yawTorque: 0 };
    const slowNext = integrate(slowState, force, ILCA7, dt);
    const fastNext = integrate(fastState, force, ILCA7, dt);
    // Fast boat should have more damped yaw rate
    expect(Math.abs(fastNext.yawRate)).toBeLessThan(Math.abs(slowNext.yawRate));
  });

  it('updates position based on heading and speed', () => {
    const state = makeState({ speed: 3, heading: Math.PI / 2 });
    const next = integrate(state, zeroForce, ILCA7, dt);
    expect(next.position.x).toBeGreaterThan(0);
  });
});
