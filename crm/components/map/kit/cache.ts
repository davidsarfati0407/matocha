/**
 * Cache de géométries et de matériaux : même clé = même instance (GPU partagé).
 */
import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

const geoms = new Map<string, THREE.BufferGeometry>();
const mats = new Map<string, THREE.Material>();

export function geom<T extends THREE.BufferGeometry>(key: string, make: () => T): T {
  let g = geoms.get(key) as T | undefined;
  if (!g) {
    g = make();
    geoms.set(key, g);
  }
  return g;
}

const r2 = (v: number) => Math.round(v * 100) / 100;

/** Boîte aux arêtes arrondies, centrée, en cache. */
export const rbox = (w: number, h: number, d: number, radius = 0.04, seg = Math.max(w, h, d) < 0.35 ? 1 : 2) =>
  geom(`rbox:${r2(w)}:${r2(h)}:${r2(d)}:${radius}:${seg}`, () => new RoundedBoxGeometry(w, h, d, seg, Math.min(radius, w / 2 - 0.001, h / 2 - 0.001, d / 2 - 0.001)));
export const box = (w: number, h: number, d: number) => geom(`box:${r2(w)}:${r2(h)}:${r2(d)}`, () => new THREE.BoxGeometry(w, h, d));
export const cyl = (rt: number, rb: number, h: number, seg = 16) => geom(`cyl:${r2(rt)}:${r2(rb)}:${r2(h)}:${seg}`, () => new THREE.CylinderGeometry(rt, rb, h, seg));
export const sphere = (r: number, seg = 16) => geom(`sph:${r2(r)}:${seg}`, () => new THREE.SphereGeometry(r, seg, Math.max(8, seg * 0.75)));
export const capsule = (r: number, len: number) => geom(`cap:${r2(r)}:${r2(len)}`, () => new THREE.CapsuleGeometry(r, len, 4, 10));
export const cone = (r: number, h: number, seg = 16) => geom(`cone:${r2(r)}:${r2(h)}:${seg}`, () => new THREE.ConeGeometry(r, h, seg));
export const plane = (w: number, h: number) => geom(`plane:${r2(w)}:${r2(h)}`, () => new THREE.PlaneGeometry(w, h));
export const torus = (r: number, t: number) => geom(`torus:${r2(r)}:${r2(t)}`, () => new THREE.TorusGeometry(r, t, 8, 24));

export interface MatOpts {
  roughness?: number;
  metalness?: number;
  emissive?: string;
  emissiveIntensity?: number;
  transparent?: boolean;
  opacity?: number;
  map?: THREE.Texture;
  side?: THREE.Side;
  depthWrite?: boolean;
}

export function mat(color: string, o: MatOpts = {}): THREE.MeshStandardMaterial {
  const key = `std:${color}:${JSON.stringify({ ...o, map: o.map?.uuid })}`;
  let m = mats.get(key) as THREE.MeshStandardMaterial | undefined;
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      roughness: o.roughness ?? 0.82,
      metalness: o.metalness ?? 0,
      emissiveIntensity: o.emissiveIntensity ?? 1,
      transparent: o.transparent ?? false,
      opacity: o.opacity ?? 1,
      side: o.side ?? THREE.FrontSide,
      depthWrite: o.depthWrite ?? true,
    });
    if (o.emissive) m.emissive = new THREE.Color(o.emissive);
    if (o.map) m.map = o.map;
    mats.set(key, m);
  }
  return m;
}

export function basic(color: string, o: { transparent?: boolean; opacity?: number; map?: THREE.Texture; depthTest?: boolean; blending?: THREE.Blending } = {}) {
  const key = `basic:${color}:${JSON.stringify({ ...o, map: o.map?.uuid })}`;
  let m = mats.get(key) as THREE.MeshBasicMaterial | undefined;
  if (!m) {
    m = new THREE.MeshBasicMaterial({ color, transparent: o.transparent ?? false, opacity: o.opacity ?? 1, depthTest: o.depthTest ?? true, blending: o.blending ?? THREE.NormalBlending });
    if (o.map) m.map = o.map;
    mats.set(key, m);
  }
  return m;
}

/** Maillage avec ombres portées et reçues. */
export function mesh(g: THREE.BufferGeometry, m: THREE.Material, x = 0, y = 0, z = 0, cast = true, receive = true) {
  const o = new THREE.Mesh(g, m);
  o.position.set(x, y, z);
  o.castShadow = cast;
  o.receiveShadow = receive;
  return o;
}

/** Palette de la scène (neutre + identité). Les couleurs de statut restent réservées à l'interface. */
export const P = {
  ivory: "#F3EFE5",
  ivoryDeep: "#E7E1D2",
  plaster: "#EEE8DC",
  wood: "#D8B88A",
  woodDark: "#A9825A",
  woodPale: "#E6D2AE",
  concrete: "#CFCBC3",
  steel: "#9AA1A6",
  steelDark: "#5E666C",
  ink: "#24261F",
  white: "#FBFAF6",
  green: "#173D2B",
  greenDeep: "#0F2A1E",
  matcha: "#79A84B",
  leaf: "#5E8F3E",
  leafDark: "#3F6B2B",
  cardboard: "#C9A77A",
  glass: "#BFD8DE",
  screen: "#1B1E1A",
  coral: "#E07A5F",
};

export function disposeCaches() {
  geoms.forEach((g) => g.dispose());
  mats.forEach((m) => m.dispose());
  geoms.clear();
  mats.clear();
}
