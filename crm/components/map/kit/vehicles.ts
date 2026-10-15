/**
 * Véhicules : utilitaire, camion porteur à caisse logotée, voiture, vélo-cargo.
 * Les roues tournent selon la distance parcourue ; phares légèrement émissifs.
 * Le véhicule regarde vers +z (local).
 */
import * as THREE from "three";
import { P, box, cyl, mat, mesh, rbox } from "./cache";
import { logoTexture, radialTexture } from "./textures";

export interface VehicleRig {
  root: THREE.Group;
  wheels: THREE.Object3D[];
  wheelRadius: number;
  length: number;
  /** Portes arrière / rideau pour l'animation de chargement. */
  door?: THREE.Object3D;
  beacon?: THREE.Mesh;
}

const tire = () => mat("#232421", { roughness: 0.9 });
const rim = () => mat("#C9CCCF", { metalness: 0.3, roughness: 0.4 });
const glassMat = () => mat("#2D3A40", { roughness: 0.15, metalness: 0.2 });
const headlight = () => mat("#FFF6DA", { emissive: "#FFF1C4", emissiveIntensity: 0.6 });
const taillight = () => mat("#B8322A", { emissive: "#8A1F18", emissiveIntensity: 0.5 });

function wheel(r: number, w: number) {
  const g = new THREE.Group();
  const t = mesh(cyl(r, r, w, 18), tire());
  t.rotation.z = Math.PI / 2;
  const h = mesh(cyl(r * 0.55, r * 0.55, w + 0.01, 12), rim());
  h.rotation.z = Math.PI / 2;
  g.add(t, h);
  return g;
}

function contactShadow(w: number, l: number) {
  const s = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.5, l * 1.25), new THREE.MeshBasicMaterial({ map: radialTexture("rgba(20,22,18,0.4)"), transparent: true, depthWrite: false }));
  s.rotation.x = -Math.PI / 2;
  s.position.y = 0.015;
  return s;
}

function wheelsAt(root: THREE.Group, r: number, w: number, xs: number, zs: number[]) {
  const out: THREE.Object3D[] = [];
  for (const z of zs)
    for (const x of [-xs, xs]) {
      const wh = wheel(r, w);
      wh.position.set(x, r, z);
      root.add(wh);
      out.push(wh);
    }
  return out;
}

export function buildVan(opts: { color?: string; brand?: string; repair?: boolean } = {}): VehicleRig {
  const root = new THREE.Group();
  const body = mat(opts.color ?? P.white, { roughness: 0.45 });
  const L = 5.2;
  root.add(mesh(rbox(1.95, 1.55, 3.6, 0.18), body, 0, 1.25, -0.55));
  root.add(mesh(rbox(1.92, 1.1, 1.5, 0.22), body, 0, 1.0, 1.75));
  root.add(mesh(rbox(1.8, 0.55, 0.9, 0.15), glassMat(), 0, 1.42, 1.95));
  for (const x of [-0.99, 0.99]) root.add(mesh(rbox(0.02, 0.45, 0.9, 0.01), glassMat(), x, 1.45, 1.6));
  root.add(mesh(box(1.97, 0.12, 3.6), mat(P.green), 0, 0.85, -0.55));
  if (opts.brand) {
    const logo = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.6), new THREE.MeshStandardMaterial({ map: logoTexture(opts.brand), roughness: 0.5 }));
    logo.position.set(0.985, 1.45, -0.6);
    logo.rotation.y = Math.PI / 2;
    const logo2 = logo.clone();
    logo2.position.x = -0.985;
    logo2.rotation.y = -Math.PI / 2;
    root.add(logo, logo2);
  }
  for (const x of [-0.7, 0.7]) {
    root.add(mesh(rbox(0.32, 0.14, 0.05, 0.03), headlight(), x, 0.95, 2.5, false));
    root.add(mesh(rbox(0.12, 0.3, 0.05, 0.02), taillight(), x * 1.25, 1.2, -2.37, false));
  }
  root.add(mesh(rbox(1.9, 0.25, 0.2, 0.08), mat("#3A3D3E"), 0, 0.55, 2.45));
  const door = mesh(rbox(1.9, 1.45, 0.05, 0.03), body, 0, 1.25, -2.36);
  root.add(door);
  const wheels = wheelsAt(root, 0.36, 0.26, 0.86, [1.55, -1.45]);
  root.add(contactShadow(2, L));
  return { root, wheels, wheelRadius: 0.36, length: L, door };
}

