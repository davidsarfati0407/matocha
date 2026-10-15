/**
 * Générateur de plan initial : transforme les espaces de la fiche secteur en un
 * premier plan cohérent (bâtiment, murs, cloisons, zones, mobilier, emplacements
 * de travail), que l'administrateur affine ensuite dans l'éditeur.
 *
 * - Disposition : chaque aile est découpée en bandes ; la largeur d'un espace
 *   est proportionnelle à sa surface type (fonction de son type et de sa capacité).
 * - Mobilier : une « recette » par type d'espace (open space → îlots de bureaux,
 *   stock → rayonnages, réunion → table + sièges…).
 * - Chaque collaborateur reçoit un emplacement de travail dans l'espace de son poste.
 */
import type { SectorConfig } from "@/config/sector.schema";
import { rect, type EntityRef, type FloorMaterial, type ObjectDef, type Opening, type PartitionDef, type FloorPlanLayout, type Vec2, type WallDef, type Workspot, type ZoneDef } from "./layout";

type Zone = SectorConfig["lieux"][number]["zones"][number];
export type Resolve = (type: EntityRef["type"], key: string) => string;

/** Espaces où chaque collaborateur a un poste informatique attitré. */
export const DESK_ZONES = new Set(["open_space", "direction", "accueil", "studio", "labo"]);

/** Surface type (m²) par type d'espace. */
const AREA: Record<string, (cap: number) => number> = {
  bar: () => 90,
  accueil: () => 60,
  open_space: (c) => Math.max(120, c * 9.5),
  studio: () => 62,
  reunion: (c) => 10 + c * 7,
  direction: () => 50,
  labo: () => 50,
  detente: () => 70,
  technique: () => 24,
  reception: () => 80,
  quarantaine: () => 64,
  stock: () => 260,
  preparation: () => 200,
  expedition: () => 150,
  echantillotheque: () => 16,
  vestiaire: () => 16,
};
const BACK_ROW = new Set(["direction", "reunion", "labo", "technique", "studio"]);
const FRONT_ORDER = ["bar", "accueil", "open_space", "detente"];
const CLOSED = new Set(["direction", "reunion", "labo", "technique", "studio", "echantillotheque", "vestiaire"]);

const snap = (v: number, step = 0.5) => Math.round(v / step) * step;
/** Vecteur local (x, z) tourné de θ autour de y (convention three.js). */
const rot = ([x, z]: Vec2, t: number): Vec2 => [x * Math.cos(t) + z * Math.sin(t), -x * Math.sin(t) + z * Math.cos(t)];
const add = (a: Vec2, b: Vec2): Vec2 => [a[0] + b[0], a[1] + b[1]];

interface Box {
  x0: number;
  z0: number;
  x1: number;
  z1: number;
}
const w = (b: Box) => b.x1 - b.x0;
const d = (b: Box) => b.z1 - b.z0;
const cx = (b: Box) => (b.x0 + b.x1) / 2;
const cz = (b: Box) => (b.z0 + b.z1) / 2;

