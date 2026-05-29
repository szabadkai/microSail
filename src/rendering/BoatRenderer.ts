import * as THREE from 'three';
import type { BoatState, ApparentWind } from '@/core/types';
import type { SceneManager } from './SceneManager';
import { createHullGeometry, createDeckGeometry } from './HullGeometry';
import { createSailGeometry, deformSail } from './SailGeometry';
import type { SailMesh } from './SailGeometry';

const MAST_HEIGHT = 5.76;
const MAST_Z = 0.3; // mast position along hull (slightly forward of center)
const BOOM_HEIGHT = 1.0;
const BOOM_LENGTH = 2.5;

export class BoatRenderer {
  private group: THREE.Group;
  private heelGroup: THREE.Group;
  private boomGroup: THREE.Group;
  private rudderGroup: THREE.Group;
  private sail: SailMesh;

  constructor(sceneManager: SceneManager) {
    this.group = new THREE.Group();
    this.heelGroup = new THREE.Group();
    this.group.add(this.heelGroup);

    this.heelGroup.add(createHull());
    this.heelGroup.add(createDeck());
    this.heelGroup.add(createBowStripe());
    this.heelGroup.add(createTransom());
    this.heelGroup.add(createMast());

    // Boom group pivots at the mast — rotates with sail trim
    this.boomGroup = createBoomGroup();
    this.heelGroup.add(this.boomGroup);

    // Sail is a child of the boom group
    this.sail = createSailGeometry();
    this.boomGroup.add(this.sail.mesh);

    // Standing rigging (fixed)
    this.heelGroup.add(createShroud(1));   // starboard shroud
    this.heelGroup.add(createShroud(-1));  // port shroud
    this.heelGroup.add(createForestay());

    this.heelGroup.add(createDaggerboard());

    // Rudder group: rudder blade + tiller rotate together
    this.rudderGroup = createRudderGroup();
    this.heelGroup.add(this.rudderGroup);

    // Cockpit details
    this.heelGroup.add(createHikingStrap());

    sceneManager.scene.add(this.group);
  }

  update(state: BoatState, apparent?: ApparentWind): void {
    this.group.position.set(state.position.x, 0, -state.position.y);
    // Hull bow is at +Z in model space; physics forward maps to -Z in world.
    // Add π so the bow (+Z) rotates to point in the travel direction (-Z).
    this.group.rotation.y = -state.heading + Math.PI;
    // Heel sign flips because the model is rotated 180° around Y
    this.heelGroup.rotation.z = -state.heelAngle;

    // Boom swings to leeward: positive apparent wind angle → wind from starboard → boom to port
    // With the 180° model flip, positive Y-rotation on boom swings it to starboard (+X in world)
    const windSide = apparent ? Math.sign(apparent.angle) : 1;
    this.boomGroup.rotation.y = windSide * state.sailTrimAngle;

    // Rudder sign flips with the 180° model rotation
    this.rudderGroup.rotation.y = -state.rudderAngle;

    if (apparent) {
      const windPressure = Math.min(apparent.speed / 7.7, 1.0);
      const angleOfAttack = Math.abs(apparent.angle) - state.sailTrimAngle;
      deformSail(this.sail, windPressure, angleOfAttack);
    }
  }
}

// --- Hull and deck ---

function createHull(): THREE.Mesh {
  const geometry = createHullGeometry();
  const material = new THREE.MeshStandardMaterial({
    color: 0xf5f5f0, roughness: 0.25, metalness: 0.05, side: THREE.DoubleSide,
  });
  return new THREE.Mesh(geometry, material);
}

function createDeck(): THREE.Mesh {
  const geometry = createDeckGeometry();
  const material = new THREE.MeshStandardMaterial({
    color: 0xe8e0d0, roughness: 0.6, metalness: 0.0, side: THREE.DoubleSide,
  });
  return new THREE.Mesh(geometry, material);
}

// --- Directional markers ---

