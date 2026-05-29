import type { Vec2 } from '@/core/types';
import type { RaceCourse, RaceState, RacePhase } from './types';
import { sub, magnitude } from '@/physics/math';

const COUNTDOWN_DURATION = 5; // seconds

export class RaceManager {
  readonly course: RaceCourse;
  private state: RaceState;

  constructor(course: RaceCourse) {
    this.course = course;
    this.state = createInitialState();
  }

  get raceState(): RaceState {
    return this.state;
  }

  get phase(): RacePhase {
    return this.state.phase;
  }

  /** Start the countdown sequence */
  startCountdown(): void {
    if (this.state.phase !== 'pre-start') return;
    this.state.phase = 'countdown';
    this.state.countdownTime = COUNTDOWN_DURATION;
  }

  /** Reset race to pre-start */
  reset(): void {
    this.state = createInitialState();
  }

  /** Update race state each physics tick */
  update(dt: number, boatPos: Vec2, boatHeading: number): void {
    switch (this.state.phase) {
      case 'countdown':
        this.updateCountdown(dt);
        break;
      case 'racing':
        this.updateRacing(dt, boatPos, boatHeading);
        break;
    }
  }

  private updateCountdown(dt: number): void {
    this.state.countdownTime -= dt;
    if (this.state.countdownTime <= 0) {
      this.state.phase = 'racing';
      this.state.elapsedTime = -this.state.countdownTime; // account for overshoot
      this.state.countdownTime = 0;
    }
  }

  private updateRacing(dt: number, boatPos: Vec2, boatHeading: number): void {
    this.state.elapsedTime += dt;

    // Check if boat has rounded the next mark
    if (this.state.nextMarkIndex < this.course.marks.length) {
      const mark = this.course.marks[this.state.nextMarkIndex];
      const dist = magnitude(sub(boatPos, mark.position));

      if (dist < mark.radius) {
        // Record leg time
        const prevTime = this.state.legTimes.length > 0
          ? this.state.legTimes.reduce((a, b) => a + b, 0)
          : 0;
        this.state.legTimes.push(this.state.elapsedTime - prevTime);
        this.state.roundedMarks.push(this.state.nextMarkIndex);
        this.state.nextMarkIndex++;
      }
    }

    // Check finish line crossing (only after all marks rounded)
    if (this.state.nextMarkIndex >= this.course.marks.length) {
      if (this.checkLineCrossing(boatPos, boatHeading, this.course.finishLine)) {
        this.state.phase = 'finished';
        this.state.finishTime = this.state.elapsedTime;
      }
    }
  }

  /** Check if boat crosses a line (start or finish) going roughly forward */
  private checkLineCrossing(
    boatPos: Vec2,
    _boatHeading: number,
    line: [Vec2, Vec2],
  ): boolean {
    const [a, b] = line;
    // Line is roughly east-west; check if boat Y is near the line Y
    const lineY = (a.y + b.y) / 2;
    const lineMinX = Math.min(a.x, b.x);
    const lineMaxX = Math.max(a.x, b.x);

    // Within X range of line
    if (boatPos.x < lineMinX - 5 || boatPos.x > lineMaxX + 5) return false;

    // Close to line Y (within 3m)
    if (Math.abs(boatPos.y - lineY) > 3) return false;

    // Check boat is heading roughly in the right direction (not backward)
    // For finish: heading should have a northward component (toward lower Y in this course)
    // We accept any crossing direction for simplicity
    return true;
  }

  /** Distance to the next mark */
  distanceToNextMark(boatPos: Vec2): number | null {
    if (this.state.nextMarkIndex >= this.course.marks.length) return null;
    const mark = this.course.marks[this.state.nextMarkIndex];
    return magnitude(sub(boatPos, mark.position));
  }

  /** Bearing to the next mark in radians */
  bearingToNextMark(boatPos: Vec2): number | null {
    if (this.state.nextMarkIndex >= this.course.marks.length) return null;
    const mark = this.course.marks[this.state.nextMarkIndex];
    const delta = sub(mark.position, boatPos);
    return Math.atan2(delta.x, delta.y);
  }
}

function createInitialState(): RaceState {
  return {
    phase: 'pre-start',
    countdownTime: COUNTDOWN_DURATION,
    elapsedTime: 0,
    nextMarkIndex: 0,
    roundedMarks: [],
    finishTime: null,
    legTimes: [],
  };
}
