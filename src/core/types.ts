export interface Vec2 {
  x: number;
  y: number;
}

export interface BoatState {
  position: Vec2;
  heading: number;
  speed: number;
  yawRate: number;
  heelAngle: number;
  heelRate: number;
  sailTrimAngle: number;
  rudderAngle: number;
}

export interface WindState {
  trueWindSpeed: number;
  trueWindDirection: number;
}

export interface ForceResult {
  forwardForce: number;
  lateralForce: number;
  yawTorque: number;
}

export interface ApparentWind {
  speed: number;
  angle: number;
  direction: number;
}