export function generatePlan(config: SectorConfig, resolve: Resolve, opts: { racks?: string[]; siteIndex?: number } = {}): FloorPlanLayout {
  const site = config.lieux[opts.siteIndex ?? 0];
  const racks = opts.racks ?? ["A", "B", "C", "D"];
  const byType = (t: string) => site.zones.filter((z) => z.type === t);
  const owners = (zoneId: string) =>
    config.postes.filter((p) => p.zone === zoneId).flatMap((p) => Array.from({ length: p.effectif }, (_, i) => `${p.id}:${i}`));
  const pcKey = (owner: string) => `pc_${owner.replace(":", "_")}`;

  let n = 0;
  const oid = (kit: string) => `${kit}_${++n}`;
  const objects: ObjectDef[] = [];
  const put = (o: Omit<ObjectDef, "id"> & { id?: string }) => {
    const obj = { id: o.id ?? oid(o.kit), ...o } as ObjectDef;
    objects.push(obj);
    return obj;
  };
  const asset = (key: string): EntityRef => ({ type: "assets", id: resolve("assets", key), key });

  // ------------------------------------------------------------ découpage des ailes
  const bureaux = site.zones.filter((z) => z.aile === "bureaux");
  const atelier = site.zones.filter((z) => z.aile === "atelier");
  const area = (z: Zone) => (AREA[z.type] ?? (() => 40))(z.capacite);

  const BACK_D = 9;
  const CORRIDOR = 2;
  const FRONT_D = 11;
  const Z_NORTH = -24;
  const back = bureaux.filter((z) => BACK_ROW.has(z.type)).sort((a, b) => order(a) - order(b));
  const front = bureaux.filter((z) => !BACK_ROW.has(z.type)).sort((a, b) => FRONT_ORDER.indexOf(a.type) - FRONT_ORDER.indexOf(b.type));
  function order(z: Zone) {
    return ["direction", "reunion", "labo", "technique", "studio"].indexOf(z.type) * 100 - z.capacite;
  }
  const backW = back.map((z) => area(z) / BACK_D);
  const frontW = front.map((z) => area(z) / FRONT_D);
  const W = snap(Math.max(sum(backW), sum(frontW)));
  const boxes = new Map<string, Box>();
  layRow(back, backW, W, Z_NORTH, Z_NORTH + BACK_D);
  layRow(front, frontW, W, Z_NORTH + BACK_D + CORRIDOR, Z_NORTH + BACK_D + CORRIDOR + FRONT_D);
  function layRow(zs: Zone[], widths: number[], total: number, z0: number, z1: number) {
    const k = total / sum(widths);
    let x = -total;
    zs.forEach((z, i) => {
      const x1 = i === zs.length - 1 ? 0 : snap(x + widths[i] * k);
      boxes.set(z.id, { x0: x, z0, x1, z1 });
      x = x1;
    });
  }
  const Z_FRONT = Z_NORTH + BACK_D + CORRIDOR + FRONT_D; // façade sud des bureaux (-2)
  const corridor: Box = { x0: -W, z0: Z_NORTH + BACK_D, x1: 0, z1: Z_NORTH + BACK_D + CORRIDOR };

  // Atelier : colonne est (réception, quarantaine, petits locaux), halle (stock au nord, préparation au sud), bande d'expédition au sud.
  const AW = 28;
  const COL = 8;
  const EXP_D = 8;
  const eastCol = atelier.filter((z) => ["reception", "quarantaine"].includes(z.type));
  const smallRooms = atelier.filter((z) => ["echantillotheque", "vestiaire"].includes(z.type));
  const hall = atelier.filter((z) => ["stock", "preparation"].includes(z.type)).sort((a, b) => (a.type === "stock" ? -1 : 1) - (b.type === "stock" ? -1 : 1));
  const expedition = atelier.filter((z) => z.type === "expedition");
  const others = atelier.filter((z) => !eastCol.includes(z) && !smallRooms.includes(z) && !hall.includes(z) && !expedition.includes(z));
  const atelierDepth = Z_FRONT - Z_NORTH;
  {
    const smallD = smallRooms.length ? 4 : 0;
    const lengths = eastCol.map((z) => area(z) / COL);
    const k = (atelierDepth - smallD) / sum(lengths);
    let z = Z_NORTH;
    eastCol.forEach((zone, i) => {
      const z1 = snap(z + lengths[i] * k);
      boxes.set(zone.id, { x0: AW - COL, z0: z, x1: AW, z1 });
      z = z1;
    });
    smallRooms.forEach((zone, i) => {
      const sw = COL / smallRooms.length;
      boxes.set(zone.id, { x0: AW - COL + i * sw, z0: Z_FRONT - smallD, x1: AW - COL + (i + 1) * sw, z1: Z_FRONT });
    });
    const hallW = AW - COL;
    const hd = hall.map((zone) => area(zone) / hallW);
    const hk = atelierDepth / sum(hd);
    let hz = Z_NORTH;
    hall.forEach((zone, i) => {
      const z1 = i === hall.length - 1 ? Z_FRONT : snap(hz + hd[i] * hk);
      boxes.set(zone.id, { x0: 0, z0: hz, x1: hallW, z1 });
      hz = z1;
    });
    expedition.concat(others).forEach((zone, i, all) => {
      const sw = AW / all.length;
      boxes.set(zone.id, { x0: i * sw, z0: Z_FRONT, x1: (i + 1) * sw, z1: Z_FRONT + EXP_D });
    });
  }
  const Z_ATELIER_S = Z_FRONT + EXP_D; // 6

  // Extérieur
  const LOT: Box = { x0: -W - 8, z0: Z_NORTH - 10, x1: AW + 26, z1: 14 };
  const exterior = {
    cour: byType("exterieur").find((z) => /cour/i.test(z.id) && !/parking|service/i.test(z.nom + z.id)),
    parking: byType("exterieur").find((z) => /parking|service/i.test(z.nom + z.id)),
    rue: byType("exterieur").find((z) => /rue/i.test(z.id + z.nom)),
  };
  const courBox: Box = { x0: -W + 2, z0: Z_FRONT, x1: 0, z1: LOT.z1 - 1 };
  const parkBox: Box = { x0: AW, z0: Z_NORTH, x1: LOT.x1 - 2, z1: LOT.z1 - 1 };
  const ROAD_Z = 20;
  if (exterior.cour) boxes.set(exterior.cour.id, courBox);
  if (exterior.parking) boxes.set(exterior.parking.id, parkBox);
  if (exterior.rue) boxes.set(exterior.rue.id, { x0: -90, z0: ROAD_Z - 4, x1: 110, z1: ROAD_Z + 4 });

  // ------------------------------------------------------------ zones
  const CHAMFER = 4;
  const bar = front.find((z) => z.type === "bar");
  const zones: ZoneDef[] = site.zones
    .filter((z) => boxes.has(z.id))
    .map((z) => {
      const b = boxes.get(z.id)!;
      let polygon = rect(b.x0, b.z0, b.x1, b.z1);
      if (bar && z.id === bar.id && b.x0 === -W) {
        // Angle coupé côté rue : la vitrine du bar
        polygon = [[b.x0, b.z0], [b.x1, b.z0], [b.x1, b.z1], [b.x0 + CHAMFER, b.z1], [b.x0, b.z1 - CHAMFER]];
      }
      const isExt = z.aile === "exterieur";
      return {
        key: z.id,
        code: z.code,
        name: z.nom,
        type: z.type,
        polygon,
        floor: z.sol as FloorMaterial,
        label: z.id === exterior.rue?.id ? undefined : { text: isExt ? z.nom.toUpperCase() : z.nom.toUpperCase(), at: [cx(b), b.z1 - (isExt ? 2 : 1.1)], size: w(b) > 10 ? 0.7 : 0.45 },
      };
    });

  // ------------------------------------------------------------ enveloppe, murs, cloisons
  const outline: Vec2[] = [
    [-W, Z_NORTH],
    [AW, Z_NORTH],
    [AW, Z_ATELIER_S],
    [0, Z_ATELIER_S],
    [0, Z_FRONT],
    [-W + CHAMFER, Z_FRONT],
    [-W, Z_FRONT - CHAMFER],
  ];
  const accBox = boxes.get(front.find((z) => z.type === "accueil")?.id ?? "")!;
  const recBox = eastCol[0] ? boxes.get(eastCol[0].id)! : null;
  const expBox = expedition[0] ? boxes.get(expedition[0].id)! : null;
  const walls: WallDef[] = [];
  for (let i = 0; i < outline.length; i++) {
    const a = outline[i];
    const b = outline[(i + 1) % outline.length];
    const mid: Vec2 = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    // Normale extérieure : on teste de quel côté se trouve l'intérieur
    const nx = -(b[1] - a[1]);
    const nz = b[0] - a[0];
    const len = Math.hypot(nx, nz);
    const probe: Vec2 = [mid[0] + (nx / len) * 0.3, mid[1] + (nz / len) * 0.3];
    const outward = inside(probe, outline) ? [-nx / len, -nz / len] : [nx / len, nz / len];
    const facesCamera = outward[0] > 0.3 || outward[1] > 0.3; // façades sud et est : murs bas (vue en coupe)
    const openings: Opening[] = [];
    const segLen = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const along = (p: Vec2) => Math.hypot(p[0] - a[0], p[1] - a[1]);
    const onSeg = (p: Vec2) => Math.abs(Math.hypot(p[0] - a[0], p[1] - a[1]) + Math.hypot(p[0] - b[0], p[1] - b[1]) - segLen) < 0.01;
    const tryOpen = (p: Vec2, width: number, kind: Opening["kind"]) => onSeg(p) && openings.push({ at: along(p) - width / 2, width, kind });
    tryOpen([cx(accBox), Z_FRONT], 2.4, "door");
    if (bar) tryOpen([-W + CHAMFER / 2, Z_FRONT - CHAMFER / 2], 1.8, "door");
    if (recBox) tryOpen([AW, cz(recBox)], 4, "dock");
    if (expBox) tryOpen([AW, cz(expBox)], 4, "dock");
    tryOpen([0, Z_FRONT + 3], 1.6, "door");
    // Fenêtres sur les longs murs hauts
    if (!facesCamera && segLen > 12) for (let t = 4; t < segLen - 4; t += 6) if (!openings.some((o) => Math.abs(o.at + o.width / 2 - t) < 2.5)) openings.push({ at: t - 1.2, width: 2.4, kind: "window" });
    walls.push({ id: `wall_${i}`, a, b, height: facesCamera ? "low" : "high", material: a[0] >= 0 && b[0] >= 0 ? "bardage" : "enduit", openings: openings.sort((p, q) => p.at - q.at) });
  }
  // Mur intérieur bureaux / atelier (plein, avec porte sur le couloir)
  walls.push({ id: "wall_inner", a: [0, Z_NORTH], b: [0, Z_FRONT], height: "low", material: "enduit", openings: [{ at: cz(corridor) - Z_NORTH - 1, width: 2, kind: "door" }, { at: Z_FRONT - Z_NORTH - 5, width: 2, kind: "door" }] });

  const partitions: PartitionDef[] = [];
  for (const z of site.zones) {
    if (!CLOSED.has(z.type) || !boxes.has(z.id)) continue;
    const b = boxes.get(z.id)!;
    const sides: [Vec2, Vec2][] = [
      [[b.x0, b.z0], [b.x1, b.z0]],
      [[b.x1, b.z0], [b.x1, b.z1]],
      [[b.x0, b.z1], [b.x1, b.z1]],
      [[b.x0, b.z0], [b.x0, b.z1]],
    ];
    sides.forEach(([a, c], i) => {
      if (onOutline(a, c) || (a[0] === 0 && c[0] === 0)) return; // déjà un mur
      if (partitions.some((p) => samePoints(p.a, a) && samePoints(p.b, c))) return;
      const len = Math.hypot(c[0] - a[0], c[1] - a[1]);
      // Porte côté circulation : au sud pour les pièces du fond, à l'ouest pour la colonne de l'atelier
      const isDoorSide = (z.aile === "bureaux" && i === 2) || (z.aile === "atelier" && i === 3);
      partitions.push({ id: `glass_${z.id}_${i}`, a, b: c, openings: isDoorSide ? [{ at: len / 2 - 0.7, width: 1.4, kind: "door" }] : [] });
    });
  }
  function onOutline(a: Vec2, b: Vec2) {
    for (let i = 0; i < outline.length; i++) {
      const p = outline[i];
      const q = outline[(i + 1) % outline.length];
      const col = (r: Vec2) => Math.abs((q[0] - p[0]) * (r[1] - p[1]) - (q[1] - p[1]) * (r[0] - p[0])) < 0.01;
      if (col(a) && col(b)) return true;
    }
    return false;
  }

  // ------------------------------------------------------------ recettes de mobilier
  const assigned = new Set<string>();
  const ws = (at: Vec2, rotation: number, pose: Workspot["pose"], owner?: string, y?: number): Workspot => {
    if (owner) assigned.add(owner);
    return { at, rotation, pose, owner, y };
  };

  /** Bureau + chaise ; la personne est assise face au bureau. */
  const desk = (at: Vec2, rotation: number, zone: string, owner?: string, params: Record<string, unknown> = {}) => {
    const seat = add(at, rot([0, 0.78], rotation));
    put({ kit: "chair", at: seat, rotation: rotation + Math.PI, zone });
    return put({
      kit: "desk",
      at,
      rotation,
      zone,
      entity: owner && DESK_ZONES.has(zone) ? asset(pcKey(owner)) : undefined,
      params: { screen: true, ...params },
      footprint: [1.6, 0.8],
      workspots: [ws(seat, rotation + Math.PI, "sit_type", owner, 0.45)],
    });
  };

  for (const z of site.zones) {
    const b = boxes.get(z.id);
    if (!b) continue;
    const own = owners(z.id);
    const zid = z.id;
    switch (z.type) {
      case "open_space": {
        // Îlots de 4 bureaux (2 × 2 face à face), assez d'îlots pour tous + 2 postes libres
        const needed = own.length + 2;
        const cols = Math.max(1, Math.floor((w(b) - 1) / 4.2));
        const rows = Math.ceil(needed / 4 / cols);
        let k = 0;
        for (let r = 0; r < rows; r++)
          for (let c = 0; c < cols; c++) {
            const center: Vec2 = [b.x0 + 2.4 + c * ((w(b) - 4.8) / Math.max(1, cols - 1)), b.z0 + 2.6 + r * ((d(b) - 5.6) / Math.max(1, rows - 1))];
            for (const [dx, dz, rr] of [[-0.8, -0.4, Math.PI], [0.8, -0.4, Math.PI], [-0.8, 0.4, 0], [0.8, 0.4, 0]] as const) desk(add(center, [dx, dz]), rr, zid, own[k++]);
            put({ kit: "plant", at: add(center, [2, 0]), rotation: 0, zone: zid, params: { size: 0.7 } });
          }
        put({ kit: "wall_screen", at: [cx(b), b.z0 + 0.1], y: 1.6, rotation: 0, zone: zid, params: { content: "ventes", w: 2.6, h: 1.4 }, label: "Ventes en direct" });
        break;
      }
      case "direction": {
        own.forEach((o, i) => desk([b.x0 + 2 + i * 3, b.z0 + 2.5], 0, zid, o));
        put({ kit: "rug", at: [cx(b), cz(b) + 1.5], rotation: 0, zone: zid, params: { w: 3, d: 2 } });
        put({ kit: "art_ceramic", at: [b.x1 - 1, b.z1 - 1.2], rotation: 0, zone: zid, label: "Céramique de Tokoname", params: { title: "Bol de Tokoname (fictif)", author: "Atelier Kenzan (fictif)", value: 4200 } });
        put({ kit: "plant", at: [b.x0 + 0.8, b.z1 - 0.8], rotation: 0, zone: zid, params: { size: 1 } });
        break;
      }
      case "accueil": {
        const rd: Vec2 = [cx(b), b.z0 + 3.2];
        put({ kit: "reception_desk", at: rd, rotation: 0, zone: zid, footprint: [3, 1], entity: own[0] ? asset(pcKey(own[0])) : undefined, workspots: own.map((o, i) => ws(add(rd, [-0.6 + i * 1.2, -0.9]), 0, "sit_type", o, 0.45)) });
        put({ kit: "logo_wall", at: [cx(b), b.z0 + 0.15], y: 0, rotation: 0, zone: zid });
        put({ kit: "badge_reader", at: [cx(accBox) + 1.6, Z_FRONT - 0.6], rotation: Math.PI, zone: zid, entity: asset("badgeuse"), label: "Badgeuse" });
        put({ kit: "sofa", at: [b.x0 + 1.2, b.z1 - 3], rotation: Math.PI / 2, zone: zid, footprint: [2, 0.9], workspots: [ws([b.x0 + 1.5, b.z1 - 3.5], Math.PI / 2, "sit_relax", undefined, 0.42), ws([b.x0 + 1.5, b.z1 - 2.5], Math.PI / 2, "sit_relax", undefined, 0.42)] });
        put({ kit: "plant", at: [b.x1 - 0.8, b.z1 - 0.8], rotation: 0, zone: zid, params: { size: 1.1 } });
        break;
      }
      case "bar": {
        const counter: Vec2 = [cx(b) + 0.5, b.z0 + 2.2];
        put({ kit: "bar_counter", at: counter, rotation: 0, zone: zid, footprint: [5, 1], params: { length: 5 } });
        put({ kit: "matcha_machine", at: add(counter, [-1.2, -0.1]), y: 1.05, rotation: 0, zone: zid, entity: asset("machine_matcha"), label: "Machine à matcha" });
        put({ kit: "shelf_boxes", at: [cx(b), b.z0 + 0.35], rotation: 0, zone: zid, params: { length: 4 }, footprint: [4, 0.4] });
        put({ kit: "bar_counter", id: "bar_back", at: [cx(b), b.z0 + 0.9], rotation: 0, zone: zid, params: { length: 4, low: true }, footprint: [4, 0.5] });
        put({
          kit: "rug",
          at: counter,
          rotation: 0,
          zone: zid,
          params: { invisible: true },
          workspots: own.map((o, i) => ws(add(counter, [-1.4 + i * 2.2, -0.9]), Math.PI, "whisk", o)),
        });
        for (let i = 0; i < 4; i++) put({ kit: "stool", at: add(counter, [-1.8 + i * 1.2, 0.85]), rotation: Math.PI, zone: zid, workspots: [ws(add(counter, [-1.8 + i * 1.2, 0.9]), Math.PI, "sit_meeting", undefined, 0.75)] });
        for (let i = 0; i < 3; i++) {
          const t: Vec2 = [b.x0 + 2.4 + i * 2.6, b.z1 - 3.6 + (i % 2) * 0.8];
          if (i === 0 && t[0] < b.x0 + 2.6) t[0] += 0.6;
          put({ kit: "cafe_table", at: t, rotation: 0, zone: zid, footprint: [0.8, 0.8], workspots: [ws(add(t, [-0.65, 0]), Math.PI / 2, "sit_meeting", undefined, 0.45), ws(add(t, [0.65, 0]), -Math.PI / 2, "sit_meeting", undefined, 0.45)] });
          put({ kit: "chair", at: add(t, [-0.65, 0]), rotation: Math.PI / 2, zone: zid });
          put({ kit: "chair", at: add(t, [0.65, 0]), rotation: -Math.PI / 2, zone: zid });
        }
        put({ kit: "plant", at: [b.x1 - 0.8, b.z1 - 0.8], rotation: 0, zone: zid, params: { size: 1.2 } });
        break;
      }
      case "reunion": {
        const tatami = z.sol === "tatami";
        const seats = Math.max(4, z.capacite);
        const len = Math.max(1.6, (seats / 2) * 0.75);
        const c: Vec2 = [cx(b), cz(b) + 0.4];
        const spots: Workspot[] = [];
        for (let i = 0; i < seats; i++) {
          const side = i % 2 === 0 ? -1 : 1;
          const along = -len / 2 + 0.4 + Math.floor(i / 2) * ((len - 0.8) / Math.max(1, seats / 2 - 1));
          const at = add(c, [along, side * (tatami ? 0.75 : 0.85)]);
          const r = side < 0 ? 0 : Math.PI;
          spots.push(ws(at, r, "sit_meeting", undefined, tatami ? 0.12 : 0.45));
          put({ kit: tatami ? "cushion" : "chair", at, rotation: r, zone: zid });
        }
        put({ kit: tatami ? "low_table" : "meeting_table", at: c, rotation: 0, zone: zid, footprint: [len + 0.2, 1.1], params: { length: len }, entity: asset(zid), workspots: spots, label: z.nom });
        put({ kit: "wall_screen", at: [c[0], b.z0 + 0.12], y: 1.5, rotation: 0, zone: zid, params: { content: "visio", w: 2, h: 1.15 } });
        put({ kit: "plant", at: [b.x1 - 0.7, b.z0 + 0.7], rotation: 0, zone: zid, params: { size: 0.9 } });
        break;
      }
      case "studio": {
        put({ kit: "backdrop", at: [b.x0 + 2.6, b.z0 + 0.6], rotation: 0, zone: zid, params: { w: 4.2 }, footprint: [4.2, 1.2] });
        const set: Vec2 = [b.x0 + 2.6, b.z0 + 3.4];
        put({ kit: "softbox", at: add(set, [-1.8, -0.8]), rotation: Math.PI * 0.8, zone: zid });
        put({ kit: "softbox", at: add(set, [1.8, -0.8]), rotation: -Math.PI * 0.8, zone: zid });
        put({ kit: "workbench", at: [b.x0 + 2.6, b.z0 + 1.9], rotation: 0, zone: zid, params: { props: "matcha" }, footprint: [1.6, 0.7] });
        put({
          kit: "camera_tripod",
          at: set,
          rotation: Math.PI,
          zone: zid,
          entity: asset("set_tournage"),
          label: "Set de tournage",
          workspots: [ws(add(set, [0, 0.55]), Math.PI, "film"), ws([b.x0 + 2.6, b.z0 + 2.6], 0, "whisk")],
        });
        own.forEach((o, i) => desk([b.x1 - 1.4, b.z0 + 2 + i * 2.2], -Math.PI / 2, zid, o, { app: o.startsWith("monteur") ? "design" : undefined }));
        break;
      }
      case "labo": {
        const bench: Vec2 = [cx(b), b.z0 + 1.2];
        put({ kit: "workbench", at: bench, rotation: 0, zone: zid, footprint: [3, 0.8], params: { props: "labo" } });
        put({ kit: "scale", at: add(bench, [0.8, 0]), y: 0.92, rotation: 0, zone: zid, entity: asset("balance_labo"), label: "Balance de précision" });
        own.forEach((o, i) => {
          if (i === own.length - 1 && own.length > 1) {
            put({ kit: "rug", at: add(bench, [0, 0]), rotation: 0, zone: zid, params: { invisible: true }, workspots: [ws(add(bench, [-0.6, 0.75]), Math.PI, "whisk", o)] });
          } else desk([b.x0 + 1.4 + i * 2, b.z1 - 2], Math.PI, zid, o);
        });
        break;
      }
      case "technique": {
        put({ kit: "server_rack", at: [cx(b), b.z0 + 0.6], rotation: 0, zone: zid, entity: asset("baie_serveur"), label: "Baie serveur", footprint: [0.7, 1] });
        put({ kit: "printer", at: [cx(b), b.z1 - 1.2], rotation: Math.PI, zone: zid, entity: asset("imprimante_mfp"), label: "Imprimante", footprint: [0.8, 0.7], workspots: [ws([cx(b), b.z1 - 0.4], Math.PI, "stand")] });
        break;
      }
      case "detente": {
        const pp: Vec2 = [cx(b), b.z0 + 3.2];
        put({ kit: "ping_pong", at: pp, rotation: Math.PI / 2, zone: zid, footprint: [1.6, 2.8], label: "Ping-pong", workspots: [ws(add(pp, [0, -1.9]), 0, "pingpong"), ws(add(pp, [0, 1.9]), Math.PI, "pingpong")] });
        put({ kit: "kitchen", at: [b.x1 - 0.45, b.z1 - 3], rotation: -Math.PI / 2, zone: zid, footprint: [3, 0.7], workspots: [ws([b.x1 - 1.3, b.z1 - 3.6], -Math.PI / 2, "coffee"), ws([b.x1 - 1.3, b.z1 - 2.4], -Math.PI / 2, "coffee")] });
        put({ kit: "fridge", at: [b.x1 - 0.45, b.z1 - 0.9], rotation: -Math.PI / 2, zone: zid, footprint: [0.7, 0.7] });
        put({ kit: "sofa", at: [b.x0 + 0.7, b.z1 - 2.6], rotation: Math.PI / 2, zone: zid, footprint: [2.2, 0.9], workspots: [ws([b.x0 + 1, b.z1 - 3.1], Math.PI / 2, "sit_relax", undefined, 0.42), ws([b.x0 + 1, b.z1 - 2.1], Math.PI / 2, "sit_relax", undefined, 0.42)] });
        put({ kit: "cafe_table", at: [cx(b), b.z1 - 1.6], rotation: 0, zone: zid, footprint: [0.8, 0.8], workspots: [ws([cx(b) - 0.7, b.z1 - 1.6], Math.PI / 2, "coffee"), ws([cx(b) + 0.7, b.z1 - 1.6], -Math.PI / 2, "talk")] });
        put({ kit: "plant", at: [b.x0 + 0.7, b.z0 + 0.7], rotation: 0, zone: zid, params: { size: 1.3 } });
        break;
      }
      case "reception": {
        put({ kit: "dock_door", at: [b.x1 - 0.1, cz(b)], rotation: -Math.PI / 2, zone: zid, params: { w: 4 } });
        put({ kit: "pallet_jack", at: [b.x1 - 3, cz(b) + 2.5], rotation: Math.PI / 2, zone: zid, entity: asset("transpalette"), label: "Transpalette" });
        for (let i = 0; i < 2; i++) put({ kit: "pallet", at: [b.x0 + 1.5 + i * 1.6, b.z0 + 1.3], rotation: 0, zone: zid, params: { load: "boxes" }, footprint: [1.2, 0.8] });
        own.forEach((o, i) => put({ kit: "rug", at: [b.x1 - 2, cz(b) - 1.5 + i], rotation: 0, zone: zid, params: { invisible: true }, workspots: [ws([b.x1 - 2.2, cz(b) - 1.5 + i], -Math.PI / 2, "carry", o)] }));
        put({ kit: "extinguisher", at: [b.x0 + 0.3, b.z1 - 0.4], rotation: 0, zone: zid });
        break;
      }
      case "quarantaine": {
        const bench: Vec2 = [b.x0 + 2.4, b.z0 + 1];
        put({ kit: "workbench", at: bench, rotation: 0, zone: zid, footprint: [2.4, 0.8], params: { props: "qc" } });
        put({ kit: "scale", at: add(bench, [0.5, 0]), y: 0.92, rotation: 0, zone: zid, entity: asset("balance_controle"), label: "Balance de contrôle" });
        own.forEach((o, i) => put({ kit: "rug", at: add(bench, [i, 0.75]), rotation: 0, zone: zid, params: { invisible: true }, workspots: [ws(add(bench, [-0.3 + i, 0.8]), Math.PI, "inspect", o)] }));
        put({ kit: "rug", at: [cx(b) + 1, cz(b) + 1.2], rotation: 0, zone: zid, params: { tape: true, w: 4.5, d: 3 } });
        break;
      }
      case "stock": {
        const rows = racks.length;
        const step = (d(b) - 2) / rows;
        racks.forEach((letter, i) => {
          const z0 = b.z0 + 1.3 + i * step;
          put({ kit: "rack", at: [cx(b) - 1, z0], rotation: 0, zone: zid, params: { length: w(b) - 5, letter, levels: 4 }, footprint: [w(b) - 5, 1], entity: { type: "stock_rack", id: `rack:${letter}`, key: letter }, label: `Rayonnage ${letter}` });
        });
        own.forEach((o, i) => put({ kit: "rug", at: [b.x1 - 1.5, b.z0 + 2 + i], rotation: 0, zone: zid, params: { invisible: true }, workspots: [ws([b.x1 - 1.5, b.z0 + 2 + i], 0, "carry", o)] }));
        break;
      }
      case "preparation": {
        const prep = own.filter((o) => o.startsWith("preparateur"));
        const lead = own.filter((o) => !o.startsWith("preparateur"));
        const tables = Math.max(4, prep.length);
        for (let i = 0; i < tables; i++) {
          const t: Vec2 = [b.x0 + 2.5 + i * ((w(b) - 6) / Math.max(1, tables - 1)), cz(b) - 0.6];
          put({
            kit: "pack_table",
            at: t,
            rotation: 0,
            zone: zid,
            footprint: [2, 0.9],
            entity: asset(`table_pack_${i + 1}`),
            label: `Table de pack ${i + 1}`,
            params: { index: i + 1 },
            workspots: [ws(add(t, [0, 0.85]), Math.PI, "pack", prep[i])],
          });
          put({ kit: "parcel_stack", at: add(t, [0, -1.1]), rotation: 0, zone: zid, params: { count: 5 + i } });
        }
        put({ kit: "sealer", at: [b.x1 - 1.5, b.z0 + 1.2], rotation: 0, zone: zid, entity: asset("thermoscelleuse"), label: "Thermoscelleuse", footprint: [1, 0.7] });
        lead.forEach((o, i) => put({ kit: "rug", at: [cx(b), b.z1 - 1.6 - i], rotation: 0, zone: zid, params: { invisible: true }, workspots: [ws([cx(b) + i, b.z1 - 1.6], Math.PI, "inspect", o)] }));
        break;
      }
      case "expedition": {
        put({ kit: "dock_door", at: [AW - 0.1, cz(b)], rotation: -Math.PI / 2, zone: zid, params: { w: 4 } });
        put({ kit: "label_printer", at: [b.x0 + 3, b.z0 + 1.2], rotation: 0, zone: zid, entity: asset("imprimante_etiquettes"), label: "Imprimante d'étiquettes", footprint: [1.2, 0.7] });
        for (let i = 0; i < 3; i++) put({ kit: "parcel_stack", at: [b.x0 + 7 + i * 3, b.z0 + 1.6], rotation: 0, zone: zid, params: { count: 10 + i * 3, carrier: i } });
        put({ kit: "pallet", at: [b.x1 - 4, cz(b)], rotation: 0, zone: zid, params: { load: "wrapped" }, footprint: [1.2, 0.8] });
        put({ kit: "cone", at: [b.x1 - 1.2, b.z1 - 1], rotation: 0, zone: zid });
        break;
      }
      case "echantillotheque":
        put({ kit: "sample_cabinet", at: [cx(b), b.z0 + 0.5], rotation: 0, zone: zid, entity: asset("armoire_echantillons"), label: "Échantillothèque", footprint: [1.4, 0.7] });
        break;
      case "vestiaire":
        put({ kit: "lockers", at: [cx(b), b.z0 + 0.35], rotation: 0, zone: zid, params: { count: 6 }, footprint: [3, 0.5] });
        break;
    }
  }

  // Pièces sans recette ou collaborateurs sans emplacement : bureau libre dans l'espace de leur poste
  for (const p of config.postes)
    for (let i = 0; i < p.effectif; i++) {
      const o = `${p.id}:${i}`;
      if (assigned.has(o)) continue;
      const b = boxes.get(p.zone);
      if (!b) continue;
      desk([b.x0 + 1.5 + (i % 3) * 2, b.z1 - 1.5], Math.PI, p.zone, o);
    }

  // ------------------------------------------------------------ extérieur
  const cour = exterior.cour?.id;
  if (cour) {
    for (let i = 0; i < 9; i++) put({ kit: "bamboo", at: [courBox.x0 + 1 + (i % 3) * 0.9 + (i > 5 ? 22 : i > 2 ? 11 : 0), courBox.z0 + 3.5 + (i % 2) * 1.2], rotation: i, zone: cour, params: { h: 4 + (i % 3) } });
    put({ kit: "bench", at: [courBox.x0 + 6, courBox.z0 + 6], rotation: 0, zone: cour, workspots: [ws([courBox.x0 + 5.6, courBox.z0 + 6.4], Math.PI, "sit_relax", undefined, 0.45), ws([courBox.x0 + 6.4, courBox.z0 + 6.4], Math.PI, "talk", undefined, 0.45)] });
    put({ kit: "cafe_table", at: [courBox.x0 + 16, courBox.z0 + 6], rotation: 0, zone: cour, params: { outdoor: true }, footprint: [0.8, 0.8], workspots: [ws([courBox.x0 + 15.3, courBox.z0 + 6], Math.PI / 2, "coffee"), ws([courBox.x0 + 16.7, courBox.z0 + 6], -Math.PI / 2, "talk")] });
    put({ kit: "bike_rack", at: [courBox.x0 + 25, courBox.z1 - 2], rotation: 0, zone: cour, footprint: [2.5, 0.6] });
    put({ kit: "totem", at: [cx(accBox) + 4, LOT.z1 - 1.5], rotation: 0, zone: cour, label: config.entreprise.nomCourt });
  }
  const park = exterior.parking?.id;
  if (park) {
    put({ kit: "parking_spot", at: [parkBox.x0 + 6, parkBox.z0 + 6], rotation: 0, zone: park, params: { w: 2.6, d: 5.2 } });
    put({ kit: "charging_station", at: [parkBox.x0 + 6, parkBox.z0 + 2.8], rotation: 0, zone: park });
    put({ kit: "parking_spot", at: [parkBox.x0 + 9.5, parkBox.z0 + 5], rotation: 0, zone: park, params: { w: 1.4, d: 2.6 } });
    put({ kit: "parking_spot", at: [parkBox.x0 + 7, cz(expBox ?? parkBox)], rotation: Math.PI / 2, zone: park, params: { w: 3.2, d: 9, truck: true } });
    put({ kit: "parking_spot", at: [parkBox.x0 + 7, cz(recBox ?? parkBox)], rotation: Math.PI / 2, zone: park, params: { w: 3.2, d: 9, truck: true } });
    for (let i = 0; i < 3; i++) put({ kit: "pallet", at: [parkBox.x1 - 2.5, parkBox.z0 + 2 + i * 1.4], rotation: 0, zone: park, params: { load: i === 1 ? "empty" : "boxes" }, footprint: [1.2, 0.8] });
  }
  // Arbres : alignement sur le trottoir + bosquets
  for (let x = LOT.x0 - 10; x < LOT.x1 + 20; x += 9) put({ kit: "tree", at: [x + 2, 15], rotation: x, params: { size: 1 + ((x * 7) % 5) / 10 } });
  for (const [x, z, s] of [[-58, -30, 1.3], [-54, -12, 1.1], [-60, 4, 1.4], [70, -30, 1.2], [74, -8, 1.4], [66, 6, 1], [-20, -40, 1.2], [10, -42, 1.1], [40, -40, 1.3]] as const)
    put({ kit: "tree", at: [x, z], rotation: x, params: { size: s } });
  for (let x = LOT.x0 - 6; x < LOT.x1 + 10; x += 18) put({ kit: "lamp_post", at: [x, 14.6], rotation: 0 });

  // Navigation : emprise au sol par défaut selon le kit
  for (const o of objects) if (!o.footprint) o.footprint = DEFAULT_FOOTPRINT[o.kit] ?? [0, 0];

  // ------------------------------------------------------------ points nommés, véhicules
  const gateCour: Vec2 = [cx(accBox), LOT.z1];
  const gateService: Vec2 = [parkBox.x0 + 12, LOT.z1];
  const recDock: Vec2 = recBox ? [AW + 0.8, cz(recBox)] : [AW + 1, -10];
  const expDock: Vec2 = expBox ? [AW + 0.8, cz(expBox)] : [AW + 1, 2];
  const qcZone = eastCol.find((z) => z.type === "quarantaine");
  const qcBox = qcZone ? boxes.get(qcZone.id) : undefined;
  const anchors: FloorPlanLayout["anchors"] = {
    street_west: { at: [-70, 16.5] },
    street_east: { at: [80, 16.5] },
    gate_cour: { at: gateCour },
    gate_service: { at: gateService },
    entrance: { at: [cx(accBox), Z_FRONT + 0.8], rotation: Math.PI },
    badge: { at: [cx(accBox) + 1.6, Z_FRONT - 1.2], rotation: Math.PI },
    reception_desk: { at: [cx(accBox), accBox.z0 + 4.4], rotation: Math.PI },
    bar_queue: { at: bar ? [cx(boxes.get(bar.id)!) + 0.5, boxes.get(bar.id)!.z0 + 3.3] : [cx(accBox), Z_FRONT - 2], rotation: Math.PI },
    dock_reception: { at: [recDock[0] - 2.2, recDock[1]], rotation: Math.PI / 2 },
    dock_expedition: { at: [expDock[0] - 2.2, expDock[1]], rotation: Math.PI / 2 },
    quarantine_drop: { at: qcBox ? [cx(qcBox) + 1, cz(qcBox) + 1.2] : recDock },
    control_bench: { at: qcBox ? [qcBox.x0 + 2.4, qcBox.z0 + 1.8] : recDock, rotation: Math.PI },
  };
  const parking: FloorPlanLayout["parking"] = {
    utilitaire: { at: [parkBox.x0 + 6, parkBox.z0 + 6], rotation: Math.PI },
    velo_cargo: { at: [parkBox.x0 + 9.5, parkBox.z0 + 5], rotation: Math.PI },
    truck_reception: { at: [recDock[0] + 5, recDock[1]], rotation: -Math.PI / 2 },
    truck_expedition: { at: [expDock[0] + 5, expDock[1]], rotation: -Math.PI / 2 },
  };
  const yard: Vec2 = [parkBox.x0 + 13, 8];
  const vehicleRoutes: FloorPlanLayout["vehicleRoutes"] = {
    truck_reception: [[110, 18], [70, 18], [gateService[0] + 4, 18], [gateService[0], LOT.z1 - 1], [yard[0], recDock[1] + 6], [recDock[0] + 12, recDock[1] + 1], [recDock[0] + 5, recDock[1]]],
    truck_expedition: [[110, 18], [70, 18], [gateService[0] + 4, 18], [gateService[0], LOT.z1 - 1], [yard[0], expDock[1] + 5], [expDock[0] + 12, expDock[1] + 0.5], [expDock[0] + 5, expDock[1]]],
    utilitaire: [[110, 18], [70, 18], [gateService[0] + 3, 18], [gateService[0], LOT.z1 - 2], [parkBox.x0 + 7, parkBox.z0 + 12], [parkBox.x0 + 6, parkBox.z0 + 6]],
  };

  return {
    version: 1,
    units: "m",
    bounds: { min: [-75, -48], max: [85, 34] },
    buildings: [{ id: site.id, name: site.nom, outline, wallHeight: 4.2 }],
    walls,
    partitions,
    zones,
    objects,
    roads: [
      { id: "rue", points: [[-110, ROAD_Z], [120, ROAD_Z]], width: 8, traffic: true },
      { id: "acces_service", points: [[gateService[0], ROAD_Z - 4], [gateService[0], LOT.z1 - 3]], width: 6 },
    ],
    fences: [
      {
        id: "cloture",
        points: [[LOT.x0, LOT.z1], [LOT.x0, LOT.z0], [LOT.x1, LOT.z0], [LOT.x1, LOT.z1], [LOT.x0, LOT.z1]],
        gates: [
          { at: perimeterOffset([LOT.x0, LOT.z1], [LOT.x0, LOT.z0], [LOT.x1, LOT.z0], [LOT.x1, LOT.z1], gateService) - 4, width: 8, kind: "gate" },
          { at: perimeterOffset([LOT.x0, LOT.z1], [LOT.x0, LOT.z0], [LOT.x1, LOT.z0], [LOT.x1, LOT.z1], gateCour) - 2, width: 4, kind: "gate" },
        ],
      },
    ],
    anchors,
    parking,
    vehicleRoutes,
  };
}

