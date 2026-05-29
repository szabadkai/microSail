import type { BoatState, WindState, ApparentWind } from '@/core/types';
import { MS_TO_KNOTS, RAD_TO_DEG } from '@/config';
import { WindIndicator } from './WindIndicator';
import './styles.css';

export class HUD {
  private speedEl: HTMLElement;
  private headingEl: HTMLElement;
  private trimEl: HTMLElement;
  private rudderEl: HTMLElement;
  private heelEl: HTMLElement;
  private twsEl: HTMLElement;
  private twdEl: HTMLElement;
  private awsEl: HTMLElement;
  private windIndicator: WindIndicator;

  constructor(overlay: HTMLElement) {
    const topLeft = createPanel(overlay, 'hud-top-left');
    topLeft.innerHTML = `
      <div class="hud-row">
        <div class="hud-item">
          <div class="hud-label">Speed</div>
          <div class="hud-value" id="hud-speed">0.0</div>
        </div>
        <div class="hud-item">
          <div class="hud-label">Heading</div>
          <div class="hud-value" id="hud-heading">000</div>
        </div>
      </div>
      <div class="hud-row" style="margin-top:8px">
        <div class="hud-item">
          <div class="hud-label">Sail Trim</div>
          <div class="hud-value-small" id="hud-trim">45°</div>
        </div>
        <div class="hud-item">
          <div class="hud-label">Rudder</div>
          <div class="hud-value-small" id="hud-rudder">0°</div>
        </div>
        <div class="hud-item">
          <div class="hud-label">Heel</div>
          <div class="hud-value-small" id="hud-heel">0°</div>
        </div>
      </div>
    `;

    const topRight = createPanel(overlay, 'hud-top-right');
    topRight.innerHTML = `
      <div class="hud-row">
        <div class="hud-item">
          <div class="hud-label">TWS</div>
          <div class="hud-value-small" id="hud-tws">12</div>
        </div>
        <div class="hud-item">
          <div class="hud-label">TWD</div>
          <div class="hud-value-small" id="hud-twd">180°</div>
        </div>
        <div class="hud-item">
          <div class="hud-label">AWS</div>
          <div class="hud-value-small" id="hud-aws">0</div>
        </div>
      </div>
      <div id="wind-indicator-container" style="margin-top:8px"></div>
    `;

    const bottomCenter = createPanel(overlay, 'hud-bottom-center');
    bottomCenter.innerHTML = `
      <div class="controls-hint">
        A/← D/→ Rudder &nbsp;&nbsp; W/↑ Sheet In &nbsp;&nbsp; S/↓ Sheet Out &nbsp;&nbsp; Drag Camera &nbsp;&nbsp; Scroll Zoom
      </div>
    `;

    this.speedEl = document.getElementById('hud-speed')!;
    this.headingEl = document.getElementById('hud-heading')!;
    this.trimEl = document.getElementById('hud-trim')!;
    this.rudderEl = document.getElementById('hud-rudder')!;
    this.heelEl = document.getElementById('hud-heel')!;
    this.twsEl = document.getElementById('hud-tws')!;
    this.twdEl = document.getElementById('hud-twd')!;
    this.awsEl = document.getElementById('hud-aws')!;

    const windContainer = document.getElementById('wind-indicator-container')!;
    this.windIndicator = new WindIndicator(windContainer);
  }

  update(boat: BoatState, wind: WindState, apparent: ApparentWind): void {
    this.speedEl.textContent = (boat.speed * MS_TO_KNOTS).toFixed(1);
    const headingDeg = ((boat.heading * RAD_TO_DEG % 360) + 360) % 360;
    this.headingEl.textContent = headingDeg.toFixed(0).padStart(3, '0');
    this.trimEl.textContent = `${(boat.sailTrimAngle * RAD_TO_DEG).toFixed(0)}°`;
    this.rudderEl.textContent = `${(boat.rudderAngle * RAD_TO_DEG).toFixed(0)}°`;
    this.heelEl.textContent = `${(boat.heelAngle * RAD_TO_DEG).toFixed(0)}°`;
    this.twsEl.textContent = wind.trueWindSpeed.toFixed(0);
    this.twdEl.textContent = `${((wind.trueWindDirection * RAD_TO_DEG % 360 + 360) % 360).toFixed(0)}°`;
    this.awsEl.textContent = (apparent.speed * MS_TO_KNOTS).toFixed(1);
    this.windIndicator.update(boat, wind, apparent);
  }
}

function createPanel(overlay: HTMLElement, className: string): HTMLElement {
  const panel = document.createElement('div');
  panel.className = `hud-panel ${className}`;
  overlay.appendChild(panel);
  return panel;
}
