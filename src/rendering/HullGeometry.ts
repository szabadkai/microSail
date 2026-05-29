import * as THREE from 'three';

// Cross-section half-widths at stations along the hull (bow to stern)
// station: distance from bow (0..1), halfWidth, depth below waterline, freeboard above
interface HullStation {
  t: number;
  halfWidth: number;
  depth: number;
  freeboard: number;
}

const STATIONS: HullStation[] = [
  { t: 0.00, halfWidth: 0.00, depth: 0.00, freeboard: 0.30 },
  { t: 0.05, halfWidth: 0.08, depth: 0.05, freeboard: 0.28 },
  { t: 0.12, halfWidth: 0.20, depth: 0.12, freeboard: 0.25 },
  { t: 0.25, halfWidth: 0.38, depth: 0.18, freeboard: 0.22 },
  { t: 0.40, halfWidth: 0.52, depth: 0.22, freeboard: 0.18 },
  { t: 0.55, halfWidth: 0.58, depth: 0.23, freeboard: 0.16 },
  { t: 0.70, halfWidth: 0.55, depth: 0.21, freeboard: 0.15 },
  { t: 0.80, halfWidth: 0.48, depth: 0.18, freeboard: 0.14 },
  { t: 0.90, halfWidth: 0.35, depth: 0.12, freeboard: 0.13 },
  { t: 0.95, halfWidth: 0.20, depth: 0.06, freeboard: 0.12 },
  { t: 1.00, halfWidth: 0.05, depth: 0.02, freeboard: 0.12 },
];

const HULL_LENGTH = 4.23;
const CROSS_SECTION_POINTS = 8;

export function createHullGeometry(): THREE.BufferGeometry {
  const vertices: number[] = [];
  const indices: number[] = [];

  const stationRings: THREE.Vector3[][] = [];

  for (const station of STATIONS) {
    const z = (0.5 - station.t) * HULL_LENGTH;
    const ring = buildCrossSection(station, z);
    stationRings.push(ring);
  }

  for (const ring of stationRings) {
    for (const v of ring) {
      vertices.push(v.x, v.y, v.z);
    }
  }

  const ptsPerRing = CROSS_SECTION_POINTS * 2 + 1;
  for (let s = 0; s < stationRings.length - 1; s++) {
    const base = s * ptsPerRing;
    const next = (s + 1) * ptsPerRing;
    for (let i = 0; i < ptsPerRing; i++) {
      const i2 = (i + 1) % ptsPerRing;
      indices.push(base + i, next + i, next + i2);
      indices.push(base + i, next + i2, base + i2);
    }
  }

  // Cap the bow (first station is nearly a point)
  const bowCenter = 0;
  for (let i = 0; i < ptsPerRing - 1; i++) {
    indices.push(bowCenter, bowCenter + i + 1, bowCenter + ((i + 2) % ptsPerRing || ptsPerRing));
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

function buildCrossSection(station: HullStation, z: number): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];
  const hw = station.halfWidth;
  const depth = station.depth;
  const fb = station.freeboard;
  const total = CROSS_SECTION_POINTS * 2 + 1;

  // Build a U-shaped cross section: starboard gunwale → keel → port gunwale
  // Right side (starboard) going down
  for (let i = 0; i <= CROSS_SECTION_POINTS; i++) {
    const t = i / CROSS_SECTION_POINTS;
    const angle = t * Math.PI;
    const x = hw * Math.cos(angle);
    const yGunwale = fb;
    const yKeel = -depth;
    const y = yGunwale + (yKeel - yGunwale) * Math.pow(Math.sin(angle), 0.7);
    points.push(new THREE.Vector3(x, y, z));
  }

  // Left side (port) going up — skip the keel point (already in right side)
  for (let i = CROSS_SECTION_POINTS - 1; i >= 0; i--) {
    const t = i / CROSS_SECTION_POINTS;
    const angle = t * Math.PI;
    const x = -hw * Math.cos(angle);
    const yGunwale = fb;
    const yKeel = -depth;
    const y = yGunwale + (yKeel - yGunwale) * Math.pow(Math.sin(angle), 0.7);
    points.push(new THREE.Vector3(x, y, z));
  }

  while (points.length < total) {
    points.push(points[points.length - 1].clone());
  }
  if (points.length > total) {
    points.length = total;
  }

  return points;
}

export function createDeckGeometry(): THREE.BufferGeometry {
  const vertices: number[] = [];
  const indices: number[] = [];

  for (let s = 0; s < STATIONS.length; s++) {
    const station = STATIONS[s];
    const z = (0.5 - station.t) * HULL_LENGTH;
    vertices.push(-station.halfWidth, station.freeboard, z);
    vertices.push(station.halfWidth, station.freeboard, z);
  }

  for (let s = 0; s < STATIONS.length - 1; s++) {
    const i = s * 2;
    indices.push(i, i + 2, i + 3);
    indices.push(i, i + 3, i + 1);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}
