/**
 * Orchestrateur impératif de la map : monde, simulation, caméra, sélection,
 * survol et étiquettes HTML projetées. Indépendant de React (le composant
 * Scene se contente de le créer et d'appeler frame()).
 */
import * as THREE from "three";
import type { FloorPlanLayout, ObjectDef } from "@/lib/map/layout";
import type { MapSnapshot } from "@/lib/map/snapshot";
import { useMap } from "@/lib/map/store";
import { basic } from "../kit/cache";
import { radialTexture } from "../kit/textures";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { CameraDirector, type OrbitControlsImpl } from "./camera";
import { Sim } from "./sim";
import { World, type Pickable } from "./world";

const ACCENT = "#E07A5F";
const BG = "#EEECE6";

export interface LabelRefs {
  hover: HTMLDivElement | null;
  select: HTMLDivElement | null;
}

export class MapEngine {
  world: World;
  sim: Sim;
  director: CameraDirector;
  raycaster = new THREE.Raycaster();
  brackets: THREE.LineSegments;
  halo: THREE.Mesh;
  labels: LabelRefs = { hover: null, select: null };
  private tmpBox = new THREE.Box3();
  private selected: Pickable | null = null;
  private hovered: Pickable | null = null;
  private t = 0;
  private pmrem?: THREE.PMREMGenerator;
  renderer?: THREE.WebGLRenderer;
  private unsubscribe: () => void = () => {};

  dispose() {
    this.unsubscribe();
    this.scene.remove(this.world.root, this.brackets, this.halo);
    this.pmrem?.dispose();
  }

