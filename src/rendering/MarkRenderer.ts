import * as THREE from 'three';
import type { SceneManager } from './SceneManager';
import type { RaceCourse } from '@/race/types';

const BUOY_RADIUS = 1.2;
const BUOY_HEIGHT = 2.5;
const POLE_HEIGHT = 4.0;
const POLE_RADIUS = 0.08;

// Start/finish line marker
const LINE_MARKER_HEIGHT = 3.0;
const LINE_MARKER_RADIUS = 0.6;

export class MarkRenderer {
  private buoyGroup: THREE.Group;
  private nextMarkIndicators: THREE.Mesh[] = [];
  private allBuoyMeshes: THREE.Group[] = [];

  constructor(sceneManager: SceneManager, course: RaceCourse) {
    this.buoyGroup = new THREE.Group();

    // Create course mark buoys
    for (const mark of course.marks) {
      const buoy = createBuoy(mark.rounding === 'port' ? 0xff4444 : 0x44cc44);
      buoy.position.set(mark.position.x, 0, -mark.position.y);
      this.buoyGroup.add(buoy);
      this.allBuoyMeshes.push(buoy);

      // Glowing ring around each buoy as "next mark" indicator (hidden by default)
      const ringGeo = new THREE.TorusGeometry(BUOY_RADIUS + 1.0, 0.15, 8, 32);
      ringGeo.rotateX(Math.PI / 2);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.7,
      });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.position.set(mark.position.x, 0.5, -mark.position.y);
      ring.visible = false;
      this.buoyGroup.add(ring);
      this.nextMarkIndicators.push(ring);
    }

    // Start line markers
    for (const pos of course.startLine) {
      const marker = createLineMarker(0xffffff);
      marker.position.set(pos.x, 0, -pos.y);
      this.buoyGroup.add(marker);
    }

    // Start line visual (semi-transparent plane between markers)
    const startLine = createLineSurface(course.startLine, 0x44ff44);
    this.buoyGroup.add(startLine);

    // Finish line markers
    for (const pos of course.finishLine) {
      const marker = createLineMarker(0x4488ff);
      marker.position.set(pos.x, 0, -pos.y);
      this.buoyGroup.add(marker);
    }

    // Finish line visual
    const finishLine = createLineSurface(course.finishLine, 0x4488ff);
    this.buoyGroup.add(finishLine);

    sceneManager.scene.add(this.buoyGroup);
  }

  /** Highlight the next mark to round */
  setNextMark(index: number): void {
    for (let i = 0; i < this.nextMarkIndicators.length; i++) {
      this.nextMarkIndicators[i].visible = (i === index);
    }
  }

  /** Animate the next-mark ring (pulsing) */
  update(time: number): void {
    for (const ring of this.nextMarkIndicators) {
      if (ring.visible) {
        const scale = 1.0 + 0.15 * Math.sin(time * 3);
        ring.scale.set(scale, 1, scale);
      }
    }
  }
}

function createBuoy(color: number): THREE.Group {
  const group = new THREE.Group();

  // Floating body (cylinder)
  const bodyGeo = new THREE.CylinderGeometry(BUOY_RADIUS, BUOY_RADIUS * 0.8, BUOY_HEIGHT, 12);
  bodyGeo.translate(0, BUOY_HEIGHT / 2 - 0.5, 0);
  const bodyMat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.5,
    metalness: 0.1,
  });
  group.add(new THREE.Mesh(bodyGeo, bodyMat));

  // White stripe band
  const bandGeo = new THREE.CylinderGeometry(
    BUOY_RADIUS + 0.02, BUOY_RADIUS + 0.02, 0.4, 12,
  );
  bandGeo.translate(0, BUOY_HEIGHT * 0.6, 0);
  const bandMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.4 });
  group.add(new THREE.Mesh(bandGeo, bandMat));

  // Pole on top
  const poleGeo = new THREE.CylinderGeometry(POLE_RADIUS, POLE_RADIUS, POLE_HEIGHT, 6);
  poleGeo.translate(0, BUOY_HEIGHT + POLE_HEIGHT / 2 - 0.5, 0);
  const poleMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5 });
  group.add(new THREE.Mesh(poleGeo, poleMat));

  // Flag on the pole
  const flagGeo = new THREE.PlaneGeometry(1.0, 0.6);
  flagGeo.translate(0.5, BUOY_HEIGHT + POLE_HEIGHT - 1.0, 0);
  const flagMat = new THREE.MeshStandardMaterial({
    color,
    side: THREE.DoubleSide,
    roughness: 0.7,
  });
  group.add(new THREE.Mesh(flagGeo, flagMat));

  return group;
}

function createLineMarker(color: number): THREE.Group {
  const group = new THREE.Group();

  const bodyGeo = new THREE.CylinderGeometry(
    LINE_MARKER_RADIUS, LINE_MARKER_RADIUS * 0.6, LINE_MARKER_HEIGHT, 8,
  );
  bodyGeo.translate(0, LINE_MARKER_HEIGHT / 2 - 0.3, 0);
  const bodyMat = new THREE.MeshStandardMaterial({
    color,
    roughness: 0.4,
    metalness: 0.2,
  });
  group.add(new THREE.Mesh(bodyGeo, bodyMat));

  return group;
}

function createLineSurface(line: [{ x: number; y: number }, { x: number; y: number }], color: number): THREE.Mesh {
  const [a, b] = line;
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dx, dy);

  const geo = new THREE.PlaneGeometry(length, 0.8);
  geo.rotateX(-Math.PI / 2);
  geo.rotateY(-angle);

  const midX = (a.x + b.x) / 2;
  const midZ = -(a.y + b.y) / 2;
  geo.translate(midX, 0.1, midZ);

  const mat = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.35,
    side: THREE.DoubleSide,
    depthWrite: false,
  });

  return new THREE.Mesh(geo, mat);
}
