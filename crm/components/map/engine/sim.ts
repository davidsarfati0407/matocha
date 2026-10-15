/**
 * Moteur de simulation de la map.
 *
 * Principe : les données pilotent l'animation, jamais l'inverse. reconcile()
 * compare l'état voulu (présence, étape des commandes, lots, réservations)
 * avec l'état affiché et lance les déplacements nécessaires. Les chorégraphies
 * du scénario (camion qui recule à quai…) écrivent en base au bon moment via
 * des rappels, puis la réconciliation prend le relais.
 *
 * frame(dt) est indépendant de requestAnimationFrame (testable), avec un pas
 * de temps borné à 50 ms.
 */
import * as THREE from "three";
import type { FloorPlanLayout, Pose, Vec2, Workspot } from "@/lib/map/layout";
import { pointInPolygon } from "@/lib/map/layout";
import { buildNavGrid, findPath, isBlocked, toCell, toWorld, type NavGrid } from "@/lib/map/nav";
import type { MapEmployee, MapSnapshot, MapWorkOrder } from "@/lib/map/snapshot";
import { buildCharacter, pose, type Appearance, type Rig } from "../kit/character";
import { buildObject } from "../kit/furniture";
import { screenTexture, type ScreenApp } from "../kit/textures";
import { buildCar, buildCargoBike, buildTruck, buildVan, spinWheels, type VehicleRig } from "../kit/vehicles";
import type { World } from "./world";

/** Pas de temps maximal (50 ms). Surchargeable en test via ?dtmax= (rendu logiciel très lent). */
export const MAX_DT = (() => {
  if (typeof window === "undefined") return 0.05;
  const v = Number(new URLSearchParams(window.location.search).get("dtmax"));
  return v > 0 && v <= 1 ? v : 0.05;
})();
const WALK_SPEED = 1.35;

interface Target {
  key: string;
  at: Vec2;
  rotation: number;
  pose: Pose;
  y: number;
}

export interface Agent {
  id: string;
  emp: MapEmployee;
  rig: Rig;
  pos: Vec2;
  rot: number;
  path: Vec2[] | null;
  seg: number;
  target: Target | null;
  pose: Pose;
  seatY: number;
  onSite: boolean;
  /** Chorégraphie en cours : la réconciliation ne touche pas l'agent. */
  scripted: boolean;
  carrying: boolean;
  onArrive?: () => void;
  despawnOnArrive?: boolean;
  t: number;
}

interface VehicleAgent {
  id: string;
  label: string;
  entityType: string;
  entityId: string;
  rig: VehicleRig;
  pos: Vec2;
  heading: number;
  curve: THREE.CatmullRomCurve3 | null;
  s: number;
  speed: number;
  maxSpeed: number;
  reverse: boolean;
  queue: { points: Vec2[]; reverse: boolean; onArrive?: () => void }[];
  onArrive?: () => void;
  visible: boolean;
  despawnOnArrive?: boolean;
}

interface TrafficCar {
  rig: VehicleRig;
  x: number;
  z: number;
  dir: 1 | -1;
  speed: number;
}

const offsiteStatuses = new Set(["absent", "teletravail", "deplacement", "pas_badge", "parti"]);

export class Sim {
  grid: NavGrid;
  agents = new Map<string, Agent>();
  vehicles = new Map<string, VehicleAgent>();
  traffic: TrafficCar[] = [];
  parcels = new Map<string, THREE.Group>();
  pallets = new Map<string, THREE.Group>();
  time = 0;
  paused = false;
  private homeBySlot = new Map<string, Workspot>();
  private spotsByZone = new Map<string, Workspot[]>();
  private zoneKeyById = new Map<string, string>();
  private snapshot: MapSnapshot | null = null;
  /** Rappels (ex. mise à jour de l'interface) quand un agent bouge. */
  listeners = new Set<() => void>();

  constructor(
    private world: World,
    private layout: FloorPlanLayout,
  ) {
    this.grid = buildNavGrid(layout);
    this.indexSpots();
    this.spawnTraffic();
  }

