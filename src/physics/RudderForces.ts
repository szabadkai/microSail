import type { ForceResult } from '@/core/types';
import { RHO_WATER } from '@/config';
import type { BoatConfig } from '@/config';

export function computeRudderForces(
  boatSpeed: number,
  rudderAngle: number,
  boat: BoatConfig,
): ForceResult {
  if (Math.abs(boatSpeed) < 1e-6) {
    return { forwardForce: 0, lateralForce: 0, yawTorque: 0 };
  }

  const dynamicPressure = 0.5 * RHO_WATER * boatSpeed * boatSpeed;
  const liftCoeff = 2 * Math.PI * Math.sin(rudderAngle);
  const lateralForce = dynamicPressure * boat.rudderArea * liftCoeff;

  const armLength = boat.lwl * 0.45;
  const yawTorque = -lateralForce * armLength;

  const dragCoeff = 0.1 * Math.abs(Math.sin(rudderAngle));
  const drag = dynamicPressure * boat.rudderArea * dragCoeff;

  return {
    forwardForce: -drag,
    lateralForce,
    yawTorque,
  };
}
