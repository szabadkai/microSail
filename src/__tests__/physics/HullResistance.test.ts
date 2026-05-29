import { describe, it, expect } from 'vitest';
import { computeHullResistance } from '@/physics/HullResistance';
import { ILCA7 } from '@/config';

describe('computeHullResistance', () => {
  it('returns zero drag at zero speed', () => {
    const result = computeHullResistance(0, ILCA7);
    expect(result.forwardForce).toBe(0);
  });

  it('produces negative forward force (drag) at positive speed', () => {
    const result = computeHullResistance(2, ILCA7);
    expect(result.forwardForce).toBeLessThan(0);
  });

  it('drag increases with speed', () => {
    const slow = computeHullResistance(1, ILCA7);
    const fast = computeHullResistance(2, ILCA7);
    expect(Math.abs(fast.forwardForce)).toBeGreaterThan(Math.abs(slow.forwardForce));
  });

  it('drag increases dramatically near hull speed', () => {
    const atHalf = computeHullResistance(1.3, ILCA7);
    const nearHull = computeHullResistance(2.5, ILCA7);
    const ratio = Math.abs(nearHull.forwardForce) / Math.abs(atHalf.forwardForce);
    expect(ratio).toBeGreaterThan(3);
  });

  it('produces zero lateral force and yaw torque', () => {
    const result = computeHullResistance(3, ILCA7);
    expect(result.lateralForce).toBe(0);
    expect(result.yawTorque).toBe(0);
  });
});
