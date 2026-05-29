import * as THREE from 'three';
import type { BoatState } from '@/core/types';
import { clamp } from '@/physics/math';

// Default chase camera position (behind and above the boat)
const DEFAULT_DISTANCE = 16;
const DEFAULT_HEIGHT_ANGLE = 0.35; // radians above horizontal (~20°)
const DEFAULT_ORBIT_OFFSET = 0; // behind the boat (boat bow faces -Z in world)

const MIN_DISTANCE = 5;
const MAX_DISTANCE = 50;
const MIN_HEIGHT_ANGLE = 0.05; // nearly level with the water
const MAX_HEIGHT_ANGLE = Math.PI / 2 - 0.05; // nearly overhead

// How fast the camera returns to the default chase position when not dragging
const RETURN_SPEED = 0.8;
// Smooth follow factor for camera position
const FOLLOW_SMOOTH = 0.06;
const LOOK_SMOOTH = 0.08;

// Mouse sensitivity
const ORBIT_SENSITIVITY = 0.005;
const ZOOM_SENSITIVITY = 1.15;

export class CameraController {
  private camera: THREE.PerspectiveCamera;

  // Orbit state (relative to boat heading)
  private orbitAngle = DEFAULT_ORBIT_OFFSET;
  private heightAngle = DEFAULT_HEIGHT_ANGLE;
  private distance = DEFAULT_DISTANCE;

  // User override: when dragging, stop auto-returning to chase position
  private isDragging = false;
  private userControlled = false;
  private returnTimer = 0;

  // Smoothed position/lookAt targets
  private smoothPos = new THREE.Vector3();
  private smoothLookAt = new THREE.Vector3();
  private initialized = false;

  constructor(camera: THREE.PerspectiveCamera) {
    this.camera = camera;
    this.bindEvents();
  }

  private bindEvents(): void {
    window.addEventListener('mousedown', this.onMouseDown);
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('wheel', this.onWheel, { passive: false });

    // Touch support
    window.addEventListener('touchstart', this.onTouchStart, { passive: false });
    window.addEventListener('touchend', this.onTouchEnd);
    window.addEventListener('touchmove', this.onTouchMove, { passive: false });
  }

  private lastTouchX = 0;
  private lastTouchY = 0;

  private onMouseDown = (e: MouseEvent): void => {
    if (e.button === 0 || e.button === 2) {
      this.isDragging = true;
      this.userControlled = true;
      this.returnTimer = 0;
    }
  };

  private onMouseUp = (): void => {
    this.isDragging = false;
    this.returnTimer = 0;
  };

  private onMouseMove = (e: MouseEvent): void => {
    if (!this.isDragging) return;
    this.orbitAngle -= e.movementX * ORBIT_SENSITIVITY;
    this.heightAngle = clamp(
      this.heightAngle + e.movementY * ORBIT_SENSITIVITY,
      MIN_HEIGHT_ANGLE,
      MAX_HEIGHT_ANGLE,
    );
  };

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    this.userControlled = true;
    this.returnTimer = 0;
    if (e.deltaY > 0) {
      this.distance = Math.min(this.distance * ZOOM_SENSITIVITY, MAX_DISTANCE);
    } else {
      this.distance = Math.max(this.distance / ZOOM_SENSITIVITY, MIN_DISTANCE);
    }
  };

  private onTouchStart = (e: TouchEvent): void => {
    if (e.touches.length === 1) {
      this.isDragging = true;
      this.userControlled = true;
      this.returnTimer = 0;
      this.lastTouchX = e.touches[0].clientX;
      this.lastTouchY = e.touches[0].clientY;
    }
  };

  private onTouchEnd = (): void => {
    this.isDragging = false;
    this.returnTimer = 0;
  };

  private onTouchMove = (e: TouchEvent): void => {
    if (!this.isDragging || e.touches.length !== 1) return;
    e.preventDefault();
    const dx = e.touches[0].clientX - this.lastTouchX;
    const dy = e.touches[0].clientY - this.lastTouchY;
    this.lastTouchX = e.touches[0].clientX;
    this.lastTouchY = e.touches[0].clientY;
    this.orbitAngle -= dx * ORBIT_SENSITIVITY;
    this.heightAngle = clamp(
      this.heightAngle + dy * ORBIT_SENSITIVITY,
      MIN_HEIGHT_ANGLE,
      MAX_HEIGHT_ANGLE,
    );
  };

  update(state: BoatState): void {
    const boatPos = new THREE.Vector3(state.position.x, 0.5, -state.position.y);

    // When not dragging, slowly return orbit to behind the boat
    if (!this.isDragging && this.userControlled) {
      this.returnTimer += 1 / 60;
      // Start returning after 2 seconds of no interaction
      if (this.returnTimer > 2.0) {
        const returnFactor = RETURN_SPEED * (1 / 60);
        // Target: behind the boat
        const targetOrbit = DEFAULT_ORBIT_OFFSET;
        let diff = targetOrbit - this.orbitAngle;
        // Normalize to [-π, π]
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        this.orbitAngle += diff * returnFactor;
        this.heightAngle += (DEFAULT_HEIGHT_ANGLE - this.heightAngle) * returnFactor;
        this.distance += (DEFAULT_DISTANCE - this.distance) * returnFactor;

        // Once close enough, stop being user-controlled
        if (Math.abs(diff) < 0.01 &&
            Math.abs(this.heightAngle - DEFAULT_HEIGHT_ANGLE) < 0.01 &&
            Math.abs(this.distance - DEFAULT_DISTANCE) < 0.1) {
          this.userControlled = false;
        }
      }
    }

    // Compute camera position on a sphere around the boat
    // orbitAngle is relative to boat heading so camera follows turns
    const worldOrbit = this.orbitAngle + (-state.heading);
    const cosH = Math.cos(this.heightAngle);
    const sinH = Math.sin(this.heightAngle);

    const targetPos = new THREE.Vector3(
      boatPos.x + this.distance * cosH * Math.sin(worldOrbit),
      boatPos.y + this.distance * sinH,
      boatPos.z + this.distance * cosH * Math.cos(worldOrbit),
    );

    // Initialize on first frame
    if (!this.initialized) {
      this.smoothPos.copy(targetPos);
      this.smoothLookAt.copy(boatPos);
      this.initialized = true;
    }

    this.smoothPos.lerp(targetPos, FOLLOW_SMOOTH);
    this.smoothLookAt.lerp(boatPos, LOOK_SMOOTH);

    this.camera.position.copy(this.smoothPos);
    this.camera.lookAt(this.smoothLookAt);
  }

  destroy(): void {
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('wheel', this.onWheel);
    window.removeEventListener('touchstart', this.onTouchStart);
    window.removeEventListener('touchend', this.onTouchEnd);
    window.removeEventListener('touchmove', this.onTouchMove);
  }
}
