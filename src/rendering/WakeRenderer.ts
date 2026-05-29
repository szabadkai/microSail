import * as THREE from 'three';
import type { BoatState } from '@/core/types';
import type { SceneManager } from './SceneManager';

const MAX_PARTICLES = 200;
const PARTICLE_LIFETIME = 4.0;
const SPAWN_INTERVAL = 0.04; // seconds between spawns
const WAKE_SPREAD_ANGLE = 0.3; // half-angle of V-wake in radians (~17°)

interface WakeParticle {
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  age: number;
  maxAge: number;
}

export class WakeRenderer {
  private particles: WakeParticle[] = [];
  private mesh: THREE.InstancedMesh;
  private spawnTimer = 0;
  private dummy = new THREE.Object3D();

  constructor(sceneManager: SceneManager) {
    const geometry = new THREE.CircleGeometry(0.18, 8);
    geometry.rotateX(-Math.PI / 2);

    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.6,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.InstancedMesh(geometry, material, MAX_PARTICLES);
    this.mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    this.mesh.frustumCulled = false;

    // Hide all instances initially by setting scale to zero
    this.dummy.scale.set(0, 0, 0);
    this.dummy.updateMatrix();
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.dummy.matrix.toArray(this.mesh.instanceMatrix.array, i * 16);
    }

    sceneManager.scene.add(this.mesh);
  }

  update(state: BoatState, dt: number): void {
    const speed = state.speed;

    // Spawn new particles behind the boat
    this.spawnTimer += dt;
    if (speed > 0.3 && this.spawnTimer >= SPAWN_INTERVAL) {
      this.spawnTimer = 0;
      this.spawnWakeParticles(state);
    }

    // Update existing particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.age += dt;
      if (p.age >= p.maxAge) {
        this.particles.splice(i, 1);
        continue;
      }
      p.position.add(p.velocity.clone().multiplyScalar(dt));
      p.velocity.multiplyScalar(0.98);
    }

    // Update instanced mesh matrices
    const arr = this.mesh.instanceMatrix.array as Float32Array;
    for (let i = 0; i < MAX_PARTICLES; i++) {
      if (i < this.particles.length) {
        const p = this.particles[i];
        const lifeRatio = p.age / p.maxAge;

        this.dummy.position.copy(p.position);
        const growPhase = Math.min(lifeRatio * 5.0, 1.0);
        const fadePhase = 1.0 - lifeRatio;
        const scale = growPhase * fadePhase * (0.3 + 0.7 * (p.maxAge / PARTICLE_LIFETIME));
        this.dummy.scale.set(scale, scale, scale);
        this.dummy.updateMatrix();
        this.dummy.matrix.toArray(arr, i * 16);
      } else {
        this.dummy.position.set(0, -100, 0);
        this.dummy.scale.set(0, 0, 0);
        this.dummy.updateMatrix();
        this.dummy.matrix.toArray(arr, i * 16);
      }
    }
    this.mesh.instanceMatrix.needsUpdate = true;
    this.mesh.count = Math.min(this.particles.length, MAX_PARTICLES);
  }

  private spawnWakeParticles(state: BoatState): void {
    const boatX = state.position.x;
    const boatZ = -state.position.y;
    const speed = state.speed;

    // Stern position (behind the boat)
    const sternOffset = 2.0;
    const sternX = boatX - sternOffset * Math.sin(state.heading);
    const sternZ = boatZ + sternOffset * Math.cos(state.heading);

    // Spawn rate and spread proportional to speed
    const numToSpawn = speed > 1.5 ? 2 : 1;

    for (let s = 0; s < numToSpawn; s++) {
      if (this.particles.length >= MAX_PARTICLES) break;

      // V-wake: particles spread to port and starboard
      const side = s === 0 ? -1 : 1;
      const spreadAngle = state.heading + Math.PI + side * WAKE_SPREAD_ANGLE;

      const angleJitter = (Math.random() - 0.5) * 0.15;
      const finalAngle = spreadAngle + angleJitter;
      const spreadSpeed = speed * 0.15 + Math.random() * 0.1;

      const particle: WakeParticle = {
        position: new THREE.Vector3(
          sternX + (Math.random() - 0.5) * 0.3,
          0.02,
          sternZ + (Math.random() - 0.5) * 0.3,
        ),
        velocity: new THREE.Vector3(
          spreadSpeed * Math.sin(finalAngle),
          0,
          -spreadSpeed * Math.cos(finalAngle),
        ),
        age: 0,
        maxAge: PARTICLE_LIFETIME * (0.7 + Math.random() * 0.3),
      };

      this.particles.push(particle);
    }
  }
}
