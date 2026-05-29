import type { RaceCourse } from './types';

/**
 * Windward-leeward course: classic upwind/downwind racing.
 * Wind blows from south (180°), so upwind mark is to the north (+Y).
 * Start near origin, beat upwind to mark 1, run downwind to mark 2, finish.
 *
 * Layout (physics coords, +Y = north):
 *   Mark 1 (windward):  (0, 200)
 *   Mark 2 (leeward):   (0, 0)
 *   Start line: y = 10, from x = -25 to x = +25
 *   Finish line: y = 5, from x = -25 to x = +25
 */
export const WINDWARD_LEEWARD: RaceCourse = {
  name: 'Windward-Leeward',
  marks: [
    {
      position: { x: 0, y: 200 },
      name: 'Windward',
      rounding: 'port',
      radius: 10,
    },
    {
      position: { x: 0, y: 0 },
      name: 'Leeward',
      rounding: 'port',
      radius: 10,
    },
  ],
  startLine: [
    { x: -25, y: 10 },
    { x: 25, y: 10 },
  ],
  finishLine: [
    { x: -25, y: 5 },
    { x: 25, y: 5 },
  ],
};

/**
 * Triangle course: windward mark, reaching mark, leeward mark.
 * Tests all points of sail.
 */
export const TRIANGLE: RaceCourse = {
  name: 'Triangle',
  marks: [
    {
      position: { x: 0, y: 200 },
      name: 'Windward',
      rounding: 'port',
      radius: 10,
    },
    {
      position: { x: 120, y: 100 },
      name: 'Reaching',
      rounding: 'port',
      radius: 10,
    },
    {
      position: { x: 0, y: 0 },
      name: 'Leeward',
      rounding: 'port',
      radius: 10,
    },
  ],
  startLine: [
    { x: -25, y: 10 },
    { x: 25, y: 10 },
  ],
  finishLine: [
    { x: -25, y: 5 },
    { x: 25, y: 5 },
  ],
};

export const ALL_COURSES: RaceCourse[] = [WINDWARD_LEEWARD, TRIANGLE];