  /** Après une modification du plan : grille de navigation et emplacements recalculés. */
  relayout(layout: FloorPlanLayout) {
    this.layout = layout;
    this.grid = buildNavGrid(layout);
    this.indexSpots();
    for (const a of this.agents.values()) a.target = null;
    if (this.snapshot) this.reconcile(this.snapshot, { instant: true });
  }

  private indexSpots() {
    this.homeBySlot.clear();
    this.spotsByZone.clear();
    for (const o of this.layout.objects)
      for (const w of o.workspots ?? []) {
        if (w.owner) this.homeBySlot.set(w.owner, w);
        const zone = o.zone ?? this.zoneAt(w.at);
        if (zone) {
          const list = this.spotsByZone.get(zone) ?? [];
          list.push(w);
          this.spotsByZone.set(zone, list);
        }
      }
  }

  zoneAt(p: Vec2): string | undefined {
    return this.layout.zones.find((z) => pointInPolygon(p, z.polygon))?.key;
  }

  // ---------------------------------------------------------------- données → état voulu
  reconcile(s: MapSnapshot, opts: { instant?: boolean } = {}) {
    this.snapshot = s;
    this.zoneKeyById = new Map(s.zones.map((z) => [z.id, z.key]));
    const taken = new Set<Workspot>();
    for (const a of this.agents.values()) if (a.target && a.onSite) for (const w of this.spotsFor(a.target.key)) taken.add(w);

    for (const emp of s.employees) {
      let agent = this.agents.get(emp.id);
      if (!agent) agent = this.createAgent(emp);
      agent.emp = emp;
      if (agent.scripted) continue;
      // La place actuelle de l'agent ne doit pas compter comme « prise » pour lui-même
      if (agent.target) for (const w of this.spotsFor(agent.target.key)) taken.delete(w);
      const desired = this.desiredTarget(emp, taken, agent.target?.key);
      if (!desired) {
        if (agent.onSite) this.leave(agent, opts.instant);
        continue;
      }
      if (agent.target?.key === desired.key && agent.onSite) continue;
      this.assign(agent, desired, opts.instant);
    }
    this.syncParcels(s, opts.instant);
    this.syncPallets(s);
    this.syncVehicles(s);
    this.syncScreens(s);
    this.emit();
  }

  private spotsFor(key: string): Workspot[] {
    const [zone, idx] = key.split("#");
    const list = this.spotsByZone.get(zone);
    return list && idx !== undefined ? [list[Number(idx)]].filter(Boolean) : [];
  }

  private desiredTarget(emp: MapEmployee, taken: Set<Workspot>, currentKey?: string): Target | null {
    if (offsiteStatuses.has(emp.status)) return null;
    const home = this.homeBySlot.get(emp.slot);
    const toTarget = (zone: string, w: Workspot, i: number): Target => ({ key: `${zone}#${i}`, at: w.at, rotation: w.rotation, pose: w.pose, y: w.y ?? 0 });
    const pick = (zone: string, poses: Pose[]) => {
      const list = this.spotsByZone.get(zone) ?? [];
      // ordre stable par collaborateur pour éviter les échanges de places
      const order = list.map((w, i) => ({ w, i })).filter(({ w }) => !w.owner && poses.includes(w.pose));
      // On garde la place actuelle si elle convient toujours
      const current = order.find(({ i }) => `${zone}#${i}` === currentKey);
      if (current && !taken.has(current.w)) {
        taken.add(current.w);
        return toTarget(zone, current.w, current.i);
      }
      const start = hash(emp.id) % Math.max(1, order.length);
      for (let k = 0; k < order.length; k++) {
        const { w, i } = order[(start + k) % order.length];
        if (!taken.has(w)) {
          taken.add(w);
          return toTarget(zone, w, i);
        }
      }
      return null;
    };
    if (emp.status === "pause") {
      const zone = (emp.zoneId && this.zoneKeyById.get(emp.zoneId)) || this.layout.zones.find((z) => z.type === "detente")?.key;
      if (zone) {
        const t = pick(zone, ["coffee", "pingpong", "sit_relax", "talk"]);
        if (t) return t;
      }
    }
    if (emp.status === "reunion") {
      const zone = emp.zoneId ? this.zoneKeyById.get(emp.zoneId) : undefined;
      if (zone) {
        const t = pick(zone, ["sit_meeting", "film", "whisk", "talk", "stand"]);
        if (t) return t;
      }
    }
    if (!home) return null;
    const zone = this.zoneAt(home.at) ?? "?";
    const list = this.spotsByZone.get(zone) ?? [];
    taken.add(home);
    return { key: `${zone}#${list.indexOf(home)}`, at: home.at, rotation: home.rotation, pose: emp.status === "reunion" ? "phone" : home.pose, y: home.y ?? 0 };
  }

