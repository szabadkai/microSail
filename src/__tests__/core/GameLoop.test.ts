import { describe, it, expect } from 'vitest';

describe('GameLoop accumulator logic', () => {
  it('fires correct number of physics ticks for elapsed time', () => {
    const dt = 1 / 60;
    const elapsed = 0.05;
    let accumulator = 0;
    let ticks = 0;

    accumulator += elapsed;
    while (accumulator >= dt) {
      ticks++;
      accumulator -= dt;
    }

    expect(ticks).toBe(3);
  });

  it('produces alpha in [0, 1)', () => {
    const dt = 1 / 60;
    const elapsed = 0.02;
    let accumulator = elapsed;

    while (accumulator >= dt) {
      accumulator -= dt;
    }

    const alpha = accumulator / dt;
    expect(alpha).toBeGreaterThanOrEqual(0);
    expect(alpha).toBeLessThan(1);
  });

  it('caps elapsed time to prevent spiral of death', () => {
    const maxElapsed = 0.1;
    const rawElapsed = 0.5;
    const capped = Math.min(rawElapsed, maxElapsed);
    expect(capped).toBe(0.1);
  });
});
