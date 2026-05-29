import { describe, it, expect } from 'vitest';
import { computeHeel } from '@/physics/HeelModel';
import { ILCA7 } from '@/config';

const dt = 1 / 60;

describe('computeHeel', () => {
  it('stays at zero with no lateral force', () => {
    const result = computeHeel(0, 1, 0, 0, ILCA7, dt);
    expect(result.heelAngle).toBeCloseTo(0, 4);
    expect(result.heelRate).toBeCloseTo(0, 4);
  });

  it('heels to leeward with lateral force from starboard wind', () => {
    let heel = 0;
    let rate = 0;
    for (let i = 0; i < 120; i++) {
      const r = computeHeel(200, 1, heel, rate, ILCA7, dt);
      heel = r.heelAngle;
      rate = r.heelRate;
    }
    expect(heel).toBeGreaterThan(0.05);
  });

  it('heels to opposite side with port wind', () => {
    let heel = 0;
    let rate = 0;
    for (let i = 0; i < 120; i++) {
      const r = computeHeel(200, -1, heel, rate, ILCA7, dt);
      heel = r.heelAngle;
      rate = r.heelRate;
    }
    expect(heel).toBeLessThan(-0.05);
  });

  it('reaches equilibrium and stops accelerating', () => {
    let heel = 0;
    let rate = 0;
    for (let i = 0; i < 600; i++) {
      const r = computeHeel(150, 1, heel, rate, ILCA7, dt);
      heel = r.heelAngle;
      rate = r.heelRate;
    }
    expect(Math.abs(rate)).toBeLessThan(0.1);
    expect(heel).toBeGreaterThan(0);
  });

  it('does not exceed max heel', () => {
    let heel = 0;
    let rate = 0;
    for (let i = 0; i < 600; i++) {
      const r = computeHeel(5000, 1, heel, rate, ILCA7, dt);
      heel = r.heelAngle;
      rate = r.heelRate;
    }
    const maxHeel = 60 * (Math.PI / 180);
    expect(Math.abs(heel)).toBeLessThanOrEqual(maxHeel + 0.01);
  });

  it('settles to realistic heel angle for moderate lateral force', () => {
    // ~150N lateral force is typical beam reach in 12 knots
    let heel = 0;
    let rate = 0;
    for (let i = 0; i < 600; i++) {
      const r = computeHeel(150, 1, heel, rate, ILCA7, dt);
      heel = r.heelAngle;
      rate = r.heelRate;
    }
    const heelDeg = heel * (180 / Math.PI);
    expect(heelDeg).toBeGreaterThan(5);
    expect(heelDeg).toBeLessThan(30);
  });

  it('returns to zero when force is removed', () => {
    let heel = 0.3;
    let rate = 0;
    for (let i = 0; i < 600; i++) {
      const r = computeHeel(0, 1, heel, rate, ILCA7, dt);
      heel = r.heelAngle;
      rate = r.heelRate;
    }
    expect(Math.abs(heel)).toBeLessThan(0.02);
  });
});