function createBowStripe(): THREE.Mesh {
  const HULL_LENGTH = 4.23;
  const shape = new THREE.Shape();
  shape.moveTo(0, -0.02);
  shape.lineTo(0.15, 0.10);
  shape.lineTo(0.15, 0.25);
  shape.lineTo(-0.15, 0.25);
  shape.lineTo(-0.15, 0.10);
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.3, bevelEnabled: false });
  geometry.translate(0, 0, 0.5 * HULL_LENGTH - 0.35);
  const material = new THREE.MeshStandardMaterial({
    color: 0xe84040, roughness: 0.4, metalness: 0.1, side: THREE.DoubleSide,
  });
  return new THREE.Mesh(geometry, material);
}

function createTransom(): THREE.Mesh {
  const HULL_LENGTH = 4.23;
  const geometry = new THREE.PlaneGeometry(0.3, 0.25);
  geometry.translate(0, 0.05, -0.5 * HULL_LENGTH + 0.01);
  const material = new THREE.MeshStandardMaterial({
    color: 0xd0c8b8, roughness: 0.5, metalness: 0.0, side: THREE.DoubleSide,
  });
  return new THREE.Mesh(geometry, material);
}

// --- Rig ---

function createMast(): THREE.Mesh {
  const geometry = new THREE.CylinderGeometry(0.025, 0.03, MAST_HEIGHT, 8);
  geometry.translate(0, MAST_HEIGHT / 2, MAST_Z);
  const material = new THREE.MeshStandardMaterial({
    color: 0xc0c0c0, roughness: 0.3, metalness: 0.7,
  });
  return new THREE.Mesh(geometry, material);
}

function createBoomGroup(): THREE.Group {
  const group = new THREE.Group();
  group.position.set(0, BOOM_HEIGHT, MAST_Z);

  // Boom spar: cylinder along -Z (aft from mast) — parallel with sail foot
  const geometry = new THREE.CylinderGeometry(0.025, 0.02, BOOM_LENGTH, 8);
  // Default CylinderGeometry is along Y; rotate to align with Z
  geometry.rotateX(Math.PI / 2);
  // Shift so the pivot end is at origin, boom extends aft (-Z)
  geometry.translate(0, 0, -BOOM_LENGTH / 2);

  const material = new THREE.MeshStandardMaterial({
    color: 0xa0a0a0, roughness: 0.35, metalness: 0.6,
  });
  const boom = new THREE.Mesh(geometry, material);
  group.add(boom);

  // Boom vang / kicker — diagonal line from boom mid-point down to mast base
  const vangStart = new THREE.Vector3(0, 0, -BOOM_LENGTH * 0.4);
  const vangEnd = new THREE.Vector3(0, -BOOM_HEIGHT + 0.2, MAST_Z * 0.5);
  const vangCurve = new THREE.LineCurve3(vangStart, vangEnd);
  const vangGeo = new THREE.TubeGeometry(vangCurve, 4, 0.006, 4, false);
  const ropeMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 });
  group.add(new THREE.Mesh(vangGeo, ropeMat));

  // Mainsheet — from boom end down to cockpit area
  const sheetStart = new THREE.Vector3(0, 0, -BOOM_LENGTH * 0.85);
  const sheetMid = new THREE.Vector3(0, -BOOM_HEIGHT * 0.5, -BOOM_LENGTH * 0.5);
  const sheetEnd = new THREE.Vector3(0, -BOOM_HEIGHT + 0.15, 0.8);
  const sheetCurve = new THREE.QuadraticBezierCurve3(sheetStart, sheetMid, sheetEnd);
  const sheetGeo = new THREE.TubeGeometry(sheetCurve, 12, 0.007, 4, false);
  group.add(new THREE.Mesh(sheetGeo, ropeMat));

  // Outhaul — thin line along the boom from clew to boom end
  const outhaulStart = new THREE.Vector3(0, 0.03, -BOOM_LENGTH * 0.7);
  const outhaulEnd = new THREE.Vector3(0, 0.03, -BOOM_LENGTH);
  const outhaulCurve = new THREE.LineCurve3(outhaulStart, outhaulEnd);
  const outhaulGeo = new THREE.TubeGeometry(outhaulCurve, 3, 0.004, 4, false);
  const thinRopeMat = new THREE.MeshStandardMaterial({ color: 0x555555, roughness: 0.9 });
  group.add(new THREE.Mesh(outhaulGeo, thinRopeMat));

  return group;
}

// --- Standing rigging ---

