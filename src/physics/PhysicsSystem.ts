import type { BoatState, WindState, ForceResult } from '@/core/types';
import type { BoatConfig } from '@/config';
import { computeApparentWind } from './WindModel';
import { computeSailForces } from './SailForces';
import { computeHullResistance } from './HullResistance';
import { computeRudderForces } from './RudderForces';
import { computeHeel } from './HeelModel';
import { integrate } from './Integration';

function sumForces(...forces: ForceResult[]): ForceResult {
  let forwardForce = 0;
  let lateralForce = 0;
  let yawTorque = 0;
  for (const f of forces) {
    forwardForce += f.forwardForce;
    lateralForce += f.lateralForce;
    yawTorque += f.yawTorque;
  }
  return { forwardForce, lateralForce, yawTorque };
}

export function stepPhysics(
  state: BoatState,
  wind: WindState,
  boat: BoatConfig,
  dt: number,
): BoatState {
  const apparentWind = computeApparentWind(wind, state.heading, state.speed);
  const sailForce = computeSailForces(apparentWind, state.sailTrimAngle, boat);

  // Heel depowers the sail: effective area reduces with cos(heelAngle)
  const depowerFactor = Math.cos(state.heelAngle);
  const depoweredSail: ForceResult = {
    forwardForce: sailForce.forwardForce * depowerFactor,
    lateralForce: sailForce.lateralForce * depowerFactor,
    yawTorque: sailForce.yawTorque,
  };

  const hullForce = computeHullResistance(state.speed, boat);
  const rudderForce = computeRudderForces(state.speed, state.rudderAngle, boat);
  const totalForce = sumForces(depoweredSail, hullForce, rudderForce);

  const windSign = Math.sign(apparentWind.angle) || 1;
  const heel = computeHeel(
    sailForce.lateralForce,
    windSign,
    state.heelAngle,
    state.heelRate,
    boat,
    dt,
  );

  const integrated = integrate(state, totalForce, boat, dt);
  return {
    ...integrated,
    heelAngle: heel.heelAngle,
    heelRate: heel.heelRate,
  };
}
