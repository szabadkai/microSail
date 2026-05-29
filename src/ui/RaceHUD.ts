import type { BoatState } from '@/core/types';
import type { RaceManager } from '@/race/RaceManager';
import { RAD_TO_DEG } from '@/config';
import './styles.css';

export class RaceHUD {
  private container: HTMLElement;
  private countdownEl: HTMLElement;
  private timerEl: HTMLElement;
  private legInfoEl: HTMLElement;
  private finishOverlay: HTMLElement;
  private startPrompt: HTMLElement;

  constructor(overlay: HTMLElement) {
    this.container = document.createElement('div');
    this.container.className = 'race-hud';
    overlay.appendChild(this.container);

    // Top center: countdown / race timer
    this.countdownEl = document.createElement('div');
    this.countdownEl.className = 'race-countdown';
    this.countdownEl.style.display = 'none';
    this.container.appendChild(this.countdownEl);

    this.timerEl = document.createElement('div');
    this.timerEl.className = 'hud-panel race-timer';
    this.timerEl.style.display = 'none';
    this.container.appendChild(this.timerEl);

    // Right side: leg info (next mark, distance, bearing)
    this.legInfoEl = document.createElement('div');
    this.legInfoEl.className = 'hud-panel race-leg-info';
    this.legInfoEl.style.display = 'none';
    this.container.appendChild(this.legInfoEl);

    // Center: finish overlay
    this.finishOverlay = document.createElement('div');
    this.finishOverlay.className = 'race-finish-overlay';
    this.finishOverlay.style.display = 'none';
    this.container.appendChild(this.finishOverlay);

    // Start prompt
    this.startPrompt = document.createElement('div');
    this.startPrompt.className = 'race-start-prompt';
    this.startPrompt.innerHTML = `
      <div class="hud-panel" style="padding:20px 30px;text-align:center">
        <div style="font-size:18px;color:#fff;margin-bottom:8px">microSail Race</div>
        <div style="font-size:12px;color:#aaa;margin-bottom:12px">Windward-Leeward Course</div>
        <div style="font-size:14px;color:#ffcc44">Press SPACE to start race</div>
        <div style="font-size:11px;color:#666;margin-top:8px">Round all marks, then cross the finish</div>
      </div>
    `;
    this.container.appendChild(this.startPrompt);
  }

  update(boat: BoatState, race: RaceManager): void {
    const state = race.raceState;

    switch (state.phase) {
      case 'pre-start':
        this.showPreStart();
        break;
      case 'countdown':
        this.showCountdown(state.countdownTime);
        break;
      case 'racing':
        this.showRacing(boat, race);
        break;
      case 'finished':
        this.showFinished(state.finishTime!, state.legTimes);
        break;
    }
  }

  private showPreStart(): void {
    this.startPrompt.style.display = 'block';
    this.countdownEl.style.display = 'none';
    this.timerEl.style.display = 'none';
    this.legInfoEl.style.display = 'none';
    this.finishOverlay.style.display = 'none';
  }

  private showCountdown(time: number): void {
    this.startPrompt.style.display = 'none';
    this.countdownEl.style.display = 'block';
    this.timerEl.style.display = 'none';
    this.legInfoEl.style.display = 'none';
    this.finishOverlay.style.display = 'none';

    const seconds = Math.ceil(time);
    this.countdownEl.textContent = seconds > 0 ? String(seconds) : 'GO!';
    this.countdownEl.className = `race-countdown ${seconds <= 0 ? 'race-countdown-go' : ''}`;
  }

  private showRacing(boat: BoatState, race: RaceManager): void {
    this.startPrompt.style.display = 'none';
    this.countdownEl.style.display = 'none';
    this.timerEl.style.display = 'block';
    this.legInfoEl.style.display = 'block';
    this.finishOverlay.style.display = 'none';

    const state = race.raceState;

    // Timer
    this.timerEl.textContent = formatTime(state.elapsedTime);

    // Leg info
    const dist = race.distanceToNextMark(boat.position);
    const bearing = race.bearingToNextMark(boat.position);

    if (dist !== null && bearing !== null) {
      const markName = race.course.marks[state.nextMarkIndex]?.name ?? 'Finish';
      const bearingDeg = ((bearing * RAD_TO_DEG % 360) + 360) % 360;
      const legNum = state.roundedMarks.length + 1;
      const totalLegs = race.course.marks.length;

      this.legInfoEl.innerHTML = `
        <div class="hud-label">Next Mark</div>
        <div class="hud-value" style="font-size:14px;color:#ffcc44">${markName}</div>
        <div style="margin-top:6px">
          <span class="hud-label">Dist</span>
          <span class="hud-value-small">${dist.toFixed(0)}m</span>
        </div>
        <div>
          <span class="hud-label">Bearing</span>
          <span class="hud-value-small">${bearingDeg.toFixed(0)}°</span>
        </div>
        <div style="margin-top:6px">
          <span class="hud-label">Leg</span>
          <span class="hud-value-small">${legNum}/${totalLegs}</span>
        </div>
      `;
    } else {
      // All marks rounded — heading for finish
      this.legInfoEl.innerHTML = `
        <div class="hud-label">Next</div>
        <div class="hud-value" style="font-size:14px;color:#4488ff">FINISH LINE</div>
        <div style="margin-top:6px">
          <span class="hud-label">Cross the line!</span>
        </div>
      `;
    }
  }

  private showFinished(finishTime: number, legTimes: number[]): void {
    this.startPrompt.style.display = 'none';
    this.countdownEl.style.display = 'none';
    this.timerEl.style.display = 'none';
    this.legInfoEl.style.display = 'none';
    this.finishOverlay.style.display = 'flex';

    const legRows = legTimes.map((t, i) =>
      `<div style="display:flex;justify-content:space-between;margin:4px 0">
        <span style="color:#aaa">Leg ${i + 1}</span>
        <span style="color:#ccc">${formatTime(t)}</span>
      </div>`
    ).join('');

    this.finishOverlay.innerHTML = `
      <div class="hud-panel" style="padding:24px 36px;text-align:center;min-width:250px">
        <div style="font-size:14px;color:#44ff44;letter-spacing:2px">FINISHED</div>
        <div style="font-size:32px;color:#fff;margin:12px 0;font-weight:bold">
          ${formatTime(finishTime)}
        </div>
        <div style="border-top:1px solid rgba(255,255,255,0.15);padding-top:10px;margin-top:8px">
          ${legRows}
        </div>
        <div style="margin-top:16px;font-size:12px;color:#ffcc44">
          Press SPACE to race again
        </div>
      </div>
    `;
  }
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toFixed(1).padStart(4, '0')}`;
}