  private createAgent(emp: MapEmployee): Agent {
    const ap = emp.appearance as unknown as Appearance;
    const rig = buildCharacter({ skin: ap.skin ?? "#E8BF9A", hair: ap.hair ?? "#3B2A20", hairStyle: (ap.hairStyle as Appearance["hairStyle"]) ?? "court", outfit: (ap.outfit as Appearance["outfit"]) ?? "pull", accessory: ap.accessory as Appearance["accessory"] }, hash(emp.id) % 100);
    rig.root.visible = false;
    rig.root.name = `person:${emp.id}`;
    this.world.root.add(rig.root);
    const agent: Agent = { id: emp.id, emp, rig, pos: [0, 0], rot: 0, path: null, seg: 0, target: null, pose: "stand", seatY: 0, onSite: false, scripted: false, carrying: false, t: 0 };
    this.agents.set(emp.id, agent);
    this.world.register({ id: `person:${emp.id}`, kind: "person", entityType: "employees", entityId: emp.id, label: `${emp.firstName} ${emp.lastName}`, priority: 10, object: rig.root });
    return agent;
  }

  /** Place ou fait marcher l'agent vers sa cible. */
  assign(agent: Agent, target: Target, instant = false) {
    agent.target = target;
    if (instant || !agent.onSite) {
      if (!agent.onSite && !instant) {
        // Arrivée depuis la rue : on apparaît au portail
        agent.pos = [...(this.layout.anchors.gate_cour?.at ?? target.at)] as Vec2;
        agent.onSite = true;
        agent.rig.root.visible = true;
        this.walk(agent, target.at, () => this.settle(agent));
        return;
      }
      agent.pos = [...target.at] as Vec2;
      agent.rot = target.rotation;
      agent.onSite = true;
      agent.rig.root.visible = true;
      this.settle(agent);
      return;
    }
    this.walk(agent, target.at, () => this.settle(agent));
  }

  private settle(agent: Agent) {
    if (!agent.target) return;
    agent.pos = [...agent.target.at] as Vec2;
    agent.rot = agent.target.rotation;
    agent.pose = agent.target.pose;
    agent.seatY = agent.target.y;
    agent.path = null;
  }

  private leave(agent: Agent, instant?: boolean) {
    agent.target = null;
    if (instant) {
      agent.onSite = false;
      agent.rig.root.visible = false;
      return;
    }
    this.walk(agent, this.layout.anchors.gate_cour?.at ?? agent.pos, () => {
      agent.onSite = false;
      agent.rig.root.visible = false;
    });
  }

  /** Fait marcher un agent (chemin A*). Le rappel est appelé à l'arrivée. */
  walk(agent: Agent, to: Vec2, onArrive?: () => void) {
    const path = findPath(this.grid, agent.pos, to);
    agent.path = path ?? [agent.pos, to];
    agent.seg = 1;
    agent.pose = "stand";
    agent.onArrive = onArrive;
  }

  /** Chorégraphie : marche scriptée, résolue à l'arrivée. */
  walkTo(employeeId: string, to: Vec2, opts: { carrying?: boolean; from?: Vec2; finalPose?: Pose; finalRotation?: number } = {}): Promise<void> {
    const a = this.agents.get(employeeId);
    if (!a) return Promise.resolve();
    a.scripted = true;
    a.carrying = Boolean(opts.carrying);
    if (opts.from) a.pos = [...opts.from] as Vec2;
    a.onSite = true;
    a.rig.root.visible = true;
    return new Promise((resolve) =>
      this.walk(a, to, () => {
        a.pos = [...to] as Vec2;
        if (opts.finalPose) a.pose = opts.finalPose;
        if (opts.finalRotation !== undefined) a.rot = opts.finalRotation;
        a.seatY = 0;
        resolve();
      }),
    );
  }