export function buildTruck(opts: { brand?: string; cab?: string } = {}): VehicleRig {
  const root = new THREE.Group();
  const cabMat = mat(opts.cab ?? "#E9E7E1", { roughness: 0.4 });
  const L = 8.5;
  // Cabine
  root.add(mesh(rbox(2.35, 2.1, 1.9, 0.2), cabMat, 0, 1.75, 3.15));
  root.add(mesh(rbox(2.2, 0.85, 0.2, 0.06), glassMat(), 0, 2.25, 4.05));
  root.add(mesh(box(2.37, 0.5, 1.92), mat("#3A3D3E"), 0, 0.95, 3.15));
  for (const x of [-0.85, 0.85]) root.add(mesh(rbox(0.36, 0.16, 0.05, 0.03), headlight(), x, 1.05, 4.12, false));
  // Caisse logotée
  const caisse = mat(P.white, { roughness: 0.6 });
  root.add(mesh(rbox(2.45, 2.7, 6, 0.08), caisse, 0, 2.15, -0.95));
  root.add(mesh(box(2.47, 0.18, 6.02), mat("#7A7F82"), 0, 0.88, -0.95));
  if (opts.brand) {
    for (const side of [-1, 1]) {
      const logo = new THREE.Mesh(new THREE.PlaneGeometry(5, 1.25), new THREE.MeshStandardMaterial({ map: logoTexture(opts.brand, { bg: "#2F3A40", dot: "#E3B341" }), roughness: 0.5 }));
      logo.position.set(side * 1.236, 2.3, -0.95);
      logo.rotation.y = (side * Math.PI) / 2;
      root.add(logo);
    }
  }
  const door = mesh(box(2.3, 2.5, 0.06), mat("#D8D6D0"), 0, 2.15, -3.97);
  root.add(door);
  for (const x of [-1, 1]) root.add(mesh(rbox(0.14, 0.3, 0.05, 0.02), taillight(), x, 1.05, -3.98, false));
  const wheels = wheelsAt(root, 0.5, 0.36, 1.0, [3.0, -2.2, -3.2]);
  root.add(contactShadow(2.4, L));
  return { root, wheels, wheelRadius: 0.5, length: L, door };
}

const CAR_COLORS = ["#8A9AA8", "#B7472F", "#E8E6DF", "#2E3A45", "#6E7F5C", "#C9A35E", "#43464A"];
export function buildCar(colorIndex = 0): VehicleRig {
  const root = new THREE.Group();
  const paint = mat(CAR_COLORS[colorIndex % CAR_COLORS.length], { roughness: 0.35, metalness: 0.1 });
  root.add(mesh(rbox(1.8, 0.7, 4.2, 0.25), paint, 0, 0.72, 0));
  root.add(mesh(rbox(1.6, 0.62, 2.2, 0.28), paint, 0, 1.3, -0.25));
  root.add(mesh(rbox(1.62, 0.46, 2.0, 0.2), glassMat(), 0, 1.33, -0.25));
  for (const x of [-0.6, 0.6]) {
    root.add(mesh(rbox(0.32, 0.12, 0.05, 0.03), headlight(), x, 0.78, 2.1, false));
    root.add(mesh(rbox(0.3, 0.12, 0.05, 0.03), taillight(), x, 0.82, -2.1, false));
  }
  const wheels = wheelsAt(root, 0.33, 0.24, 0.8, [1.35, -1.35]);
  root.add(contactShadow(1.8, 4.2));
  return { root, wheels, wheelRadius: 0.33, length: 4.2 };
}

export function buildCargoBike(): VehicleRig {
  const root = new THREE.Group();
  const frame = mat(P.green, { roughness: 0.5 });
  const wheels: THREE.Object3D[] = [];
  for (const z of [0.85, -0.6]) {
    const w = new THREE.Group();
    const t = mesh(new THREE.TorusGeometry(0.3, 0.04, 8, 20), tire());
    t.rotation.y = Math.PI / 2;
    w.add(t);
    w.position.set(0, 0.34, z);
    root.add(w);
    wheels.push(w);
  }
  root.add(mesh(rbox(0.75, 0.5, 0.75, 0.05), mat(P.woodPale), 0, 0.72, 0.85));
  root.add(mesh(rbox(0.08, 0.08, 1.4, 0.03), frame, 0, 0.55, 0.1));
  root.add(mesh(rbox(0.08, 0.7, 0.08, 0.03), frame, 0, 0.8, -0.4));
  root.add(mesh(rbox(0.25, 0.06, 0.3, 0.03), mat("#2B2B2B"), 0, 1.15, -0.45));
  root.add(mesh(rbox(0.6, 0.05, 0.05, 0.02), mat("#2B2B2B"), 0, 1.15, 0.35));
  const logo = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.18), new THREE.MeshStandardMaterial({ map: logoTexture("MATOCHA") }));
  logo.position.set(0.38, 0.75, 0.85);
  logo.rotation.y = Math.PI / 2;
  root.add(logo);
  root.add(contactShadow(0.8, 2));
  return { root, wheels, wheelRadius: 0.34, length: 2 };
}

/** Fait tourner les roues selon la distance parcourue (m). */
export function spinWheels(v: VehicleRig, distance: number) {
  const a = distance / v.wheelRadius;
  for (const w of v.wheels) w.rotation.x += a;
}
