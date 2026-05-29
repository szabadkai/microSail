import type { BoatState, ForceResult } from '@/core/types';
import { clamp, normalizeAngle } from './math';
import type { BoatConfig } from '@/config';

const MAX_SPEED_MS = 8.0;

// Yaw damping: hydrodynamic resistance to turning, proportional to speed
// At higher speeds the hull resists yaw more (realistic: boat tracks better at speed)
const YAW_DAMPING_BASE = 0.6;
const YAW_DAMPING_SPEED_FACTOR = 0.8;

// Added mass coefficient: water entrained with the hull adds ~10-30% effective mass
const ADDED_MASS_FACTOR = 1.15;

// Surge damping: small residual drag that makes the boat coast to a stop gradually
// This supplements HullResistance for very low-speed behavior
const SURGE_DAMPING = 0.3;

export function integrate(
  state: BoatState,
  totalForce: ForceResult,
  boat: BoatConfig,
  dt: number,
): BoatState {
  // Effective mass includes entrained water (added mass)
  const effectiveMass = boat.displacement * ADDED_MASS_FACTOR;
  const forwardAccel = totalForce.forwardForce / effectiveMass;

  // Surge damping: gentle deceleration even without explicit drag forces
  const surgeDamp = -SURGE_DAMPING * state.speed;
  const newSpeed = clamp(state.speed + (forwardAccel + surgeDamp) * dt, 0, MAX_SPEED_MS);

  // Yaw: torque-driven rotation with speed-dependent damping
  const yawAccel = totalForce.yawTorque / boat.yawInertia;
  const speedFactor = 1.0 + YAW_DAMPING_SPEED_FACTOR * Math.min(state.speed, 4.0);
  const yawDampingCoeff = YAW_DAMPING_BASE * speedFactor;
  const yawDampForce = -yawDampingCoeff * state.yawRate;
  let newYawRate = state.yawRate + (yawAccel + yawDampForce) * dt;

  // Clamp yaw rate to prevent spin-outs
  const maxYawRate = 1.5;
  newYawRate = clamp(newYawRate, -maxYawRate, maxYawRate);

  const newHeading = normalizeAngle(state.heading + newYawRate * dt);

  const newPosition = {
    x: state.position.x + newSpeed * Math.sin(newHeading) * dt,
    y: state.position.y + newSpeed * Math.cos(newHeading) * dt,
  };

  return {
    ...state,
    position: newPosition,
    heading: newHeading,
    speed: newSpeed,
    yawRate: newYawRate,
  };
}
