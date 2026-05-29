import * as THREE from 'three';

export class SceneManager {
  readonly renderer: THREE.WebGLRenderer;
  readonly scene: THREE.Scene;
  readonly camera: THREE.PerspectiveCamera;
  readonly sunDirection: THREE.Vector3;

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 0.6;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      20000,
    );
    this.camera.position.set(0, 5, -10);

    // Sun direction matching SkyRenderer (30° elevation, 200° azimuth)
    const phi = THREE.MathUtils.degToRad(60);
    const theta = THREE.MathUtils.degToRad(200);
    this.sunDirection = new THREE.Vector3();
    this.sunDirection.setFromSphericalCoords(1, phi, theta);

    // Ambient light — fills shadows
    const ambient = new THREE.AmbientLight(0x6080a0, 1.2);
    this.scene.add(ambient);

    // Directional sunlight
    const directional = new THREE.DirectionalLight(0xfff4e0, 2.5);
    directional.position.copy(this.sunDirection.clone().multiplyScalar(100));
    this.scene.add(directional);

    // Subtle fill from the opposite side so the boat is never fully in shadow
    const fill = new THREE.DirectionalLight(0xa0c0e0, 0.5);
    fill.position.set(-this.sunDirection.x * 50, 30, -this.sunDirection.z * 50);
    this.scene.add(fill);

    window.addEventListener('resize', this.onResize);
  }

  private onResize = (): void => {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  };

  render(): void {
    this.renderer.render(this.scene, this.camera);
  }

  destroy(): void {
    window.removeEventListener('resize', this.onResize);
    this.renderer.dispose();
  }
}
