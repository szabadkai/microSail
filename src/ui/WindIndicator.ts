import type { BoatState, WindState, ApparentWind } from '@/core/types';

const SIZE = 120;
const CENTER = SIZE / 2;
const RADIUS = 48;

export class WindIndicator {
  private svg: SVGSVGElement;
  private trueArrow: SVGPolygonElement;
  private apparentArrow: SVGPolygonElement;
  private headingLine: SVGLineElement;

  constructor(container: HTMLElement) {
    this.svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    this.svg.setAttribute('width', String(SIZE));
    this.svg.setAttribute('height', String(SIZE));
    this.svg.setAttribute('viewBox', `0 0 ${SIZE} ${SIZE}`);
    this.svg.classList.add('wind-indicator');

    const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    circle.setAttribute('cx', String(CENTER));
    circle.setAttribute('cy', String(CENTER));
    circle.setAttribute('r', String(RADIUS));
    circle.setAttribute('fill', 'none');
    circle.setAttribute('stroke', 'rgba(255,255,255,0.3)');
    circle.setAttribute('stroke-width', '1');
    this.svg.appendChild(circle);

    this.headingLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    this.headingLine.setAttribute('x1', String(CENTER));
    this.headingLine.setAttribute('y1', String(CENTER));
    this.headingLine.setAttribute('stroke', '#666');
    this.headingLine.setAttribute('stroke-width', '1');
    this.headingLine.setAttribute('stroke-dasharray', '3,3');
    this.svg.appendChild(this.headingLine);

    this.trueArrow = createArrow('#4488ff');
    this.svg.appendChild(this.trueArrow);

    this.apparentArrow = createArrow('#ff8844');
    this.svg.appendChild(this.apparentArrow);

    const boatDot = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    boatDot.setAttribute('cx', String(CENTER));
    boatDot.setAttribute('cy', String(CENTER));
    boatDot.setAttribute('r', '3');
    boatDot.setAttribute('fill', '#fff');
    this.svg.appendChild(boatDot);

    container.appendChild(this.svg);
  }

  update(boat: BoatState, wind: WindState, apparent: ApparentWind): void {
    const trueAngle = wind.trueWindDirection - boat.heading;
    setArrowAngle(this.trueArrow, trueAngle, RADIUS * 0.85);

    setArrowAngle(this.apparentArrow, apparent.angle, RADIUS * 0.7);

    const hx = CENTER + RADIUS * 0.4 * Math.sin(0);
    const hy = CENTER - RADIUS * 0.4 * Math.cos(0);
    this.headingLine.setAttribute('x2', String(hx));
    this.headingLine.setAttribute('y2', String(hy));
  }
}

function createArrow(color: string): SVGPolygonElement {
  const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
  arrow.setAttribute('fill', color);
  arrow.setAttribute('opacity', '0.9');
  return arrow;
}

function setArrowAngle(arrow: SVGPolygonElement, angle: number, length: number): void {
  const tipX = CENTER + length * Math.sin(angle);
  const tipY = CENTER - length * Math.cos(angle);
  const baseLen = 5;
  const perpX = baseLen * Math.cos(angle);
  const perpY = baseLen * Math.sin(angle);

  const b1x = CENTER + perpX;
  const b1y = CENTER + perpY;
  const b2x = CENTER - perpX;
  const b2y = CENTER - perpY;

  arrow.setAttribute('points', `${tipX},${tipY} ${b1x},${b1y} ${b2x},${b2y}`);
}