  /** Rend la main à la réconciliation (l'agent rejoint sa cible depuis sa position). */
  release(employeeId: string) {
    const a = this.agents.get(employeeId);
    if (!a) return;
    a.scripted = false;
    a.carrying = false;
    a.target = null;
    if (this.snapshot) this.reconcile(this.snapshot);
  }

  // ---------------------------------------------------------------- colis, palettes, véhicules, écrans
  private slotsNear(at: Vec2, count: number, spacing = 1.1): Vec2[] {
    const out: Vec2[] = [];
    const [c0, r0] = toCell(this.grid, at);
    const step = Math.max(1, Math.round(spacing / this.grid.cell));
    for (let ring = 0; out.length < count && ring < 12; ring++)
      for (let dc = -ring; dc <= ring; dc++)
        for (let dr = -ring; dr <= ring; dr++) {
          if (Math.max(Math.abs(dc), Math.abs(dr)) !== ring || out.length >= count) continue;
          const c = c0 + dc * step;
          const r = r0 + dr * step;
          if (!isBlocked(this.grid, c, r)) out.push(toWorld(this.grid, c, r));
        }
    return out;
  }

  private dropPoint(zoneKey: string): Vec2 | null {
    const z = this.layout.zones.find((zz) => zz.key === zoneKey);
    if (!z) return null;
    if (z.type === "quarantaine" && this.layout.anchors.control_bench) {
      const b = this.layout.anchors.control_bench.at;
      return [b[0] + 1.6, b[1] + 0.4];
    }
    if (z.type === "expedition" && this.layout.anchors.dock_expedition) {
      const d = this.layout.anchors.dock_expedition.at;
      return [d[0] - 3, d[1]];
    }
    const xs = z.polygon.map((p) => p[0]);
    const zs = z.polygon.map((p) => p[1]);
    return [(Math.min(...xs) + Math.max(...xs)) / 2, Math.max(...zs) - 1.5];
  }

  private syncParcels(s: MapSnapshot, instant?: boolean) {
    const byZone = new Map<string, MapWorkOrder[]>();
    for (const w of s.workOrders) {
      const zk = w.zoneId ? this.zoneKeyById.get(w.zoneId) : undefined;
      if (!zk || zk === "open_space") continue;
      const list = byZone.get(zk) ?? [];
      list.push(w);
      byZone.set(zk, list);
    }
    const keep = new Set<string>();
    for (const [zk, list] of byZone) {
      const drop = this.dropPoint(zk);
      if (!drop) continue;
      const slots = this.slotsNear(drop, list.length, 1.3);
      list.forEach((w, i) => {
        keep.add(w.id);
        const to = slots[i] ?? drop;
        let g = this.parcels.get(w.id);
        if (!g) {
          g = buildObject({ id: `parcel_${w.number}`, kit: "parcel_stack", at: to, rotation: 0, params: { count: Math.min(4, 1 + (hash(w.id) % 3)) } }).group;
          g.position.set(to[0], 0.03, to[1]);
          g.scale.setScalar(0.85);
          this.world.root.add(g);
          this.parcels.set(w.id, g);
          this.world.register({ id: `wo:${w.id}`, kind: "parcel", entityType: "work_orders", entityId: w.id, label: `${w.number} · ${w.clientName ?? ""}`, priority: 8, object: g, zoneKey: zk });
          return;
        }
        const from = new THREE.Vector3().copy(g.position);
        const dest = new THREE.Vector3(to[0], 0.03, to[1]);
        if (instant || from.distanceTo(dest) < 0.1) g.position.copy(dest);
        else g.userData.glide = { from, to: dest, t: 0, dur: Math.min(6, 1 + from.distanceTo(dest) / 3) };
      });
    }
    for (const [id, g] of this.parcels)
      if (!keep.has(id)) {
        this.world.root.remove(g);
        this.parcels.delete(id);
        this.world.unregister(`wo:${id}`);
      }
  }