/** Distance le long de la clôture (dans l'ordre des points) jusqu'au point p situé sur le dernier côté. */
function perimeterOffset(a: Vec2, b: Vec2, c: Vec2, d2: Vec2, p: Vec2) {
  const l1 = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const l2 = Math.hypot(c[0] - b[0], c[1] - b[1]);
  const l3 = Math.hypot(d2[0] - c[0], d2[1] - c[1]);
  return l1 + l2 + l3 + Math.hypot(p[0] - d2[0], p[1] - d2[1]);
}

const DEFAULT_FOOTPRINT: Partial<Record<string, [number, number]>> = {
  plant: [0.6, 0.6],
  tree: [1, 1],
  bamboo: [0.6, 0.6],
  lamp_post: [0.3, 0.3],
  badge_reader: [0.3, 0.3],
  bench: [1.8, 0.5],
  lockers: [3, 0.5],
  cone: [0.4, 0.4],
  extinguisher: [0.3, 0.3],
  softbox: [0.6, 0.6],
  totem: [0.8, 0.4],
  art_ceramic: [0.6, 0.6],
  charging_station: [0.5, 0.4],
  parcel_stack: [1, 0.8],
};

function sum(a: number[]) {
  return a.reduce((s, v) => s + v, 0);
}
function samePoints(a: Vec2, b: Vec2) {
  return Math.abs(a[0] - b[0]) < 0.01 && Math.abs(a[1] - b[1]) < 0.01;
}
function inside(p: Vec2, poly: Vec2[]) {
  let r = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i];
    const [xj, zj] = poly[j];
    if (zi > p[1] !== zj > p[1] && p[0] < ((xj - xi) * (p[1] - zi)) / (zj - zi) + xi) r = !r;
  }
  return r;
}
