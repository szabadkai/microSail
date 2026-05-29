import type { Vec2, WindState, ApparentWind } from '@/core/types';
import { add, magnitude } from './math';
import { KNOTS_TO_MS } from '@/config';

// Returns a vector pointing in the direction wind comes FROM, with magnitude = wind speed
export function getTrueWindVector(wind: WindState): Vec2 {
  const speedMs = wind.trueWindSpeed * KNOTS_TO_MS;
  return {
    x: speedMs * Math.sin(wind.trueWindDirection),
    y: speedMs * Math.cos(wind.trueWindDirection),
  };
}

export function computeApparentWind(
  wind: WindState,
  boatHeading: number,
  boatSpeed: number,
): ApparentWind {
  const trueFrom = getTrueWindVector(wind);

  // Boat motion creates a headwind FROM the direction of travel
  const headwind: Vec2 = {
    x: boatSpeed * Math.sin(boatHeading),
    y: boatSpeed * Math.cos(boatHeading),
  };

  // Apparent wind FROM direction = true wind FROM + headwind FROM boat motion
  const apparent = add(trueFrom, headwind);
  const speed = magnitude(apparent);
  const direction = Math.atan2(apparent.x, apparent.y);

  // Angle relative to boat heading (0 = from bow, ±π = from stern)
  let angle = direction - boatHeading;
  angle = Math.atan2(Math.sin(angle), Math.cos(angle));

  return { speed, angle, direction };
}
