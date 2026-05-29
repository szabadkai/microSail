# microSail

A browser-based sailboat racing simulator with realistic sailing physics, rendered in 3D with [Three.js](https://threejs.org/). Sail an ILCA 7 (Laser) dinghy around a race course, trimming the sail and steering with the rudder while the boat responds to apparent wind, heel, and hull drag.

> **Live demo:** https://szabadkai.github.io/microSail/

## Features

- **Custom sailing physics** — aerodynamic lift/drag on the sail, apparent wind, hull resistance with a wave-making drag wall near hull speed, rudder forces, and heel dynamics with a righting-moment (GZ) curve. Runs on a fixed 60 Hz timestep decoupled from rendering.
- **3D rendering** — procedural hull, deformable sail that cambers with wind pressure, animated water and sky, a particle wake trail, and a mouse-orbit chase camera.
- **Racing** — windward-leeward and triangle courses with start/finish lines, mark rounding, a countdown sequence, lap timing, and per-leg splits.
- **HUD & minimap** — live speed, heading, trim, rudder, heel and wind readouts; a 2D minimap showing the course, marks, wind, and boat position.

## Controls

| Input | Action |
| --- | --- |
| `A` / `←` | Rudder left |
| `D` / `→` | Rudder right |
| `W` / `↑` | Sheet in (trim sail tighter) |
| `S` / `↓` | Sheet out (ease sail) |
| Mouse drag | Orbit camera |
| Scroll wheel | Zoom camera |
| `Space` | Start race / restart after finishing |

## Getting started

Requires [Node.js](https://nodejs.org/) 20+.

```bash
npm install      # install dependencies
npm run dev      # start the dev server at http://localhost:5173/microSail/
```

### Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Type-check and produce a production build in `dist/` |
| `npm run preview` | Preview the production build locally |
| `npm test` | Run the Vitest test suite once |
| `npm run test:watch` | Run tests in watch mode |
| `npm run typecheck` | Type-check without emitting |

## Tech stack

- **Three.js** — 3D rendering (water, sky, boat, marks)
- **Vite + TypeScript** (strict) — build tooling and type safety
- **Vitest** — unit tests for the physics and core loop
- **GitHub Actions** — type-check, test, build, and deploy to GitHub Pages on push to `main`

## Project structure

```
src/
  core/        Game loop, world state, shared types
  physics/     Wind, sail forces, hull resistance, rudder, heel, integration (pure functions)
  config/      Boat parameters (ILCA 7) and physical constants
  input/       Keyboard input → control state
  rendering/   Scene, water, sky, boat, sail, wake, camera, course marks
  race/        Race manager, course definitions, race types
  ui/          HUD, wind indicator, minimap, race HUD
  __tests__/   Physics and core-loop tests
```

## Physics model

The simulator models a 4-degree-of-freedom dinghy (surge, yaw, heel, position):

- **Apparent wind** is the vector sum of true wind and the boat's own motion.
- **Sail forces** decompose lift (perpendicular to apparent wind) and drag (parallel) into boat-frame forward and lateral components, using piecewise CL/CD curves across luffing, optimal, stall, and drag-dominated regimes.
- **Hull resistance** combines frictional drag (∝ V²) with a sharp wave-making rise near hull speed (1.34 × √LWL).
- **Heel** balances the heeling moment from sail force against the righting moment from the GZ curve, with damping, and depowers the sail as the boat heels.
- **Integration** uses semi-implicit Euler with added-mass inertia so the boat coasts and tracks realistically.

Reference boat is the **ILCA 7 (Laser)**: LWL 3.96 m, displacement 130 kg, sail area 7.06 m².

## Roadmap

See [ROADMAP.md](./ROADMAP.md) for completed phases and planned work, and [TASKS.md](./TASKS.md) for a granular checklist of what's done and what's left.

## License

No license has been specified yet.
