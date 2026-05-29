import type { Vec2 } from '@/core/types';

export interface CourseMark {
  position: Vec2;
  name: string;
  /** Rounding direction: 'port' = leave to port, 'starboard' = leave to starboard */
  rounding: 'port' | 'starboard';
  /** Radius for rounding detection (meters) */
  radius: number;
}

export interface RaceCourse {
  name: string;
  marks: CourseMark[];
  /** Start line: pair of positions (pin end, committee boat end) */
  startLine: [Vec2, Vec2];
  /** Finish line: pair of positions */
  finishLine: [Vec2, Vec2];
}

export type RacePhase =
  | 'pre-start'   // waiting for countdown
  | 'countdown'   // countdown sequence running
  | 'racing'      // race in progress
  | 'finished';   // crossed finish line

export interface RaceState {
  phase: RacePhase;
  /** Time remaining in countdown (seconds), negative = time since start */
  countdownTime: number;
  /** Elapsed race time once racing (seconds) */
  elapsedTime: number;
  /** Index of the next mark to round */
  nextMarkIndex: number;
  /** Marks already rounded */
  roundedMarks: number[];
  /** Final time if finished */
  finishTime: number | null;
  /** Best split times per leg */
  legTimes: number[];
}