  private syncPallets(s: MapSnapshot) {
    const q = s.lots.filter((l) => l.status === "quarantaine");
    const anchor = this.layout.anchors.quarantine_drop?.at;
    if (!anchor) return;
    const slots = this.slotsNear(anchor, q.length, 1.6);
    const keep = new Set<string>();
    q.forEach((l, i) => {
      keep.add(l.id);
      if (this.pallets.has(l.id)) return;
      const at = slots[i] ?? anchor;
      const g = buildObject({ id: `lot_${l.number}`, kit: "pallet", at, rotation: 0, params: { load: "lot" } }).group;
      g.position.set(at[0], 0.03, at[1]);
      g.scale.setScalar(0.001);
      g.userData.pop = 0;
      this.world.root.add(g);
      this.pallets.set(l.id, g);
      this.world.register({ id: `lot:${l.id}`, kind: "pallet", entityType: "lots", entityId: l.id, label: `Lot ${l.number}`, priority: 8, object: g });
    });
    for (const [id, g] of this.pallets)
      if (!keep.has(id)) {
        this.world.root.remove(g);
        this.pallets.delete(id);
        this.world.unregister(`lot:${id}`);
      }
  }

  private syncVehicles(s: MapSnapshot) {
    const now = Date.now();
    for (const a of s.assets.filter((x) => x.type === "vehicule")) {
      const spot = this.layout.parking[a.key];
      if (!spot) continue;
      let v = this.vehicles.get(a.id);
      const away = s.bookings.some((b) => b.assetId === a.id && Date.parse(b.startsAt) <= now && Date.parse(b.endsAt) > now);
      if (!v) {
        const rig = a.key === "velo_cargo" ? buildCargoBike() : buildVan({ brand: "MATOCHA" });
        v = this.addVehicle({ id: a.id, label: a.name, entityType: "assets", entityId: a.id, rig, at: spot.at, heading: spot.rotation });
      }
      v.visible = !away;
      v.rig.root.visible = !away;
    }
  }

  private syncScreens(s: MapSnapshot) {
    const byEmp = new Map(s.employees.map((e) => [e.id, e]));
    for (const a of s.assets.filter((x) => x.type === "poste_informatique")) {
      const obj = [...this.world.objects.values()].find((o) => o.def.entity?.id === a.id);
      if (!obj?.built.screen) continue;
      const e = a.assignedEmployeeId ? byEmp.get(a.assignedEmployeeId) : undefined;
      const app = !e || offsiteStatuses.has(e.status) ? (e?.status === "teletravail" ? "visio" : "eteint") : e.status === "au_poste" ? ((a.telemetry.app as string) ?? "crm") : "verrouille";
      if (obj.built.screen.userData.app !== app) {
        obj.built.screen.userData.app = app;
        obj.built.screen.material.map = screenTexture(app as ScreenApp, hash(a.id) % 4);
      }
    }
    // Tables de pack : un colis est en cours quand la préparatrice est au poste
    for (const [, o] of this.world.objects) {
      if (o.def.kit !== "pack_table" || !o.built.slots?.parcel) continue;
      const owner = o.def.workspots?.[0]?.owner;
      const e = owner ? s.employees.find((x) => x.slot === owner) : undefined;
      o.built.slots.parcel.visible = e?.status === "au_poste";
    }
  }

  // ---------------------------------------------------------------- véhicules
  addVehicle(o: { id: string; label: string; entityType: string; entityId: string; rig: VehicleRig; at: Vec2; heading: number; maxSpeed?: number }): VehicleAgent {
    const v: VehicleAgent = { id: o.id, label: o.label, entityType: o.entityType, entityId: o.entityId, rig: o.rig, pos: [...o.at] as Vec2, heading: o.heading, curve: null, s: 0, speed: 0, maxSpeed: o.maxSpeed ?? 7, reverse: false, queue: [], visible: true };
    o.rig.root.position.set(o.at[0], 0, o.at[1]);
    o.rig.root.rotation.y = o.heading;
    this.world.root.add(o.rig.root);
    this.vehicles.set(o.id, v);
    this.world.register({ id: `veh:${o.id}`, kind: "vehicle", entityType: o.entityType, entityId: o.entityId, label: o.label, priority: 9, object: o.rig.root });
    return v;
  }

