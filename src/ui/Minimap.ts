import type { BoatState, WindState } from '@/core/types';
import type { RaceCourse } from '@/race/types';
import type { RaceManager } from '@/race/RaceManager';

const MAP_SIZE = 180;
const PADDING = 20;

export class Minimap {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private course: RaceCourse;

  // Computed bounds of the course for scaling
  private minX: number;
  private maxX: number;
  private minY: number;
  private maxY: number;
  private scale: number;
  private offsetX: number;
  private offsetY: number;

  constructor(overlay: HTMLElement, course: RaceCourse) {
    this.course = course;

    this.canvas = document.createElement('canvas');
    this.canvas.width = MAP_SIZE * 2; // retina
    this.canvas.height = MAP_SIZE * 2;
    this.canvas.style.width = `${MAP_SIZE}px`;
    this.canvas.style.height = `${MAP_SIZE}px`;
    this.canvas.className = 'minimap-canvas';

    const panel = document.createElement('div');
    panel.className = 'hud-panel minimap-panel';
    panel.appendChild(this.canvas);
    overlay.appendChild(panel);

    this.ctx = this.canvas.getContext('2d')!;

    // Compute bounds from all course points
    const allPoints = [
      ...course.marks.map((m) => m.position),
      ...course.startLine,
      ...course.finishLine,
    ];

    this.minX = Math.min(...allPoints.map((p) => p.x)) - 30;
    this.maxX = Math.max(...allPoints.map((p) => p.x)) + 30;
    this.minY = Math.min(...allPoints.map((p) => p.y)) - 30;
    this.maxY = Math.max(...allPoints.map((p) => p.y)) + 30;

    const rangeX = this.maxX - this.minX;
    const rangeY = this.maxY - this.minY;
    const drawSize = MAP_SIZE * 2 - PADDING * 2;
    this.scale = drawSize / Math.max(rangeX, rangeY);
    this.offsetX = PADDING + (drawSize - rangeX * this.scale) / 2;
    this.offsetY = PADDING + (drawSize - rangeY * this.scale) / 2;
  }

  /** Convert physics coords to canvas coords */
  private toCanvas(x: number, y: number): [number, number] {
    // Physics Y goes up (north), canvas Y goes down
    return [
      this.offsetX + (x - this.minX) * this.scale,
      this.offsetY + (this.maxY - y) * this.scale,
    ];
  }

