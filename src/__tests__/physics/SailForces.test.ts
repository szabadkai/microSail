import { describe, it, expect } from 'vitest';
import { computeSailForces, lookupCoefficients } from '@/physics/SailForces';
import type { ApparentWind } from '@/core/types';
import { ILCA7 } from '@/config';

describe('lookupCoefficients', () => {
  it('returns zero lift at 0 degrees', () => {
    const { cl } = lookupCoefficients(0);
    expect(cl).toBe(0);
  });

  it('returns peak lift around 20 degrees', () => {
    const { cl } = lookupCoefficients(20);
    expect(cl).toBeGreaterThan(1.2);
  });

  it('returns high drag at 90 degrees', () => {
    const { cd } = lookupCoefficients(90);
    expect(cd).toBeCloseTo(1.4, 1);
  });

  it('interpolates between table entries', () => {
    const { cl } = lookupCoefficients(7.5);
    expect(cl).toBeGreaterThan(0.4);
    expect(cl).toBeLessThan(0.9);
  });

  it('returns zero lift at 90 degrees', () => {
    const { cl } = lookupCoefficients(90);
    expect(cl).toBe(0);
  });
});

describe('computeSailForces', () => {
  it('returns zero force with no wind', () => {
    const aw: ApparentWind = { speed: 0, angle: Math.PI / 2, direction: 0 };
    const result = computeSailForces(aw, 0.3, ILCA7);
    expect(result.forwardForce).toBe(0);
    expect(result.lateralForce).toBe(0);
  });

  it('produces forward force on beam reach with proper trim', () => {
    const aw: ApparentWind = { speed: 6, angle: Math.PI / 2, direction: Math.PI / 2 };
    const sailTrim = 0.6;
    const result = computeSailForces(aw, sailTrim, ILCA7);
    expect(result.forwardForce).toBeGreaterThan(0);
  });

  it('produces near-zero force when luffing (negative angle of attack)', () => {
    const aw: ApparentWind = { speed: 6, angle: 0.1, direction: 0.1 };
    const sailTrim = 0.5;
    const result = computeSailForces(aw, sailTrim, ILCA7);
    expect(result.forwardForce).toBe(0);
  });

  it('produces drag-dominated force when running downwind', () => {
    const aw: ApparentWind = { speed: 3, angle: Math.PI, direction: Math.PI };
    const sailTrim = Math.PI / 2;
    const result = computeSailForces(aw, sailTrim, ILCA7);
    expect(result.forwardForce).toBeGreaterThan(0);
  });
});