  removeVehicle(id: string) {
    const v = this.vehicles.get(id);
    if (!v) return;
    this.world.root.remove(v.rig.root);
    this.vehicles.delete(id);
    this.world.unregister(`veh:${id}`);
  }

  /** Conduit un véhicule le long d'une courbe Catmull-Rom (accélération, croisière, freinage). */
  drive(id: string, points: Vec2[], opts: { reverse?: boolean } = {}): Promise<void> {
    const v = this.vehicles.get(id);
    if (!v) return Promise.resolve();
    return new Promise((resolve) => {
      v.queue.push({ points, reverse: Boolean(opts.reverse), onArrive: resolve });
      if (!v.curve) this.nextLeg(v);
    });
  }

  private nextLeg(v: VehicleAgent) {
    const leg = v.queue.shift();
    if (!leg) {
      v.curve = null;
      return;
    }
    const pts = [[v.pos[0], v.pos[1]] as Vec2, ...leg.points].map((p) => new THREE.Vector3(p[0], 0, p[1]));
    v.curve = new THREE.CatmullRomCurve3(pts, false, "centripetal");
    v.s = 0;
    v.speed = 0;
    v.reverse = leg.reverse;
    v.onArrive = leg.onArrive;
  }

  /** Arrivée d'un camion (porteur, transporteur) : route d'approche puis marche arrière à quai. */
  async truckToDock(id: string, routeKey: string, label: string, brand: string) {
    const route = this.layout.vehicleRoutes[routeKey];
    if (!route || route.length < 3) return;
    if (!this.vehicles.has(id)) {
      const v = this.addVehicle({ id, label, entityType: "vehicles", entityId: id, rig: buildTruck({ brand }), at: route[0], heading: -Math.PI / 2, maxSpeed: 9 });
      v.rig.root.visible = true;
    }
    await this.drive(id, route.slice(1, -1));
    await this.drive(id, [route[route.length - 1]], { reverse: true });
  }

  async truckLeave(id: string, routeKey: string) {
    const route = this.layout.vehicleRoutes[routeKey];
    if (!route) return;
    const back = [...route].reverse();
    await this.drive(id, back.slice(1));
    this.removeVehicle(id);
  }

  private spawnTraffic() {
    const road = this.layout.roads.find((r) => r.traffic);
    if (!road) return;
    const z = road.points[0][1];
    const [xa, xb] = [Math.min(road.points[0][0], road.points[1][0]), Math.max(road.points[0][0], road.points[1][0])];
    for (let i = 0; i < 6; i++) {
      const dir = i % 2 === 0 ? 1 : -1;
      const rig = buildCar(i);
      const car: TrafficCar = { rig, x: xa + ((xb - xa) * i) / 6, z: z + (dir === 1 ? 2 : -2), dir: dir as 1 | -1, speed: 7 + (i % 3) * 1.5 };
      rig.root.rotation.y = dir === 1 ? Math.PI / 2 : -Math.PI / 2;
      this.world.root.add(rig.root);
      this.traffic.push(car);
    }
    this.trafficBounds = [xa, xb];
  }
  private trafficBounds: [number, number] = [-100, 100];

