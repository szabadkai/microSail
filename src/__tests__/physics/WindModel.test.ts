import { describe, it, expect } from 'vitest';
import { computeApparentWind } from '@/physics/WindModel';
import type { WindState } from '@/core/types';
import { KNOTS_TO_MS } from '@/config';

describe('computeApparentWind', () => {
  // Wind from south (π) = blowing northward
  const wind: WindState = { trueWindSpeed: 12, trueWindDirection: Math.PI };

  it('returns true wind speed when boat is stationary', () => {
    const aw = computeApparentWind(wind, 0, 0);
    expect(aw.speed).toBeCloseTo(12 * KNOTS_TO_MS, 1);
  });

  it('apparent angle is from stern when wind is behind stationary boat', () => {
    // Boat heading north, wind from south = wind from behind = angle ±π
    const aw = computeApparentWind(wind, 0, 0);
    expect(Math.abs(aw.angle)).toBeCloseTo(Math.PI, 1);
  });

  it('increases apparent wind when sailing into the wind', () => {
    // Boat heading south (π) into wind from south
    const aw = computeApparentWind(wind, Math.PI, 2);
    expect(aw.speed).toBeGreaterThan(12 * KNOTS_TO_MS);
  });

  it('apparent wind is from bow when sailing upwind', () => {
    const aw = computeApparentWind(wind, Math.PI, 2);
    expect(Math.abs(aw.angle)).toBeLessThan(0.3);
  });

  it('decreases apparent wind when sailing dead downwind at wind speed', () => {
    const boatSpeed = 12 * KNOTS_TO_MS;
    const aw = computeApparentWind(wind, 0, boatSpeed);
    expect(aw.speed).toBeCloseTo(0, 0);
  });

  it('beam reach rotates apparent wind forward', () => {
    // Boat heading east (π/2), wind from south = beam reach
    const aw = computeApparentWind(wind, Math.PI / 2, 3);
    // Apparent should come from forward of abeam
    expect(Math.abs(aw.angle)).toBeLessThan(Math.PI);
  });
});
