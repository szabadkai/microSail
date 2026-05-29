import { GameLoop, World } from '@/core';
import { ILCA7, PHYSICS_DT } from '@/config';
import { stepPhysics, computeApparentWind } from '@/physics';
import { InputManager } from '@/input';
import {
  SceneManager, WaterRenderer, SkyRenderer,
  BoatRenderer, CameraController, WakeRenderer,
  MarkRenderer,
} from '@/rendering';
import { HUD, Minimap, RaceHUD } from '@/ui';
import { RaceManager, WINDWARD_LEEWARD } from '@/race';

const canvas = document.getElementById('game-canvas') as HTMLCanvasElement;
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
const overlay = document.getElementById('hud-overlay') as HTMLElement;

const world = new World();
(window as unknown as Record<string, unknown>)['world'] = world;
const input = new InputManager();
const sceneManager = new SceneManager(canvas);
const water = new WaterRenderer(sceneManager);
new SkyRenderer(sceneManager);
const boatRenderer = new BoatRenderer(sceneManager);
const wake = new WakeRenderer(sceneManager);
const camera = new CameraController(sceneManager.camera);
const hud = new HUD(overlay);

// Race system
const race = new RaceManager(WINDWARD_LEEWARD);
const markRenderer = new MarkRenderer(sceneManager, WINDWARD_LEEWARD);
const minimap = new Minimap(overlay, WINDWARD_LEEWARD);
const raceHUD = new RaceHUD(overlay);

// Position boat behind the start line
world.boat.position = { x: 0, y: -5 };
world.boat.heading = 0; // facing north (toward windward mark)

// Space key to start/restart race
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space') {
    e.preventDefault();
    if (race.phase === 'pre-start') {
      race.startCountdown();
    } else if (race.phase === 'finished') {
      race.reset();
      world.boat.position = { x: 0, y: -5 };
      world.boat.heading = 0;
      world.boat.speed = 0;
      world.boat.yawRate = 0;
      world.boat.heelAngle = 0;
      world.boat.heelRate = 0;
    }
  }
});

let gameTime = 0;

const loop = new GameLoop(
  (dt: number) => {
    gameTime += dt;
    const controls = input.update(dt);
    world.boat.sailTrimAngle = controls.sailTrimAngle;
    world.boat.rudderAngle = controls.rudderAngle;
    world.boat = stepPhysics(world.boat, world.wind, ILCA7, dt);

    // Update race state
    race.update(dt, world.boat.position, world.boat.heading);
  },
  (_alpha: number) => {
    water.update(gameTime);
    const apparent = computeApparentWind(world.wind, world.boat.heading, world.boat.speed);
    boatRenderer.update(world.boat, apparent);
    wake.update(world.boat, PHYSICS_DT);
    camera.update(world.boat);
    hud.update(world.boat, world.wind, apparent);

    // Race rendering
    markRenderer.setNextMark(race.raceState.nextMarkIndex);
    markRenderer.update(gameTime);
    minimap.update(world.boat, world.wind, race);
    raceHUD.update(world.boat, race);

    sceneManager.render();
  },
);

loop.start();
