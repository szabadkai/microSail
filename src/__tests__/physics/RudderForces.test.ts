import { describe, it, expect } from 'vitest';
import { computeRudderForces } from '@/physics/RudderForces';
import { ILCA7, DEG_TO_RAD } from '@/config';

describe('computeRudderForces', () => {
  it('returns zero forces at zero speed', () => {
    const result = computeRudderForces(0, 10 * DEG_TO_RAD, ILCA7);
    expect(result.forwardForce).toBe(0);
    expect(result.lateralForce).toBe(0);
    expect(result.yawTorque).toBe(0);
  });

  it('returns zero lateral force with rudder centered', () => {
    const result = computeRudderForces(2, 0, ILCA7);
    expect(result.lateralForce).toBeCloseTo(0, 6);
  });

  it('produces yaw torque opposite to rudder deflection', () => {
    const rightRudder = computeRudderForces(2, 10 * DEG_TO_RAD, ILCA7);
    expect(rightRudder.yawTorque).toBeLessThan(0);

    const leftRudder = computeRudderForces(2, -10 * DEG_TO_RAD, ILCA7);
    expect(leftRudder.yawTorque).toBeGreaterThan(0);
  });

  it('produces drag from rudder deflection', () => {
    const result = computeRudderForces(2, 15 * DEG_TO_RAD, ILCA7);
    expect(result.forwardForce).toBeLessThan(0);
  });
});
