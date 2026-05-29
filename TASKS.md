# microSail Task Checklist

A granular, actionable checklist of work on microSail. This complements [ROADMAP.md](./ROADMAP.md): the roadmap describes phases and intent; this file tracks individual tasks with checkboxes.

- `[x]` done
- `[ ]` not started / planned

---

## Done

### Project scaffold
- [x] Vite + TypeScript (strict) build setup
- [x] `@/` path alias to `src/`
- [x] Vitest test harness configured
- [x] npm scripts: `dev`, `build`, `preview`, `test`, `test:watch`, `typecheck`
- [x] `.gitignore` for `node_modules`, `dist`, `.DS_Store`, coverage, `*.local`
- [x] GitHub Actions: typecheck → test → build → deploy to GitHub Pages on push to `main`

### Core engine
- [x] Fixed-timestep game loop (60 Hz physics) with render interpolation
- [x] Central world state store (ECS-lite)
- [x] Shared types (`BoatState`, `WindState`, `Vec2`, `ForceResult`)
- [x] Vector math helpers (add, sub, scale, rotate, magnitude, normalize, dot, clamp, lerp, angle normalization)

### Physics
- [x] True + apparent wind model
- [x] Sail aerodynamics: piecewise CL/CD curves (luffing → optimal → stall → drag-dominated)
- [x] Lift/drag decomposition into boat-frame forward + lateral components
- [x] Hull resistance: frictional drag + wave-making rise near hull speed (1.34 × √LWL)
- [x] Rudder forces: yaw torque + drag
- [x] Semi-implicit Euler integration
- [x] Heel dynamics: heeling vs. righting moment (GZ curve) with damping
- [x] Sail depowering as the boat heels
- [x] Added-mass inertia (boat coasts and tracks realistically)
- [x] Speed-dependent yaw damping

### Input
- [x] Keyboard controls: WASD + arrow keys (rudder, sheet in/out)
- [x] Smooth interpolation of rudder and trim angles
- [x] `Space` to start / restart race

### Rendering
- [x] Three.js scene manager (renderer, scene, camera, lights, resize handling)
- [x] Animated water surface
- [x] Procedural sky with sun
- [x] Procedural boat hull with directional markers (bow stripe, transom)
- [x] Visible rigging (mast, boom, shrouds, forestay, vang, mainsheet)
- [x] Deformable sail mesh with NACA-like camber that responds to wind
- [x] Particle wake trail
- [x] Mouse-orbit chase camera with zoom, touch support, auto-return to chase view
- [x] Correct boat orientation (bow leads direction of travel; heel/rudder/boom signs consistent)
- [x] Correct sail shape (winding order + consistent leeward camber)

### Racing
- [x] Course definitions (windward-leeward, triangle)
- [x] Start/finish lines and rounding marks rendered in 3D
- [x] Race manager state machine (pre-start → countdown → racing → finished)
- [x] Countdown sequence
- [x] Mark rounding detection (proximity-based)
- [x] Finish detection
- [x] Lap timer with per-leg split times
- [x] Race HUD: countdown, timer, next-mark distance/bearing, finish summary
- [x] 2D minimap (course, marks, wind arrow, boat position)
- [x] Start / restart flow

### HUD & UI
- [x] HUD: speed, heading, trim, rudder, heel, wind readouts
- [x] SVG wind indicator (true + apparent wind)

### Tests
- [x] Sail force tests (CL/CD lookup, force decomposition)
- [x] Hull resistance tests (drag vs. speed, hull-speed behavior)
- [x] Wind model tests (apparent wind)
- [x] Integration tests (stability, position/heading updates)
- [x] Rudder force tests
- [x] Game loop tests (accumulator, interpolation alpha)
- [x] Input manager tests

### Documentation
- [x] README (overview, demo link, features, controls, setup, scripts, tech stack, structure, physics model)
- [x] ROADMAP (completed phases + planned work + known issues)
- [x] TASKS checklist (this file)

---

## In progress / open decisions

- [ ] Open a PR for `fix/sail-shape-and-orientation` (or merge to `main`)
- [ ] Choose and add a software license (currently unspecified)

---

## To do

### Phase 5 — Racing depth
- [ ] Line-crossing detection that respects crossing direction
- [ ] Penalty for rounding a mark on the wrong side (enforce port/starboard)
- [ ] Over-early-start (OCS) detection and recall
- [ ] VMG readout
- [ ] Polar diagram overlay
- [ ] Course selection UI (windward-leeward vs. triangle, configurable leg lengths)
- [ ] Ghost boat / best-run replay

### Phase 6 — Environment & feel
- [ ] Dynamic wind: gusts, lulls, oscillating shifts
- [ ] Wind gradient and puffs visible on the water
- [ ] Current / tide affecting course made good
- [ ] Leeway (sideways slip) modeled explicitly in the integrator
- [ ] Capsize and recovery when heel exceeds the righting range

### Phase 7 — Polish
- [ ] Sound: water, wind, sail luffing, mark-rounding cues
- [ ] Settings menu (wind speed/direction, boat class, camera modes)
- [ ] Onboarding tutorial / sailing tips
- [ ] Multiple camera modes (helm view, drone, mark cam)
- [ ] Mobile-friendly touch controls for steering and trim
- [ ] Performance pass + bundle code-splitting (split Three.js out of the single large chunk)

### Phase 8 — Multiplayer
- [ ] Deterministic, server-authoritative physics step
- [ ] Networked race state and remote-boat rendering
- [ ] Fleet racing with multiple human/AI competitors
- [ ] Lobby, start-sequence sync, and results board

---

## Known issues / tech debt
- [ ] Finish-line crossing accepts any direction; should require correct direction after all marks rounded
- [ ] Mark rounding is a simple proximity check; does not enforce the required rounding side
- [ ] Production bundle is a single large chunk; code-split Three.js
