import type { ForceResult, ApparentWind } from '@/core/types';
import { RHO_AIR } from '@/config';
import type { BoatConfig } from '@/config';

interface CoefficientEntry {
  angle: number;
  cl: number;
  cd: number;
}

const SAIL_COEFFICIENTS: CoefficientEntry[] = [
  { angle: 0, cl: 0.0, cd: 0.05 },
  { angle: 5, cl: 0.4, cd: 0.05 },
  { angle: 10, cl: 0.9, cd: 0.07 },
  { angle: 15, cl: 1.2, cd: 0.12 },
  { angle: 20, cl: 1.3, cd: 0.20 },
  { angle: 25, cl: 1.25, cd: 0.30 },
  { angle: 30, cl: 1.1, cd: 0.42 },
  { angle: 40, cl: 0.8, cd: 0.70 },
  { angle: 50, cl: 0.55, cd: 0.95 },
  { angle: 60, cl: 0.35, cd: 1.15 },
  { angle: 70, cl: 0.2, cd: 1.30 },
  { angle: 80, cl: 0.1, cd: 1.38 },
  { angle: 90, cl: 0.0, cd: 1.40 },
];

function interpolateCoefficient(
  table: CoefficientEntry[],
  angleDeg: number,
): { cl: number; cd: number } {
  const a = Math.abs(angleDeg);
  if (a <= table[0].angle) return { cl: table[0].cl, cd: table[0].cd };
  if (a >= table[table.length - 1].angle) {
    const last = table[table.length - 1];
    return { cl: last.cl, cd: last.cd };
  }
  for (let i = 0; i < table.length - 1; i++) {
    if (a >= table[i].angle && a <= table[i + 1].angle) {
      const t = (a - table[i].angle) / (table[i + 1].angle - table[i].angle);
      return {
        cl: table[i].cl + t * (table[i + 1].cl - table[i].cl),
        cd: table[i].cd + t * (table[i + 1].cd - table[i].cd),
      };
    }
  }
  const last = table[table.length - 1];
  return { cl: last.cl, cd: last.cd };
}

export function lookupCoefficients(angleDeg: number): { cl: number; cd: number } {
  return interpolateCoefficient(SAIL_COEFFICIENTS, angleDeg);
}

// Standard sail force decomposition: lift ⊥ wind, drag ∥ wind, resolved into boat frame
export function computeSailForces(
  apparentWind: ApparentWind,
  sailTrimAngle: number,
  boat: BoatConfig,
): ForceResult {
  if (apparentWind.speed < 0.01) {
    return { forwardForce: 0, lateralForce: 0, yawTorque: 0 };
  }

  const absWindAngle = Math.abs(apparentWind.angle);
  const angleOfAttack = absWindAngle - sailTrimAngle;
  const angleOfAttackDeg = angleOfAttack * (180 / Math.PI);

  if (angleOfAttackDeg < 0) {
    return { forwardForce: 0, lateralForce: 0, yawTorque: 0 };
  }

  const { cl, cd } = lookupCoefficients(angleOfAttackDeg);
  const q = 0.5 * RHO_AIR * apparentWind.speed * apparentWind.speed;
  const liftMag = q * boat.sailArea * cl;
  const dragMag = q * boat.sailArea * cd;

  const forwardForce = liftMag * Math.sin(absWindAngle) - dragMag * Math.cos(absWindAngle);
  const lateralForce = liftMag * Math.cos(absWindAngle) + dragMag * Math.sin(absWindAngle);

  return { forwardForce, lateralForce, yawTorque: 0 };
}
