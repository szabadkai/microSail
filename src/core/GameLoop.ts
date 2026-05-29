import { PHYSICS_DT } from '@/config';

export class GameLoop {
  private accumulator = 0;
  private lastTime = 0;
  private running = false;
  private rafId = 0;

  private onPhysicsTick: (dt: number) => void;
  private onRenderFrame: (alpha: number) => void;

  constructor(
    onPhysicsTick: (dt: number) => void,
    onRenderFrame: (alpha: number) => void,
  ) {
    this.onPhysicsTick = onPhysicsTick;
    this.onRenderFrame = onRenderFrame;
  }

  start(): void {
    this.running = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.rafId = requestAnimationFrame(this.tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.rafId);
  }

  private tick = (now: number): void => {
    if (!this.running) return;

    const elapsed = Math.min((now - this.lastTime) / 1000, 0.1);
    this.lastTime = now;
    this.accumulator += elapsed;

    while (this.accumulator >= PHYSICS_DT) {
      this.onPhysicsTick(PHYSICS_DT);
      this.accumulator -= PHYSICS_DT;
    }

    const alpha = this.accumulator / PHYSICS_DT;
    this.onRenderFrame(alpha);

    this.rafId = requestAnimationFrame(this.tick);
  };
}
