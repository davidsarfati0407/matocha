/**
 * Construit la scène statique depuis le plan JSON (sols, murs en coupe,
 * cloisons vitrées, clôtures, route, objets) et tient le registre des objets
 * cliquables. Aucune pièce codée en dur : tout vient du layout.
 */
import * as THREE from "three";
import type { FloorPlanLayout, ObjectDef, Vec2, WallDef } from "@/lib/map/layout";
import { polygonCentroid } from "@/lib/map/layout";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { P, box, mat, mesh, plane } from "../kit/cache";
import { buildObject, type Built } from "../kit/furniture";
import { floorTexture, groundTexture, logoTexture, paintedText, roadTexture, wallTexture } from "../kit/textures";

export type PickKind = "zone" | "object" | "person" | "vehicle" | "parcel" | "pallet";

export interface Pickable {
  id: string;
  kind: PickKind;
  /** Type et identifiant d'entité métier (assets, employees, work_orders, stock_rack, zones, lots, vehicles…). */
  entityType: string;
  entityId: string;
  label: string;
  /** Plus haut = gagne au clic (les sols et volumes englobants sont bas). */
  priority: number;
  object: THREE.Object3D;
  zoneKey?: string;
}

const HIGH = 4.2;
const LOW = 0.7;
const THICK = 0.2;

export class World {
  root = new THREE.Group();
  pickables = new Map<string, Pickable>();
  /** Maillages testés par le raycaster (userData.pickId). */
  pickMeshes: THREE.Object3D[] = [];
  animated: ((t: number, dt: number) => void)[] = [];
  objects = new Map<string, { def: ObjectDef; built: Built }>();
  zoneMeshes = new Map<string, THREE.Mesh>();
  private objectsGroup = new THREE.Group();

  constructor(public layout: FloorPlanLayout) {
    this.root.name = "world";
    this.build();
  }

  register(p: Pickable) {
    this.pickables.set(p.id, p);
    p.object.traverse((o) => {
      if ((o as THREE.Mesh).isMesh && !o.userData.noPick) {
        o.userData.pickId = p.id;
        this.pickMeshes.push(o);
      }
    });
  }

  unregister(id: string) {
    const p = this.pickables.get(id);
    if (!p) return;
    this.pickables.delete(id);
    this.pickMeshes = this.pickMeshes.filter((m) => m.userData.pickId !== id);
  }

