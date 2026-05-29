import type { BoatConfig } from '@/config';
import { clamp } from './math';

const HEEL_DAMPING = 4.0;
const MAX_HEEL = 60 * (Math.PI / 180);

export interface HeelResult {
  heelAngle: number;
  heelRate: number;
}

// Computes new heel angle from the balance of heeling moment (sail lateral force)
// and righting moment (hull stability + crew weight)
export function computeHeel(
  lateralForce: number,
  windSign: number,
  heelAngle: number,
  heelRate: number,
  boat: BoatConfig,
  dt: number,
): HeelResult {
  const heelingMoment = lateralForce * boat.centreOfEffortHeight * windSign;

  // GZ curve: linear up to ~25°, then flattening (simplified for a dinghy)
  const gz = Math.sin(heelAngle) * (1.0 - 0.3 * Math.abs(heelAngle));
  const rightingMoment = -boat.rightingMomentCoeff * gz;

  const dampingMoment = -HEEL_DAMPING * heelRate * boat.rollInertia;

  const totalMoment = heelingMoment + rightingMoment + dampingMoment;
  const heelAccel = totalMoment / boat.rollInertia;

  const newHeelRate = heelRate + heelAccel * dt;
  const newHeelAngle = clamp(heelAngle + newHeelRate * dt, -MAX_HEEL, MAX_HEEL);

  return { heelAngle: newHeelAngle, heelRate: newHeelRate };
}
