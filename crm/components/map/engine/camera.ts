/**
 * Réalisateur caméra : intro plongeante, vol vers un objet, suivi, rotation par
 * pas de 45°, retour à la vue d'ensemble, lente orbite pendant la visite guidée.
 * Travaille en coordonnées sphériques autour de la cible des OrbitControls.
 */
import * as THREE from "three";
/** Sous-ensemble des OrbitControls utilisé ici (drei / three-stdlib). */
export interface OrbitControlsImpl {
  target: THREE.Vector3;
  enabled: boolean;
  update(): unknown;
}

export interface CamState {
  target: THREE.Vector3;
  dist: number;
  polar: number;
  az: number;
}

export const LIMITS = { minPolar: 0.28, maxPolar: 1.18, minDist: 12, maxDist: 190 };
export const HOME = { dist: 122, polar: 0.86, az: 0.66 };

const easeCubic = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2);

export class CameraDirector {
  private anim: { from: CamState; to: CamState; start: number; dur: number; done?: () => void } | null = null;
  followTarget: THREE.Object3D | null = null;
  orbitSpeed = 0;
  homeTarget = new THREE.Vector3();

  constructor(
    public camera: THREE.PerspectiveCamera,
    public controls: OrbitControlsImpl,
  ) {}

  get busy() {
    return this.anim !== null;
  }

  current(): CamState {
    const off = new THREE.Vector3().subVectors(this.camera.position, this.controls.target);
    const s = new THREE.Spherical().setFromVector3(off);
    return { target: this.controls.target.clone(), dist: s.radius, polar: s.phi, az: s.theta };
  }

  apply(s: CamState) {
    const off = new THREE.Vector3().setFromSpherical(new THREE.Spherical(s.dist, s.polar, s.az));
    this.controls.target.copy(s.target);
    this.camera.position.copy(s.target).add(off);
    this.camera.lookAt(s.target);
  }

  to(partial: Partial<CamState>, dur = 1.25): Promise<void> {
    const from = this.current();
    const to: CamState = {
      target: partial.target?.clone() ?? from.target,
      dist: THREE.MathUtils.clamp(partial.dist ?? from.dist, LIMITS.minDist, LIMITS.maxDist),
      polar: THREE.MathUtils.clamp(partial.polar ?? from.polar, LIMITS.minPolar, LIMITS.maxPolar),
      az: partial.az ?? from.az,
    };
    // plus court chemin angulaire
    let d = to.az - from.az;
    while (d > Math.PI) d -= Math.PI * 2;
    while (d < -Math.PI) d += Math.PI * 2;
    to.az = from.az + d;
    return new Promise((resolve) => {
      this.anim = { from, to, start: performance.now(), dur, done: resolve };
      this.controls.enabled = false;
    });
  }

  /** Vol vers un objet : garde l'azimut courant, distance selon la taille. */
  flyTo(target: THREE.Vector3, size = 2) {
    this.followTarget = null;
    const dist = THREE.MathUtils.clamp(18 + size * 6, 26, 70);
    return this.to({ target, dist, polar: Math.min(this.current().polar, 0.95) }, 1.25);
  }

  async intro() {
    this.apply({ target: this.homeTarget.clone(), dist: LIMITS.maxDist, polar: 0.3, az: HOME.az - 0.5 });
    await this.to({ target: this.homeTarget, dist: HOME.dist, polar: HOME.polar, az: HOME.az }, 3);
  }

  home() {
    this.followTarget = null;
    return this.to({ target: this.homeTarget, dist: HOME.dist, polar: HOME.polar, az: HOME.az }, 1.4);
  }

  rotate(delta: number) {
    return this.to({ az: this.current().az + delta }, 0.7);
  }

  zoom(factor: number) {
    return this.to({ dist: this.current().dist * factor }, 0.45);
  }

  stop() {
    if (this.anim) {
      this.anim = null;
      this.controls.enabled = true;
    }
  }

  update(dt: number) {
    if (this.anim) {
      // Horloge murale : la durée est respectée quelle que soit la cadence d'affichage
      const a = this.anim;
      const k = easeCubic(Math.min(1, (performance.now() - a.start) / 1000 / a.dur));
      this.apply({
        target: new THREE.Vector3().lerpVectors(a.from.target, a.to.target, k),
        dist: THREE.MathUtils.lerp(a.from.dist, a.to.dist, k),
        polar: THREE.MathUtils.lerp(a.from.polar, a.to.polar, k),
        az: THREE.MathUtils.lerp(a.from.az, a.to.az, k),
      });
      if (k >= 1) {
        this.anim = null;
        this.controls.enabled = true;
        this.controls.update();
        a.done?.();
      }
      return;
    }
    if (this.followTarget) {
      const p = new THREE.Vector3();
      this.followTarget.getWorldPosition(p);
      p.y = 0.8;
      const delta = p.sub(this.controls.target).multiplyScalar(Math.min(1, dt * 4));
      this.controls.target.add(delta);
      this.camera.position.add(delta);
    }
    if (this.orbitSpeed) {
      const s = this.current();
      this.apply({ ...s, az: s.az + this.orbitSpeed * dt });
    }
  }
}