  constructor(
    public scene: THREE.Scene,
    public camera: THREE.PerspectiveCamera,
    controls: OrbitControlsImpl,
    public layout: FloorPlanLayout,
    renderer?: THREE.WebGLRenderer,
  ) {
    // Lumière d'environnement douce (RoomEnvironment), fond et brouillard de la couleur du fond
    this.renderer = renderer;
    if (process.env.NODE_ENV !== "production") (window as unknown as { __map?: MapEngine }).__map = this;
    if (renderer) {
      this.pmrem = new THREE.PMREMGenerator(renderer);
      scene.environment = this.pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      scene.environmentIntensity = 0.4;
    }
    scene.background = new THREE.Color(BG);
    scene.fog = new THREE.Fog(BG, 170, 420);
    this.world = new World(layout);
    scene.add(this.world.root);
    this.sim = new Sim(this.world, layout);
    this.director = new CameraDirector(camera, controls);
    // Vue d'ensemble : centre de l'emprise des zones (bâtiment + cours), hors rue
    const zonePts = layout.zones.filter((z) => z.type !== "exterieur" || !/rue/.test(z.key)).flatMap((z) => z.polygon).filter((p) => Math.abs(p[0]) < 70);
    const xs = zonePts.map((p) => p[0]);
    const zs = zonePts.map((p) => p[1]);
    this.director.homeTarget.set((Math.min(...xs) + Math.max(...xs)) / 2 - 3, 0, (Math.min(...zs) + Math.max(...zs)) / 2);

    // Crochets d'angle 3D (8 coins × 3 segments), visibles à travers les objets
    const pts: number[] = [];
    for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
      const k = 0.28;
      pts.push(x, y, z, x - x * k, y, z, x, y, z, x, y - y * k, z, x, y, z, x, y, z - z * k);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    this.brackets = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: ACCENT, depthTest: false, transparent: true }));
    this.brackets.renderOrder = 999;
    this.brackets.visible = false;
    scene.add(this.brackets);
    this.halo = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), basic(ACCENT, { transparent: true, map: radialTexture("rgba(224,122,95,0.55)") }));
    (this.halo.material as THREE.MeshBasicMaterial).depthWrite = false;
    this.halo.rotation.x = -Math.PI / 2;
    this.halo.renderOrder = 2;
    this.halo.visible = false;
    scene.add(this.halo);

    this.unsubscribe = useMap.subscribe((s, prev) => {
      if (s.selection?.pickId !== prev.selection?.pickId) this.onSelect(s.selection?.pickId ?? null);
      if (s.following !== prev.following) this.director.followTarget = s.following && this.selected ? this.selected.object : null;
    });
  }

  reconcile(s: MapSnapshot, instant = false) {
    this.sim.reconcile(s, { instant });
    // la sélection peut pointer vers un objet recréé
    if (this.selected && !this.world.pickables.has(this.selected.id)) this.selected = null;
  }

  // ---------------------------------------------------------------- sélection
  pickAt(ndc: THREE.Vector2): Pickable | null {
    this.raycaster.setFromCamera(ndc, this.camera);
    const hits = this.raycaster.intersectObjects(this.world.pickMeshes, false);
    let best: { p: Pickable; d: number } | null = null;
    for (const h of hits) {
      if (!isVisible(h.object)) continue;
      const p = this.world.pickables.get(h.object.userData.pickId);
      if (!p) continue;
      if (!best || p.priority > best.p.priority || (p.priority === best.p.priority && h.distance < best.d)) best = { p, d: h.distance };
    }
    return best?.p ?? null;
  }

  selectPick(id: string | null, fly = true) {
    const p = id ? this.world.pickables.get(id) : null;
    useMap.getState().select(p ? { pickId: p.id, kind: p.kind, entityType: p.entityType, entityId: p.entityId, label: p.label } : null);
    if (p && fly) {
      const box = this.tmpBox.setFromObject(p.object);
      const size = box.getSize(new THREE.Vector3()).length();
      const c = box.getCenter(new THREE.Vector3());
      void this.director.flyTo(new THREE.Vector3(c.x, 0.5, c.z), Math.min(size, 10));
    }
  }

  private onSelect(id: string | null) {
    this.selected = id ? this.world.pickables.get(id) ?? null : null;
    this.brackets.visible = this.halo.visible = Boolean(this.selected);
  }

  setHover(p: Pickable | null) {
    this.hovered = p;
    useMap.getState().hover(p?.id ?? null);
  }

  /** Trouve l'objet de la map correspondant à une entité métier. */
  resolve(entityType: string, entityId: string): string | null {
    const w = this.world;
    const direct: Record<string, string> = { employees: `person:${entityId}`, work_orders: `wo:${entityId}`, lots: `lot:${entityId}` };
    if (direct[entityType] && w.pickables.has(direct[entityType])) return direct[entityType];
    if (entityType === "zones") {
      const key = w.layout.zones.find((z) => z.key === entityId)?.key ?? useMap.getState().snapshot?.zones.find((z) => z.id === entityId)?.key;
      return key ? `zone:${key}` : null;
    }
    if (entityType === "stock_items") {
      const loc = useMap.getState().snapshot?.stock.find((s) => s.id === entityId)?.location;
      const letter = loc?.[0];
      for (const p of w.pickables.values()) if (p.entityType === "stock_rack" && p.entityId === `rack:${letter}`) return p.id;
      return null;
    }
    if (entityType === "clients") {
      const wo = useMap.getState().snapshot?.workOrders.find((x) => x.clientId === entityId && w.pickables.has(`wo:${x.id}`));
      return wo ? `wo:${wo.id}` : null;
    }
    for (const p of w.pickables.values()) if (p.entityId === entityId) return p.id;
    return null;
  }

  // ---------------------------------------------------------------- boucle
  frame(dt: number) {
    this.t += dt;
    this.sim.frame(dt);
    this.director.update(Math.min(dt, 0.25)); // la caméra suit le temps réel, même à faible cadence
    if (this.selected) {
      const b = this.tmpBox.setFromObject(this.selected.object, true);
      if (!b.isEmpty()) {
        const size = b.getSize(new THREE.Vector3());
        const c = b.getCenter(new THREE.Vector3());
        const pulse = 1 + Math.sin(this.t * 4) * 0.04;
        this.brackets.position.copy(c);
        this.brackets.scale.set((size.x / 2 + 0.15) * pulse, (size.y / 2 + 0.15) * pulse, (size.z / 2 + 0.15) * pulse);
        const r = Math.max(size.x, size.z) * 1.6 + 1.2;
        this.halo.position.set(c.x, 0.05, c.z);
        this.halo.scale.set(r, r, 1);
        this.place(this.labels.select, new THREE.Vector3(c.x, b.max.y + 0.4, c.z));
      }
    } else if (this.labels.select) this.labels.select.style.opacity = "0";
    if (this.hovered && this.hovered !== this.selected) {
      const b = this.tmpBox.setFromObject(this.hovered.object, true);
      const c = b.getCenter(new THREE.Vector3());
      this.place(this.labels.hover, new THREE.Vector3(c.x, this.hovered.kind === "zone" ? 0.5 : b.max.y + 0.3, c.z));
    } else if (this.labels.hover) this.labels.hover.style.opacity = "0";
  }

  /** Étiquette HTML projetée, masquée derrière la caméra. */
  private place(el: HTMLDivElement | null, p: THREE.Vector3) {
    if (!el) return;
    const v = p.clone().project(this.camera);
    const behind = v.z > 1;
    const parent = el.parentElement;
    if (!parent || behind) {
      el.style.opacity = "0";
      return;
    }
    const x = ((v.x + 1) / 2) * parent.clientWidth;
    const y = ((1 - v.y) / 2) * parent.clientHeight;
    el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -100%)`;
    el.style.opacity = "1";
  }

  // ---------------------------------------------------------------- mode édition du plan
  enterEdit() {
    this.world.unbake();
    this.selectPick(null, false);
  }

  exitEdit() {
    this.world.bake();
    this.sim.relayout(this.layout);
  }

  /** Objet du plan sous le pointeur (mode édition : tout objet, pas seulement les entités). */
  pickObject(ndc: THREE.Vector2): string | null {
    this.raycaster.setFromCamera(ndc, this.camera);
    const groups = [...this.world.objects.values()].map((o) => o.built.group);
    const hits = this.raycaster.intersectObjects(groups, true);
    for (const h of hits) {
      for (let o: THREE.Object3D | null = h.object; o; o = o.parent) if (this.world.objects.has(o.name)) return o.name;
    }
    return null;
  }

  groundPoint(ndc: THREE.Vector2): THREE.Vector3 | null {
    this.raycaster.setFromCamera(ndc, this.camera);
    const p = new THREE.Vector3();
    return this.raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), p) ? p : null;
  }

  /** Remplace les objets du plan (annuler / rétablir / chargement). */
  setObjects(objects: ObjectDef[]) {
    const next = new Map(objects.map((o) => [o.id, o]));
    for (const [id, cur] of [...this.world.objects]) {
      const n = next.get(id);
      if (!n || JSON.stringify(n) !== JSON.stringify(cur.def)) this.world.removeObject(id);
    }
    for (const o of objects) if (!this.world.objects.has(o.id)) this.world.addObject(o);
    this.layout.objects = objects;
  }

  objectPosition(pickId: string): THREE.Vector3 | null {
    const p = this.world.pickables.get(pickId);
    if (!p) return null;
    return this.tmpBox.setFromObject(p.object).getCenter(new THREE.Vector3());
  }
}

/** Visible à l'écran : les maillages fusionnés (baked) comptent comme visibles. */
function isVisible(o: THREE.Object3D) {
  for (let c: THREE.Object3D | null = o; c; c = c.parent) if (!c.visible && !c.userData.baked) return false;
  return true;
}

/** Référence globale à l'instance (pour le HUD). */
export const engineRef: { current: MapEngine | null } = { current: null };
