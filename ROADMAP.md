# microSail Roadmap

This document tracks the development phases of microSail. It reflects what has shipped and what is planned. Items are marked ✅ done, 🚧 in progress, or ⬜ planned.

## Guiding principles

- **Custom physics over a general engine** — sailing needs aerodynamic lift/drag decomposition and heel/leeway coupling that don't map cleanly onto rigid-body primitives.
- **Fixed 60 Hz timestep** — stable for dinghy-scale forces and masses, with render interpolation for smoothness.
- **Pure physics functions** — force and integration code takes inputs and returns outputs with no side effects, so it's unit-testable without a browser.
- **Files stay small and single-purpose** — keep modules focused; split when they grow past a few hundred lines.
- **Strict TypeScript, named exports, barrel files** — type safety and clean module boundaries throughout.

---

## Phase 0 — Project scaffold ✅

- ✅ Vite + TypeScript (strict) build tooling with `@/` path alias
- ✅ Vitest test setup
- ✅ GitHub Actions: typecheck → test → build → deploy to GitHub Pages
- ✅ npm scripts: `dev`, `build`, `preview`, `test`, `test:watch`, `typecheck`

## Phase 1 — Playable prototype ✅

- ✅ Fixed-timestep game loop with render interpolation
- ✅ Central world state (ECS-lite)
- ✅ Wind model (true + apparent wind)
- ✅ Sail aerodynamics (CL/CD curves, lift/drag decomposition)
- ✅ Hull resistance (friction + wave-making near hull speed)
- ✅ Rudder forces (yaw torque + drag)
- ✅ Semi-implicit Euler integration
- ✅ Keyboard controls (WASD + arrows)
- ✅ Three.js scene: water, sky, procedural boat
- ✅ Chase camera
- ✅ HUD: speed, heading, trim, rudder, wind
- ✅ SVG wind indicator
- ✅ Physics unit tests

## Phase 2 — Fuller physics ✅

- ✅ Heel dynamics: heeling vs. righting moment (GZ curve) with damping
- ✅ Sail depowering as the boat heels
- ✅ Added-mass inertia so the boat coasts and tracks realistically
- ✅ Speed-dependent yaw damping

## Phase 3 — Visual polish ✅

- ✅ Deformable sail mesh (NACA-like camber that responds to wind pressure/angle)
- ✅ Particle wake trail
- ✅ Directional markers on the hull (bow stripe, transom) and visible rigging (shrouds, forestay, boom, vang, mainsheet)
- ✅ Improved lighting, water, and sky
- ✅ Mouse-orbit camera with zoom, touch support, and auto-return to chase view

## Phase 4 — Racing ✅

- ✅ Course definitions (windward-leeward, triangle)
- ✅ Start/finish lines and rounding marks rendered in 3D
- ✅ Race manager: countdown, mark rounding detection, finish detection
- ✅ Lap timer with per-leg split times
- ✅ Race HUD: countdown, timer, next-mark distance/bearing, finish summary
- ✅ 2D minimap with course, marks, wind arrow, and boat position
- ✅ Start/restart flow (Space key)

---

## Planned work

### Phase 5 — Racing depth ⬜

- ⬜ Proper line-crossing detection that respects crossing direction (currently simplified)
- ⬜ Penalty for hitting / passing a mark on the wrong side (enforce port/starboard rounding)
- ⬜ Over-early-start (OCS) detection and recall
- ⬜ VMG readout and a polar diagram overlay
- ⬜ Course selection UI (windward-leeward vs. triangle, configurable leg lengths)
- ⬜ Ghost boat / best-run replay to race against your own time

### Phase 6 — Environment & feel ⬜

- ⬜ Dynamic wind: gusts, lulls, and oscillating shifts
- ⬜ Wind gradient and puffs visible on the water surface
- ⬜ Current / tide affecting course made good
- ⬜ Leeway (sideways slip) modeled explicitly in the integrator
- ⬜ Capsize and recovery when heel exceeds the righting range

### Phase 7 — Polish ⬜

- ⬜ Sound: water, wind, sail luffing, mark-rounding cues
- ⬜ Settings menu (wind speed/direction, boat class, camera modes)
- ⬜ Onboarding tutorial / sailing tips
- ⬜ Multiple camera modes (helm view, drone, mark cam)
- ⬜ Mobile-friendly touch controls for steering and trim
- ⬜ Performance pass and bundle code-splitting

### Phase 8 — Multiplayer ⬜

- ⬜ Deterministic, server-authoritative physics step
- ⬜ Networked race state and remote-boat rendering
- ⬜ Fleet racing with multiple human/AI competitors
- ⬜ Lobby, start sequence sync, and results board

---

## Known issues / tech debt

- Finish-line crossing accepts any crossing direction; it should require crossing the line in the correct direction after all marks are rounded.
- Mark rounding is a simple proximity check (within the mark radius); it does not enforce the required rounding side.
- The production bundle is a single large chunk; consider code-splitting Three.js.
