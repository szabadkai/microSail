import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';
import type { SceneManager } from './SceneManager';

export class SkyRenderer {
  private sky: Sky;

  constructor(sceneManager: SceneManager) {
    this.sky = new Sky();
    this.sky.scale.setScalar(10000);
    sceneManager.scene.add(this.sky);

    const uniforms = this.sky.material.uniforms;
    uniforms['turbidity'].value = 6;
    uniforms['rayleigh'].value = 1.5;
    uniforms['mieCoefficient'].value = 0.005;
    uniforms['mieDirectionalG'].value = 0.8;

    // Sun at ~30° elevation — bright daylight, good visibility
    const phi = THREE.MathUtils.degToRad(60); // 90 - elevation; 60 → 30° above horizon
    const theta = THREE.MathUtils.degToRad(200);
    const sun = new THREE.Vector3();
    sun.setFromSphericalCoords(1, phi, theta);
    uniforms['sunPosition'].value.copy(sun);
  }
}