  update(boat: BoatState, wind: WindState, race: RaceManager): void {
    const ctx = this.ctx;
    const w = MAP_SIZE * 2;
    const h = MAP_SIZE * 2;

    ctx.clearRect(0, 0, w, h);

    // Background
    ctx.fillStyle = 'rgba(0, 30, 50, 0.85)';
    ctx.fillRect(0, 0, w, h);

    // Water grid lines (subtle)
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    const gridStep = 50; // meters
    for (let gx = Math.ceil(this.minX / gridStep) * gridStep; gx <= this.maxX; gx += gridStep) {
      const [cx] = this.toCanvas(gx, 0);
      ctx.beginPath();
      ctx.moveTo(cx, 0);
      ctx.lineTo(cx, h);
      ctx.stroke();
    }
    for (let gy = Math.ceil(this.minY / gridStep) * gridStep; gy <= this.maxY; gy += gridStep) {
      const [, cy] = this.toCanvas(0, gy);
      ctx.beginPath();
      ctx.moveTo(0, cy);
      ctx.lineTo(w, cy);
      ctx.stroke();
    }

    // Course leg lines (dashed)
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1.5;
    ctx.setLineDash([6, 4]);
    const marks = this.course.marks;
    for (let i = 0; i < marks.length - 1; i++) {
      const [x1, y1] = this.toCanvas(marks[i].position.x, marks[i].position.y);
      const [x2, y2] = this.toCanvas(marks[i + 1].position.x, marks[i + 1].position.y);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Start line (green)
    this.drawLine(this.course.startLine, '#44ff44', 2);

    // Finish line (blue)
    this.drawLine(this.course.finishLine, '#4488ff', 2);

    // Course marks (buoys)
    const state = race.raceState;
    for (let i = 0; i < marks.length; i++) {
      const [cx, cy] = this.toCanvas(marks[i].position.x, marks[i].position.y);
      const isNext = i === state.nextMarkIndex && state.phase === 'racing';
      const isRounded = state.roundedMarks.includes(i);

      // Rounded marks are dimmed
      if (isRounded) {
        ctx.globalAlpha = 0.4;
      }

      // Draw buoy dot
      ctx.fillStyle = marks[i].rounding === 'port' ? '#ff4444' : '#44cc44';
      ctx.beginPath();
      ctx.arc(cx, cy, isNext ? 7 : 5, 0, Math.PI * 2);
      ctx.fill();

      // Next mark gets a pulsing ring
      if (isNext) {
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cx, cy, 11, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Mark name label
      ctx.fillStyle = isNext ? '#ffff00' : '#aaa';
      ctx.font = '18px "Courier New", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(marks[i].name, cx, cy - 14);

      ctx.globalAlpha = 1.0;
    }

    // Wind arrow (top of map)
    this.drawWindArrow(wind);

    // Boat triangle
    const [bx, by] = this.toCanvas(boat.position.x, boat.position.y);
    ctx.save();
    ctx.translate(bx, by);
    // Heading: 0 = north = up on minimap. Canvas rotation is clockwise.
    ctx.rotate(boat.heading);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, -8);  // bow (up = north when heading=0)
    ctx.lineTo(-4, 5);
    ctx.lineTo(4, 5);
    ctx.closePath();
    ctx.fill();

    // Speed trail (small line behind)
    if (boat.speed > 0.5) {
      const trailLen = Math.min(boat.speed * 3, 15);
      ctx.strokeStyle = 'rgba(255,255,255,0.4)';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(0, 5);
      ctx.lineTo(0, 5 + trailLen);
      ctx.stroke();
    }
    ctx.restore();

    // Bearing line to next mark
    if (state.phase === 'racing' && state.nextMarkIndex < marks.length) {
      const nextMark = marks[state.nextMarkIndex];
      const [mx, my] = this.toCanvas(nextMark.position.x, nextMark.position.y);
      ctx.strokeStyle = 'rgba(255,255,0,0.25)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(bx, by);
      ctx.lineTo(mx, my);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  private drawLine(
    line: [{ x: number; y: number }, { x: number; y: number }],
    color: string,
    width: number,
  ): void {
    const [x1, y1] = this.toCanvas(line[0].x, line[0].y);
    const [x2, y2] = this.toCanvas(line[1].x, line[1].y);
    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = width;
    this.ctx.beginPath();
    this.ctx.moveTo(x1, y1);
    this.ctx.lineTo(x2, y2);
    this.ctx.stroke();
  }

  private drawWindArrow(wind: WindState): void {
    const ctx = this.ctx;
    const cx = MAP_SIZE * 2 - 30;
    const cy = 30;
    const len = 20;

    // Wind direction: angle wind comes FROM. Arrow should point in the direction wind is blowing TO.
    const toAngle = wind.trueWindDirection + Math.PI;
    const dx = Math.sin(toAngle) * len;
    const dy = -Math.cos(toAngle) * len; // canvas y is inverted

    ctx.strokeStyle = '#4488ff';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(cx - dx, cy - dy);
    ctx.lineTo(cx + dx, cy + dy);
    ctx.stroke();

    // Arrowhead
    const headLen = 7;
    const headAngle = 0.5;
    ctx.beginPath();
    ctx.moveTo(cx + dx, cy + dy);
    ctx.lineTo(
      cx + dx - headLen * Math.sin(toAngle - headAngle),
      cy + dy + headLen * Math.cos(toAngle - headAngle),
    );
    ctx.moveTo(cx + dx, cy + dy);
    ctx.lineTo(
      cx + dx - headLen * Math.sin(toAngle + headAngle),
      cy + dy + headLen * Math.cos(toAngle + headAngle),
    );
    ctx.stroke();

    // "W" label
    ctx.fillStyle = '#4488ff';
    ctx.font = '16px "Courier New", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('W', cx, cy + len + 16);
  }
}