  // ---------------------------------------------------------------- boucle
  frame(dtRaw: number) {
    if (this.paused) return;
    const dt = Math.min(MAX_DT, Math.max(0, dtRaw));
    this.time += dt;
    const t = this.time;
    let moved = false;

    for (const a of this.agents.values()) {
      if (!a.onSite && !a.path) continue;
      a.t += dt;
      if (a.path) {
        moved = true;
        let remaining = WALK_SPEED * dt;
        while (remaining > 0 && a.path && a.seg < a.path.length) {
          const tgt = a.path[a.seg];
          const dx = tgt[0] - a.pos[0];
          const dz = tgt[1] - a.pos[1];
          const d = Math.hypot(dx, dz);
          if (d <= remaining) {
            a.pos = [tgt[0], tgt[1]];
            remaining -= d;
            a.seg++;
          } else {
            a.pos = [a.pos[0] + (dx / d) * remaining, a.pos[1] + (dz / d) * remaining];
            remaining = 0;
          }
          if (d > 0.001) {
            const want = Math.atan2(dx, dz);
            a.rot = lerpAngle(a.rot, want, Math.min(1, dt * 10));
          }
        }
        if (a.path && a.seg >= a.path.length) {
          a.path = null;
          const cb = a.onArrive;
          a.onArrive = undefined;
          cb?.();
        }
        pose(a.rig, a.path ? "walk" : a.pose, t, { speed: WALK_SPEED, carrying: a.carrying, accessory: a.emp.appearance.accessory as Appearance["accessory"], seatY: a.seatY });
      } else {
        pose(a.rig, a.pose, t, { seatY: a.seatY, accessory: a.emp.appearance.accessory as Appearance["accessory"], carrying: a.carrying });
      }
      a.rig.root.position.set(a.pos[0], 0, a.pos[1]);
      a.rig.root.rotation.y = a.rot;
    }

    for (const v of this.vehicles.values()) {
      if (!v.curve) continue;
      moved = true;
      const L = v.curve.getLength();
      const remaining = L - v.s;
      const brakeDist = (v.speed * v.speed) / (2 * 3.2);
      const accel = remaining <= brakeDist + 0.3 ? -3.2 : v.speed < (v.reverse ? 2.2 : v.maxSpeed) ? 2.4 : 0;
      v.speed = Math.max(remaining < 0.05 ? 0 : 0.6, v.speed + accel * dt);
      const ds = Math.min(remaining, v.speed * dt);
      v.s += ds;
      const u = Math.min(1, v.s / L);
      const p = v.curve.getPointAt(u);
      const tan = v.curve.getTangentAt(u);
      v.pos = [p.x, p.z];
      const head = Math.atan2(tan.x, tan.z) + (v.reverse ? Math.PI : 0);
      v.heading = lerpAngle(v.heading, head, Math.min(1, dt * 6));
      v.rig.root.position.set(p.x, 0, p.z);
      v.rig.root.rotation.y = v.heading;
      spinWheels(v.rig, v.reverse ? -ds : ds);
      if (u >= 1 || remaining <= 0.02) {
        const cb = v.onArrive;
        v.onArrive = undefined;
        v.curve = null;
        v.speed = 0;
        cb?.();
        this.nextLeg(v);
      }
    }

    for (const c of this.traffic) {
      c.x += c.dir * c.speed * dt;
      if (c.x > this.trafficBounds[1]) c.x = this.trafficBounds[0];
      if (c.x < this.trafficBounds[0]) c.x = this.trafficBounds[1];
      c.rig.root.position.set(c.x, 0, c.z);
      spinWheels(c.rig, c.speed * dt);
    }

    for (const g of this.parcels.values()) {
      const gl = g.userData.glide as { from: THREE.Vector3; to: THREE.Vector3; t: number; dur: number } | undefined;
      if (!gl) continue;
      gl.t += dt;
      const k = easeInOut(Math.min(1, gl.t / gl.dur));
      g.position.lerpVectors(gl.from, gl.to, k);
      g.position.y = 0.03 + Math.sin(k * Math.PI) * 0.6;
      if (k >= 1) delete g.userData.glide;
    }
    for (const g of this.pallets.values())
      if (g.userData.pop !== undefined && g.userData.pop < 1) {
        g.userData.pop = Math.min(1, g.userData.pop + dt * 2);
        g.scale.setScalar(easeOutBack(g.userData.pop));
      }

    this.world.update(t, dt);
    if (moved) this.emit();
  }

  private emit() {
    for (const l of this.listeners) l();
  }

  agentByEmployee(id: string) {
    return this.agents.get(id);
  }
}

export function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return Math.abs(h);
}

export function lerpAngle(a: number, b: number, k: number) {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * k;
}

export const easeInOut = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2);
const easeOutBack = (k: number) => 1 + 2.7 * (k - 1) ** 3 + 1.7 * (k - 1) ** 2;
