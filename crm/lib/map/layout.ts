/**
 * Format du plan d'un site (floor_plans.layout). Le moteur 3D construit toute
 * la scène depuis ce JSON : aucune pièce n'est codée en dur dans les composants.
 * Unités : mètres. Axe x vers l'est, z vers le sud (la caméra regarde du sud-est).
 */

export type Vec2 = [x: number, z: number];

export type FloorMaterial =
  | "parquet_clair" | "beton_cire" | "tatami" | "carrelage" | "moquette" | "resine" | "paves" | "gazon" | "enrobe";

export type WallHeight = "high" | "low";

export interface Opening {
  /** Distance depuis le point a, en mètres. */
  at: number;
  width: number;
  kind: "door" | "window" | "gate" | "dock";
}

export interface WallDef {
  id: string;
  a: Vec2;
  b: Vec2;
  height: WallHeight;
  material: "enduit" | "brique" | "bardage";
  openings?: Opening[];
}

export interface PartitionDef {
  id: string;
  a: Vec2;
  b: Vec2;
  openings?: Opening[];
}

export interface ZoneDef {
  key: string;
  code: string;
  name: string;
  type: string;
  polygon: Vec2[];
  floor: FloorMaterial;
  label?: { text: string; at: Vec2; rotation?: number; size?: number };
}

/** Pose qu'un personnage prend à un emplacement de travail. */
export type Pose =
  | "stand" | "sit_type" | "sit_meeting" | "sit_relax" | "phone" | "coffee" | "talk" | "crouch"
  | "pack" | "whisk" | "film" | "pingpong" | "carry" | "inspect";

export interface Workspot {
  /** Position et orientation (radians, 0 = regarde vers +z) où se tient la personne. */
  at: Vec2;
  rotation: number;
  pose: Pose;
  /** Clé de collaborateur (posteId:index) à qui l'emplacement est attribué, si attribué. */
  owner?: string;
  /** Hauteur d'assise / de travail (0 = debout au sol). */
  y?: number;
}

export type KitType =
  | "desk" | "meeting_table" | "low_table" | "chair" | "stool" | "sofa" | "cushion" | "reception_desk" | "bar_counter"
  | "cafe_table" | "shelf_boxes" | "rack" | "pack_table" | "sealer" | "label_printer" | "scale" | "pallet" | "pallet_jack"
  | "printer" | "server_rack" | "wall_screen" | "backdrop" | "softbox" | "camera_tripod" | "ping_pong" | "kitchen"
  | "fridge" | "lockers" | "sample_cabinet" | "badge_reader" | "plant" | "bamboo" | "tree" | "bench" | "lamp_post"
  | "art_ceramic" | "totem" | "parcel_stack" | "cone" | "extinguisher" | "dock_door" | "bike_rack" | "matcha_machine"
  | "workbench" | "bin" | "parking_spot" | "charging_station" | "logo_wall" | "poster" | "rug";

export interface EntityRef {
  type: "assets" | "stock_rack" | "zones" | "employees" | "lots" | "work_orders";
  id: string;
  /** Clé lisible (ex. clé d'asset, lettre de rayonnage) : utile à l'éditeur et aux tests. */
  key?: string;
}

export interface ObjectDef {
  id: string;
  kit: KitType;
  at: Vec2;
  /** Hauteur de pose (0 = au sol). */
  y?: number;
  rotation: number;
  params?: Record<string, unknown>;
  zone?: string;
  entity?: EntityRef;
  label?: string;
  workspots?: Workspot[];
  /** Emprise au sol pour la navigation (largeur x profondeur, avant rotation). 0 = traversable. */
  footprint?: [number, number];
}

export interface RoadDef {
  id: string;
  points: Vec2[];
  width: number;
  /** Circulation de fond en boucle. */
  traffic?: boolean;
}

export interface FloorPlanLayout {
  version: 1;
  units: "m";
  bounds: { min: Vec2; max: Vec2 };
  buildings: { id: string; name: string; outline: Vec2[]; wallHeight: number }[];
  walls: WallDef[];
  partitions: PartitionDef[];
  zones: ZoneDef[];
  objects: ObjectDef[];
  roads: RoadDef[];
  fences: { id: string; points: Vec2[]; gates?: Opening[] }[];
  /** Points nommés utilisés par la simulation (entrée, badgeuse, quai, file d'attente…). */
  anchors: Record<string, { at: Vec2; rotation?: number }>;
  /** Places de stationnement des véhicules suivis. */
  parking: Record<string, { at: Vec2; rotation: number }>;
  /** Itinéraires des véhicules (Catmull-Rom), du bord de carte jusqu'à la place. */
  vehicleRoutes: Record<string, Vec2[]>;
}

/** Point le plus proche sur un segment, et distance. */
export function closestOnSegment(p: Vec2, a: Vec2, b: Vec2): { point: Vec2; t: number; dist: number } {
  const dx = b[0] - a[0];
  const dz = b[1] - a[1];
  const len2 = dx * dx + dz * dz || 1;
  const t = Math.max(0, Math.min(1, ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / len2));
  const point: Vec2 = [a[0] + dx * t, a[1] + dz * t];
  return { point, t, dist: Math.hypot(p[0] - point[0], p[1] - point[1]) };
}

export function pointInPolygon(p: Vec2, poly: Vec2[]): boolean {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, zi] = poly[i];
    const [xj, zj] = poly[j];
    if (zi > p[1] !== zj > p[1] && p[0] < ((xj - xi) * (p[1] - zi)) / (zj - zi) + xi) inside = !inside;
  }
  return inside;
}

export function polygonCentroid(poly: Vec2[]): Vec2 {
  let x = 0;
  let z = 0;
  for (const p of poly) {
    x += p[0];
    z += p[1];
  }
  return [x / poly.length, z / poly.length];
}

export const rect = (x0: number, z0: number, x1: number, z1: number): Vec2[] => [
  [x0, z0],
  [x1, z0],
  [x1, z1],
  [x0, z1],
];
