import type { BoatState, WindState } from './types';
import { DEG_TO_RAD } from '@/config';

export class World {
  boat: BoatState;
  wind: WindState;

  constructor() {
    this.boat = {
      position: { x: 0, y: 0 },
      heading: 0,
      speed: 0,
      yawRate: 0,
      heelAngle: 0,
      heelRate: 0,
      sailTrimAngle: 45 * DEG_TO_RAD,
      rudderAngle: 0,
    };

    this.wind = {
      trueWindSpeed: 12,
      trueWindDirection: Math.PI,
    };
  }
}
