export interface BoatConfig {
  name: string;
  lwl: number;
  loa: number;
  beam: number;
  displacement: number;
  sailArea: number;
  mastHeight: number;
  centreOfEffortHeight: number;
  wettedSurfaceArea: number;
  rudderArea: number;
  frictionCoeff: number;
  yawInertia: number;
  rollInertia: number;
  rightingMomentCoeff: number;
  hullSpeed: number;
}

export const ILCA7: BoatConfig = {
  name: 'ILCA 7 (Laser)',
  lwl: 3.96,
  loa: 4.23,
  beam: 1.37,
  displacement: 130,
  sailArea: 7.06,
  mastHeight: 5.76,
  centreOfEffortHeight: 3.2,
  wettedSurfaceArea: 2.5,
  rudderArea: 0.06,
  frictionCoeff: 0.003,
  yawInertia: 150,
  rollInertia: 60,
  rightingMomentCoeff: 1800,
  hullSpeed: 1.34 * Math.sqrt(3.96 * 3.281),
};
