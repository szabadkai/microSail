import * as THREE from 'three';
import { Water } from 'three/addons/objects/Water.js';
import type { SceneManager } from './SceneManager';

export class WaterRenderer {
  readonly water: Water;

  constructor(sceneManager: SceneManager) {
    const geometry = new THREE.PlaneGeometry(10000, 10000);

    this.water = new Water(geometry, {
      textureWidth: 512,
      textureHeight: 512,
      waterNormals: new THREE.TextureLoader().load(
        'https://threejs.org/examples/textures/waternormals.jpg',
        (texture) => {
          texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        },
      ),
      sunDirection: sceneManager.sunDirection.clone(),
      sunColor: 0xffffff,
      waterColor: 0x003050,
      distortionScale: 5.0,
      fog: false,
      alpha: 0.95,
    });

    this.water.rotation.x = -Math.PI / 2;

    // Increase wave size and speed via shader uniforms
    const material = this.water.material as THREE.ShaderMaterial;
    if (material.uniforms['size']) {
      material.uniforms['size'].value = 4.0;
    }

    sceneManager.scene.add(this.water);
  }

  update(time: number): void {
    // Moderate wave animation speed for visible wave motion
    (this.water.material as THREE.ShaderMaterial).uniforms['time'].value = time * 0.8;
  }
}