function createShroud(side: number): THREE.Mesh {
  // Shrouds run from chainplate (hull side, near deck) to upper mast
  const deckPoint = new THREE.Vector3(side * 0.45, 0.12, -0.2);
  const mastPoint = new THREE.Vector3(0, MAST_HEIGHT * 0.85, MAST_Z);
  const curve = new THREE.LineCurve3(deckPoint, mastPoint);
  const geometry = new THREE.TubeGeometry(curve, 8, 0.005, 4, false);
  const material = new THREE.MeshStandardMaterial({
    color: 0x888888, roughness: 0.4, metalness: 0.5,
  });
  return new THREE.Mesh(geometry, material);
}

function createForestay(): THREE.Mesh {
  // Forestay from bow fitting to masthead
  const HULL_LENGTH = 4.23;
  const bowPoint = new THREE.Vector3(0, 0.20, 0.5 * HULL_LENGTH - 0.3);
  const mastHead = new THREE.Vector3(0, MAST_HEIGHT * 0.95, MAST_Z);
  const curve = new THREE.LineCurve3(bowPoint, mastHead);
  const geometry = new THREE.TubeGeometry(curve, 8, 0.005, 4, false);
  const material = new THREE.MeshStandardMaterial({
    color: 0x888888, roughness: 0.4, metalness: 0.5,
  });
  return new THREE.Mesh(geometry, material);
}

// --- Foils ---

function createDaggerboard(): THREE.Mesh {
  const geometry = new THREE.BoxGeometry(0.04, 0.8, 0.3);
  geometry.translate(0, -0.5, 0);
  const material = new THREE.MeshStandardMaterial({
    color: 0x3a3a3a, roughness: 0.4, metalness: 0.3,
  });
  return new THREE.Mesh(geometry, material);
}

function createRudderGroup(): THREE.Group {
  const group = new THREE.Group();
  group.position.set(0, -0.15, -1.8);

  // Rudder blade
  const bladeGeo = new THREE.BoxGeometry(0.03, 0.6, 0.2);
  bladeGeo.translate(0, -0.3, 0);
  const bladeMat = new THREE.MeshStandardMaterial({
    color: 0x3a3a3a, roughness: 0.4, metalness: 0.3,
  });
  group.add(new THREE.Mesh(bladeGeo, bladeMat));

  // Rudder stock (vertical rod connecting blade to tiller)
  const stockGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.35, 6);
  stockGeo.translate(0, 0.15, 0);
  const stockMat = new THREE.MeshStandardMaterial({
    color: 0x666666, roughness: 0.3, metalness: 0.5,
  });
  group.add(new THREE.Mesh(stockGeo, stockMat));

  // Tiller — extends forward from the rudder head into the cockpit
  const tillerGeo = new THREE.CylinderGeometry(0.014, 0.010, 1.0, 6);
  tillerGeo.rotateX(Math.PI / 2);
  tillerGeo.translate(0, 0.30, 0.50);
  const tillerMat = new THREE.MeshStandardMaterial({
    color: 0x8b6914, roughness: 0.6, metalness: 0.1,
  });
  group.add(new THREE.Mesh(tillerGeo, tillerMat));

  // Tiller extension (thinner, continues forward and slightly up)
  const extStart = new THREE.Vector3(0, 0.32, 0.95);
  const extEnd = new THREE.Vector3(0, 0.45, 1.5);
  const extCurve = new THREE.LineCurve3(extStart, extEnd);
  const extGeo = new THREE.TubeGeometry(extCurve, 4, 0.007, 4, false);
  const extMat = new THREE.MeshStandardMaterial({
    color: 0x666666, roughness: 0.5, metalness: 0.2,
  });
  group.add(new THREE.Mesh(extGeo, extMat));

  return group;
}

// --- Cockpit details ---

function createHikingStrap(): THREE.Mesh {
  const points = [
    new THREE.Vector3(-0.35, 0.08, -0.3),
    new THREE.Vector3(0.35, 0.08, -0.3),
  ];
  const curve = new THREE.LineCurve3(points[0], points[1]);
  const geometry = new THREE.TubeGeometry(curve, 2, 0.015, 4, false);
  const material = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });
  return new THREE.Mesh(geometry, material);
}
