import type { ControlState } from './types';
import { clamp } from '@/physics/math';
import { DEG_TO_RAD } from '@/config';

const RUDDER_RATE = 60 * DEG_TO_RAD;
const SHEET_RATE = 40 * DEG_TO_RAD;
const MAX_RUDDER = 35 * DEG_TO_RAD;
const MIN_TRIM = 5 * DEG_TO_RAD;
const MAX_TRIM = 90 * DEG_TO_RAD;

export class InputManager {
  private keys = new Set<string>();
  private state: ControlState = {
    rudderAngle: 0,
    sailTrimAngle: 45 * DEG_TO_RAD,
    rudderInput: 0,
    sheetInput: 0,
  };

  constructor() {
    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    this.keys.add(e.code);
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.code);
  };

  update(dt: number): ControlState {
    this.state.rudderInput = 0;
    if (this.keys.has('ArrowLeft') || this.keys.has('KeyA')) this.state.rudderInput += 1;
    if (this.keys.has('ArrowRight') || this.keys.has('KeyD')) this.state.rudderInput -= 1;

    this.state.sheetInput = 0;
    if (this.keys.has('ArrowUp') || this.keys.has('KeyW')) this.state.sheetInput -= 1;
    if (this.keys.has('ArrowDown') || this.keys.has('KeyS')) this.state.sheetInput += 1;

    this.state.rudderAngle = clamp(
      this.state.rudderAngle + this.state.rudderInput * RUDDER_RATE * dt,
      -MAX_RUDDER,
      MAX_RUDDER,
    );

    if (this.state.rudderInput === 0) {
      const centerRate = RUDDER_RATE * 0.5 * dt;
      if (Math.abs(this.state.rudderAngle) < centerRate) {
        this.state.rudderAngle = 0;
      } else {
        this.state.rudderAngle -= Math.sign(this.state.rudderAngle) * centerRate;
      }
    }

    this.state.sailTrimAngle = clamp(
      this.state.sailTrimAngle + this.state.sheetInput * SHEET_RATE * dt,
      MIN_TRIM,
      MAX_TRIM,
    );

    return { ...this.state };
  }

  destroy(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }
}
