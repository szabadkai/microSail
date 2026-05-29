import type { ForceResult } from '@/core/types';
import { RHO_WATER, GRAVITY } from '@/config';
import type { BoatConfig } from '@/config';

export function computeHullResistance(
  boatSpeed: number,
  boat: BoatConfig,
): ForceResult {
  if (Math.abs(boatSpeed) < 1e-6) {
    return { forwardForce: 0, lateralForce: 0, yawTorque: 0 };
  }

  const frictional =
    0.5 * RHO_WATER * boatSpeed * boatSpeed * boat.wettedSurfaceArea * boat.frictionCoeff;

  const froude = Math.abs(boatSpeed) / Math.sqrt(GRAVITY * boat.lwl);
  const froudeRatio = froude / 0.4;
  const waveCoeff = 0.02 * Math.pow(froudeRatio, 8);
  const waveMaking = boat.displacement * GRAVITY * waveCoeff;

  const totalDrag = frictional + waveMaking;
  const direction = boatSpeed > 0 ? -1 : 1;

  return {
    forwardForce: direction * totalDrag,
    lateralForce: 0,
    yawTorque: 0,
  };
}