  private build() {
    const L = this.layout;
    // Terrain
    const [x0, z0] = L.bounds.min;
    const [x1, z1] = L.bounds.max;
    const gw = x1 - x0 + 200;
    const gd = z1 - z0 + 200;
    const ground = mesh(plane(gw, gd), new THREE.MeshStandardMaterial({ map: groundTexture(), roughness: 1 }), (x0 + x1) / 2, -0.02, (z0 + z1) / 2, false, true);
    (ground.material as THREE.MeshStandardMaterial).map!.repeat.set(gw / 8, gd / 8);
    ground.rotation.x = -Math.PI / 2;
    this.root.add(ground);

    // Routes
    for (const r of L.roads) {
      for (let i = 0; i < r.points.length - 1; i++) {
        const a = r.points[i];
        const b = r.points[i + 1];
        const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
        const tex = r.traffic ? roadTexture().clone() : groundTexture();
        if (r.traffic) {
          tex.repeat.set(len / 16, 1);
          tex.needsUpdate = true;
        }
        const m = mesh(plane(len, r.width), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.95, color: r.traffic ? "#ffffff" : "#B9B6AE" }), (a[0] + b[0]) / 2, 0.005, (a[1] + b[1]) / 2, false, true);
        m.rotation.x = -Math.PI / 2;
        m.rotation.z = -Math.atan2(b[1] - a[1], b[0] - a[0]);
        this.root.add(m);
        if (r.traffic)
          for (const side of [-1, 1]) {
            const curb = mesh(box(len, 0.14, 2.4), mat("#D8D3C7"), (a[0] + b[0]) / 2, 0.07, (a[1] + b[1]) / 2 + side * (r.width / 2 + 1.2), false, true);
            this.root.add(curb);
          }
      }
    }

    // Zones (sols texturés + libellés peints)
    for (const z of L.zones) {
      const shape = new THREE.Shape(z.polygon.map(([x, zz]) => new THREE.Vector2(x, -zz)));
      const g = new THREE.ShapeGeometry(shape);
      const indoor = !["paves", "gazon", "enrobe"].includes(z.floor) || z.type !== "exterieur";
      const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: floorTexture(z.floor), roughness: z.floor === "beton_cire" || z.floor === "resine" ? 0.55 : 0.85 }));
      m.rotation.x = -Math.PI / 2;
      m.position.y = indoor && z.type !== "exterieur" ? 0.03 : 0.012;
      m.receiveShadow = true;
      m.name = `zone:${z.key}`;
      this.root.add(m);
      this.zoneMeshes.set(z.key, m);
      if (z.type !== "exterieur" || z.floor !== "enrobe") {
        // Les zones sont cliquables, avec une priorité basse
        this.register({ id: `zone:${z.key}`, kind: "zone", entityType: "zones", entityId: z.key, label: z.name, priority: 0, object: m, zoneKey: z.key });
      }
      if (z.label) {
        const tex = paintedText(z.label.text, { font: 64 });
        const aspect = (tex.userData as { aspect: number }).aspect;
        const h = z.label.size ?? 0.6;
        const lbl = new THREE.Mesh(plane(h * aspect, h), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, opacity: 0.9 }));
        lbl.rotation.x = -Math.PI / 2;
        lbl.rotation.z = z.label.rotation ?? 0;
        lbl.position.set(z.label.at[0], m.position.y + 0.01, z.label.at[1]);
        this.root.add(lbl);
      }
    }

    // Dalle du bâtiment (socle)
    for (const b of L.buildings) {
      const shape = new THREE.Shape(b.outline.map(([x, zz]) => new THREE.Vector2(x, -zz)));
      const slab = new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth: 0.03, bevelEnabled: false }), mat("#BDB7AA"));
      slab.rotation.x = -Math.PI / 2;
      slab.position.y = -0.005;
      slab.receiveShadow = true;
      this.root.add(slab);
    }

    for (const w of L.walls) this.buildWall(w);
    for (const p of L.partitions) this.buildPartition(p.a, p.b, p.openings ?? []);
    for (const f of L.fences) this.buildFence(f.points, f.gates ?? []);

    // Bandeau de marque sur le mur haut le plus long (identité)
    const highWalls = L.walls.filter((w) => w.height === "high").sort((a, b) => len(b) - len(a));
    if (highWalls[0]) {
      const w = highWalls[0];
      const mid: Vec2 = [(w.a[0] + w.b[0]) / 2, (w.a[1] + w.b[1]) / 2];
      const ang = Math.atan2(w.b[1] - w.a[1], w.b[0] - w.a[0]);
      const sign = new THREE.Mesh(plane(9, 2.25), new THREE.MeshBasicMaterial({ map: logoTexture("MATOCHA"), toneMapped: false }));
      const n = inwardNormal(w, L.buildings[0].outline);
      sign.position.set(mid[0] + n[0] * (THICK / 2 + 0.02), 2.75, mid[1] + n[1] * (THICK / 2 + 0.02));
      sign.rotation.y = -ang;
      this.root.add(sign);
    }

    this.root.add(this.objectsGroup);
    for (const o of L.objects) this.addObject(o);
    this.bake();
  }

  private baked = new THREE.Group();
  /**
   * Fusion des maillages statiques par matériau : quelques dizaines d'appels de
   * dessin au lieu de milliers. Les maillages d'origine restent dans la scène,
   * invisibles (userData.baked), pour la sélection et les boîtes englobantes.
   */
  bake() {
    this.unbake();
    this.root.updateMatrixWorld(true);
    const buckets = new Map<string, { material: THREE.Material; cast: boolean; geoms: THREE.BufferGeometry[] }>();
    const consider = (m: THREE.Mesh) => {
      if (!m.isMesh || (m as unknown as THREE.InstancedMesh).isInstancedMesh || m.userData.screen || m.userData.dynamic || !m.visible) return;
      if (Array.isArray(m.material) || (m.material as THREE.Material).transparent && (m.material as THREE.MeshBasicMaterial).map) return;
      const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
      if (!g.attributes.uv || !g.attributes.normal) return;
      for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv"].includes(k)) g.deleteAttribute(k);
      g.applyMatrix4(m.matrixWorld);
      const mat = m.material as THREE.Material;
      const key = `${mat.uuid}:${m.castShadow}`;
      const b = buckets.get(key) ?? { material: mat, cast: m.castShadow, geoms: [] };
      b.geoms.push(g);
      buckets.set(key, b);
      m.visible = false;
      m.userData.baked = true;
    };
    for (const c of this.root.children) if ((c as THREE.Mesh).isMesh && c.userData.bakeable) consider(c as THREE.Mesh);
    for (const { def, built } of this.objects.values()) {
      if (built.anim && def.kit !== "desk") continue;
      built.group.traverse((o) => consider(o as THREE.Mesh));
    }
    for (const b of buckets.values()) {
      const merged = mergeGeometries(b.geoms, false);
      b.geoms.forEach((g) => g.dispose());
      if (!merged) continue;
      const m = new THREE.Mesh(merged, b.material);
      m.castShadow = b.cast;
      m.receiveShadow = true;
      m.matrixAutoUpdate = false;
      this.baked.add(m);
    }
    this.root.add(this.baked);
  }

  /** Réaffiche les maillages d'origine (mode édition du plan). */
  unbake() {
    this.root.remove(this.baked);
    this.baked.children.forEach((c) => (c as THREE.Mesh).geometry.dispose());
    this.baked.clear();
    this.root.traverse((o) => {
      if (o.userData.baked) {
        o.visible = true;
        delete o.userData.baked;
      }
    });
  }

  addObject(o: ObjectDef) {
    const built = buildObject(o);
    this.objectsGroup.add(built.group);
    this.objects.set(o.id, { def: o, built });
    if (built.anim) this.animated.push(built.anim);
    if (o.entity || o.label) {
      this.register({
        id: `obj:${o.id}`,
        kind: "object",
        entityType: o.entity?.type ?? "objects",
        entityId: o.entity?.id ?? o.id,
        label: o.label ?? o.kit,
        priority: o.kit === "meeting_table" || o.kit === "low_table" ? 1 : 5,
        object: built.group,
        zoneKey: o.zone,
      });
    }
    return built;
  }

  removeObject(id: string) {
    const entry = this.objects.get(id);
    if (!entry) return;
    this.objectsGroup.remove(entry.built.group);
    this.objects.delete(id);
    if (entry.built.anim) this.animated = this.animated.filter((a) => a !== entry.built.anim);
    this.unregister(`obj:${id}`);
  }

  private buildWall(w: WallDef) {
    const length = len(w);
    const ang = Math.atan2(w.b[1] - w.a[1], w.b[0] - w.a[0]);
    const high = w.height === "high";
    const H = high ? HIGH : LOW;
    const tex = wallTexture(w.material).clone();
    tex.needsUpdate = true;
    const wallMat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.9 });
    const capMat = mat(high ? P.ivoryDeep : P.green, { roughness: 0.6 });
    const glass = mat(P.glass, { transparent: true, opacity: 0.35, roughness: 0.05, metalness: 0.1 });
    const pieces: [number, number, number, number][] = []; // [from, to, yBottom, yTop]
    let cursor = 0;
    const openings = [...(w.openings ?? [])].sort((p, q) => p.at - q.at);
    for (const o of openings) {
      if (o.at > cursor) pieces.push([cursor, o.at, 0, H]);
      if (o.kind === "window" && high) {
        pieces.push([o.at, o.at + o.width, 0, 1.0]);
        pieces.push([o.at, o.at + o.width, 2.5, H]);
        this.segment(w.a, ang, o.at, o.at + o.width, 1.0, 2.5, glass, THICK * 0.3);
      } else if (high && (o.kind === "door" || o.kind === "dock")) {
        pieces.push([o.at, o.at + o.width, o.kind === "dock" ? 3.5 : 2.4, H]);
      } else if (!high && o.kind === "window") {
        pieces.push([o.at, o.at + o.width, 0, H]);
      }
      cursor = Math.max(cursor, o.at + o.width);
    }
    if (cursor < length) pieces.push([cursor, length, 0, H]);
    for (const [f, t, yb, yt] of pieces) {
      const m = this.segment(w.a, ang, f, t, yb, yt, wallMat, THICK);
      const uvScale = (t - f) / 4;
      if ((m.geometry as THREE.BufferGeometry).attributes.uv) scaleUV(m.geometry as THREE.BufferGeometry, uvScale, (yt - yb) / HIGH);
      if (yt === H) this.segment(w.a, ang, f, t, H, H + 0.06, capMat, THICK + 0.04);
    }
  }

  private segment(a: Vec2, ang: number, from: number, to: number, yb: number, yt: number, m: THREE.Material, thick: number) {
    const l = to - from;
    const g = new THREE.BoxGeometry(l, yt - yb, thick);
    const mm = new THREE.Mesh(g, m);
    const mid = from + l / 2;
    mm.position.set(a[0] + Math.cos(ang) * mid, (yb + yt) / 2, a[1] + Math.sin(ang) * mid);
    mm.rotation.y = -ang;
    mm.castShadow = true;
    mm.receiveShadow = true;
    mm.userData.bakeable = true;
    this.root.add(mm);
    return mm;
  }

  private buildPartition(a: Vec2, b: Vec2, openings: { at: number; width: number }[]) {
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
    const glass = mat("#D7E8EC", { transparent: true, opacity: 0.22, roughness: 0.05, depthWrite: false });
    const frame = mat("#2B302D", { roughness: 0.4, metalness: 0.3 });
    const H = 2.6;
    let cursor = 0;
    const spans: [number, number][] = [];
    for (const o of [...openings].sort((p, q) => p.at - q.at)) {
      if (o.at > cursor) spans.push([cursor, o.at]);
      cursor = o.at + o.width;
      // linteau au-dessus de la porte
      this.segment(a, ang, o.at, o.at + o.width, 2.2, H, glass, 0.04);
      this.segment(a, ang, o.at, o.at + o.width, 2.18, 2.22, frame, 0.06);
    }
    if (cursor < length) spans.push([cursor, length]);
    for (const [f, t] of spans) {
      const gl = this.segment(a, ang, f, t, 0.03, H, glass, 0.03);
      gl.castShadow = false;
      this.segment(a, ang, f, t, H - 0.03, H + 0.02, frame, 0.06);
      this.segment(a, ang, f, t, 0.02, 0.1, frame, 0.06);
      for (let x = f; x <= t + 0.01; x += Math.max(0.9, (t - f) / Math.max(1, Math.round((t - f) / 1.2)))) this.segment(a, ang, x - 0.02, x + 0.02, 0.03, H, frame, 0.06);
    }
  }

  private buildFence(points: Vec2[], gates: { at: number; width: number }[]) {
    const post = mat("#5E666C", { metalness: 0.3, roughness: 0.5 });
    const mesh_ = mat("#B9BEC1", { transparent: true, opacity: 0.16, side: THREE.DoubleSide, depthWrite: false });
    let offset = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const a = points[i];
      const b = points[i + 1];
      const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const ang = Math.atan2(b[1] - a[1], b[0] - a[0]);
      const local = gates.map((g) => [g.at - offset, g.at - offset + g.width] as const).filter(([s, e]) => e > 0 && s < l);
      let cursor = 0;
      const spans: [number, number][] = [];
      for (const [s, e] of local) {
        if (s > cursor) spans.push([cursor, s]);
        cursor = Math.max(cursor, e);
      }
      if (cursor < l) spans.push([cursor, l]);
      for (const [f, t] of spans) {
        const p = this.segment(a, ang, f, t, 0.05, 1.25, mesh_, 0.02);
        p.castShadow = false;
        this.segment(a, ang, f, t, 1.22, 1.27, post, 0.04);
        for (let x = f; x <= t; x += 2.5) this.segment(a, ang, x - 0.03, x + 0.03, 0, 1.3, post, 0.06);
      }
      offset += l;
    }
  }

  zoneCenter(key: string): Vec2 | null {
    const z = this.layout.zones.find((zz) => zz.key === key);
    return z ? polygonCentroid(z.polygon) : null;
  }

  update(t: number, dt: number) {
    for (const a of this.animated) a(t, dt);
  }
}

function len(w: { a: Vec2; b: Vec2 }) {
  return Math.hypot(w.b[0] - w.a[0], w.b[1] - w.a[1]);
}

function inwardNormal(w: WallDef, outline: Vec2[]): Vec2 {
  const dx = w.b[0] - w.a[0];
  const dz = w.b[1] - w.a[1];
  const l = Math.hypot(dx, dz);
  const n: Vec2 = [-dz / l, dx / l];
  const mid: Vec2 = [(w.a[0] + w.b[0]) / 2 + n[0], (w.a[1] + w.b[1]) / 2 + n[1]];
  let inside = false;
  for (let i = 0, j = outline.length - 1; i < outline.length; j = i++) {
    const [xi, zi] = outline[i];
    const [xj, zj] = outline[j];
    if (zi > mid[1] !== zj > mid[1] && mid[0] < ((xj - xi) * (mid[1] - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside ? n : [-n[0], -n[1]];
}

function scaleUV(g: THREE.BufferGeometry, su: number, sv: number) {
  const uv = g.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
  uv.needsUpdate = true;
}
