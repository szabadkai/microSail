import * as THREE from 'three';

// Sail dimensions matching the ILCA 7 (Laser) rig
const SAIL_HEIGHT = 4.5;
const SAIL_FOOT = 2.3;

// Grid resolution for deformable sail mesh
const SEGMENTS_U = 8; // along foot (luff to leech)
const SEGMENTS_V = 12; // along luff (boom to head)

export interface SailMesh {
  mesh: THREE.Mesh;
  geometry: THREE.BufferGeometry;
  basePositions: Float32Array;
}

/**
 * Creates a subdivided triangular sail mesh that can be deformed per-frame.
 * The sail is a triangle: tack (0,0,0) → head (0,H,0) → clew (0,0,F)
 * We parameterise with (u,v): v = fraction up the luff, u = fraction across the chord at that height.
 */
export function createSailGeometry(): SailMesh {
  const vertices: number[] = [];
  const uvs: number[] = [];
  const indices: number[] = [];

  // Generate grid vertices
  for (let j = 0; j <= SEGMENTS_V; j++) {
    const v = j / SEGMENTS_V;
    const y = v * SAIL_HEIGHT;
    // Chord narrows linearly from foot to head (triangular planform)
    const chordLength = SAIL_FOOT * (1.0 - v);

    for (let i = 0; i <= SEGMENTS_U; i++) {
      const u = i / SEGMENTS_U;
      const z = -u * chordLength; // negative Z = aft (toward stern)
      // Base position: flat sail in the Y-Z plane (x=0)
      vertices.push(0, y, z);
      uvs.push(u, v);
    }
  }

  // Generate triangle indices
  for (let j = 0; j < SEGMENTS_V; j++) {
    for (let i = 0; i < SEGMENTS_U; i++) {
      const a = j * (SEGMENTS_U + 1) + i;
      const b = a + 1;
      const c = (j + 1) * (SEGMENTS_U + 1) + i;
      const d = c + 1;
      indices.push(a, c, b);
      indices.push(b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  const posArray = new Float32Array(vertices);
  geometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();

  const material = new THREE.MeshStandardMaterial({
    color: 0xfaf0e6,
    side: THREE.DoubleSide,
    roughness: 0.8,
    metalness: 0.0,
  });

  const mesh = new THREE.Mesh(geometry, material);
  // Sail tack at boom pivot; foot extends along +Z (same direction as boom)
  mesh.position.set(0, 0, 0);

  // Store a copy of base positions for deformation reference
  const basePositions = new Float32Array(posArray);

  return { mesh, geometry, basePositions };
}

/**
 * Deforms the sail mesh based on apparent wind pressure and angle.
 *
 * @param sail - The sail mesh data
 * @param windPressure - Normalized wind pressure (0–1), controls depth of camber
 * @param angleOfAttack - Angle of attack in radians, affects camber distribution
 */
export function deformSail(
  sail: SailMesh,
  windPressure: number,
  angleOfAttack: number,
): void {
  const positions = sail.geometry.attributes.position as THREE.BufferAttribute;
  const base = sail.basePositions;

  // Camber depth: how far the sail bellows out (max ~0.3m at full pressure)
  const maxCamber = 0.35 * windPressure;

  // Angle of attack affects where the deepest point of the camber is
  // Low AoA → draft forward; High AoA → draft mid/aft
  const aoaNorm = Math.min(Math.abs(angleOfAttack) / (Math.PI * 0.5), 1.0);
  const draftPosition = 0.3 + 0.2 * aoaNorm; // 30-50% of chord

  // Wind direction sign: sail bellows to leeward
  const windSign = angleOfAttack >= 0 ? 1.0 : -1.0;

  const stride = SEGMENTS_U + 1;

  for (let j = 0; j <= SEGMENTS_V; j++) {
    const v = j / SEGMENTS_V;
    // Camber diminishes toward the head (triangular sail → less cloth up high)
    const heightFactor = 1.0 - 0.6 * v * v;
    for (let i = 0; i <= SEGMENTS_U; i++) {
      const idx = j * stride + i;
      const u = i / SEGMENTS_U;

      // Camber profile: NACA-like parabolic arc with controllable draft position
      // Peak at draftPosition, zero at luff (u=0) and leech (u=1)
      let camber: number;
      if (u < draftPosition) {
        const t = u / draftPosition;
        camber = t * (2.0 - t); // Parabolic rise
      } else {
        const t = (u - draftPosition) / (1.0 - draftPosition);
        camber = 1.0 - t * t; // Parabolic fall
      }

      // Leech flutter: slight extra displacement near the trailing edge
      const leechFlutter = u > 0.8 ? (u - 0.8) * 0.15 * windPressure : 0;

      const displacement = (camber * maxCamber * heightFactor + leechFlutter) * windSign;

      // Apply deformation in X (perpendicular to the sail plane)
      const baseIdx = idx * 3;
      positions.array[baseIdx] = base[baseIdx] + displacement;
      positions.array[baseIdx + 1] = base[baseIdx + 1];
      // Slight chord shortening as sail curves (maintains cloth length feel)
      const chordShrink = camber * maxCamber * 0.05 * heightFactor;
      positions.array[baseIdx + 2] = base[baseIdx + 2] + chordShrink * u;
    }
  }

  positions.needsUpdate = true;
  sail.geometry.computeVertexNormals();
}
