/**
 * Grille de navigation (0,5 m) construite depuis le plan + recherche A*.
 * Murs, cloisons, clôtures et mobilier bloquent ; les ouvertures (portes,
 * portails, quais) laissent passer. Fonctions pures, testées.
 */
import type { FloorPlanLayout, ObjectDef, Opening, Vec2 } from "./layout";

export interface NavGrid {
  cell: number;
  x0: number;
  z0: number;
  cols: number;
  rows: number;
  blocked: Uint8Array;
}

export function buildNavGrid(layout: FloorPlanLayout, cell = 0.5, objects: ObjectDef[] = layout.objects): NavGrid {
  const [x0, z0] = layout.bounds.min;
  const cols = Math.ceil((layout.bounds.max[0] - x0) / cell);
  const rows = Math.ceil((layout.bounds.max[1] - z0) / cell);
  const g: NavGrid = { cell, x0, z0, cols, rows, blocked: new Uint8Array(cols * rows) };
  for (const wl of layout.walls) blockSegment(g, wl.a, wl.b, wl.openings ?? [], 0.32);
  for (const p of layout.partitions) blockSegment(g, p.a, p.b, p.openings ?? [], 0.28);
  for (const f of layout.fences) {
    let offset = 0;
    for (let i = 0; i < f.points.length - 1; i++) {
      const a = f.points[i];
      const b = f.points[i + 1];
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      const local = (f.gates ?? []).map((o) => ({ ...o, at: o.at - offset })).filter((o) => o.at + o.width > 0 && o.at < len);
      blockSegment(g, a, b, local, 0.25);
      offset += len;
    }
  }
  for (const o of objects) {
    const [fw, fd] = o.footprint ?? [0, 0];
    if (fw > 0 && fd > 0) blockRect(g, o.at, fw + 0.3, fd + 0.3, o.rotation);
  }
  return g;
}

const idx = (g: NavGrid, c: number, r: number) => r * g.cols + c;
export const toCell = (g: NavGrid, p: Vec2): [number, number] => [Math.floor((p[0] - g.x0) / g.cell), Math.floor((p[1] - g.z0) / g.cell)];
export const toWorld = (g: NavGrid, c: number, r: number): Vec2 => [g.x0 + (c + 0.5) * g.cell, g.z0 + (r + 0.5) * g.cell];
const inGrid = (g: NavGrid, c: number, r: number) => c >= 0 && r >= 0 && c < g.cols && r < g.rows;
export const isBlocked = (g: NavGrid, c: number, r: number) => !inGrid(g, c, r) || g.blocked[idx(g, c, r)] === 1;

function blockSegment(g: NavGrid, a: Vec2, b: Vec2, openings: Opening[], half: number) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  if (len === 0) return;
  const ux = (b[0] - a[0]) / len;
  const uz = (b[1] - a[1]) / len;
  const step = g.cell / 3;
  for (let t = 0; t <= len; t += step) {
    // Épaisseur appliquée perpendiculairement seulement : une porte garde sa largeur utile.
    if (openings.some((o) => o.kind !== "window" && t > o.at && t < o.at + o.width)) continue;
    for (let s = -half; s <= half; s += step) {
      const [c, r] = toCell(g, [a[0] + ux * t - uz * s, a[1] + uz * t + ux * s]);
      if (inGrid(g, c, r)) g.blocked[idx(g, c, r)] = 1;
    }
  }
}

function blockRect(g: NavGrid, at: Vec2, w: number, d: number, rotation: number) {
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const ext = Math.hypot(w, d) / 2;
  const [c0, r0] = toCell(g, [at[0] - ext, at[1] - ext]);
  const [c1, r1] = toCell(g, [at[0] + ext, at[1] + ext]);
  for (let r = r0; r <= r1; r++)
    for (let c = c0; c <= c1; c++) {
      if (!inGrid(g, c, r)) continue;
      const [wx, wz] = toWorld(g, c, r);
      const dx = wx - at[0];
      const dz = wz - at[1];
      // repère local de l'objet (inverse de la rotation three.js)
      const lx = dx * cos - dz * sin;
      const lz = dx * sin + dz * cos;
      if (Math.abs(lx) <= w / 2 && Math.abs(lz) <= d / 2) g.blocked[idx(g, c, r)] = 1;
    }
}

/** Cellule libre la plus proche (recherche en largeur). */
export function nearestFree(g: NavGrid, p: Vec2): [number, number] | null {
  const [sc, sr] = toCell(g, p);
  if (!isBlocked(g, sc, sr)) return [sc, sr];
  const seen = new Set<number>([idx(g, sc, sr)]);
  const q: [number, number][] = [[sc, sr]];
  for (let head = 0; head < q.length && head < 4000; head++) {
    const [c, r] = q[head];
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = c + dc;
      const nr = r + dr;
      if (!inGrid(g, nc, nr) || seen.has(idx(g, nc, nr))) continue;
      if (!isBlocked(g, nc, nr)) return [nc, nr];
      seen.add(idx(g, nc, nr));
      q.push([nc, nr]);
    }
  }
  return null;
}

/** A* 8 directions sans couper les angles, puis lissage par ligne de vue. Renvoie des points monde. */
export function findPath(g: NavGrid, from: Vec2, to: Vec2): Vec2[] | null {
  const s = nearestFree(g, from);
  const t = nearestFree(g, to);
  if (!s || !t) return null;
  const start = idx(g, s[0], s[1]);
  const goal = idx(g, t[0], t[1]);
  const n = g.cols * g.rows;
  const gScore = new Float32Array(n).fill(Infinity);
  const came = new Int32Array(n).fill(-1);
  const closed = new Uint8Array(n);
  const heap = new MinHeap();
  const h = (i: number) => {
    const dc = Math.abs((i % g.cols) - t[0]);
    const dr = Math.abs(Math.floor(i / g.cols) - t[1]);
    return dc + dr + (Math.SQRT2 - 2) * Math.min(dc, dr);
  };
  gScore[start] = 0;
  heap.push(start, h(start));
  const dirs = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]] as const;
  let found = false;
  while (heap.size) {
    const cur = heap.pop();
    if (cur === goal) {
      found = true;
      break;
    }
    if (closed[cur]) continue;
    closed[cur] = 1;
    const c = cur % g.cols;
    const r = Math.floor(cur / g.cols);
    for (const [dc, dr, cost] of dirs) {
      const nc = c + dc;
      const nr = r + dr;
      if (isBlocked(g, nc, nr)) continue;
      if (dc !== 0 && dr !== 0 && (isBlocked(g, c + dc, r) || isBlocked(g, c, r + dr))) continue;
      const ni = idx(g, nc, nr);
      const ng = gScore[cur] + cost;
      if (ng < gScore[ni]) {
        gScore[ni] = ng;
        came[ni] = cur;
        heap.push(ni, ng + h(ni));
      }
    }
  }
  if (!found) return null;
  const cells: number[] = [];
  for (let i = goal; i !== -1; i = came[i]) cells.push(i);
  cells.reverse();
  // Lissage : on garde un point tant que le suivant est visible
  const pts = cells.map((i) => toWorld(g, i % g.cols, Math.floor(i / g.cols)));
  const out: Vec2[] = [from];
  let anchor = pts[0];
  for (let i = 1; i < pts.length; i++) {
    if (!lineOfSight(g, anchor, pts[i])) {
      out.push(pts[i - 1]);
      anchor = pts[i - 1];
    }
  }
  out.push(to);
  return out;
}

export function lineOfSight(g: NavGrid, a: Vec2, b: Vec2): boolean {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const steps = Math.ceil(len / (g.cell / 2));
  for (let i = 1; i < steps; i++) {
    const p: Vec2 = [a[0] + ((b[0] - a[0]) * i) / steps, a[1] + ((b[1] - a[1]) * i) / steps];
    const [c, r] = toCell(g, p);
    if (isBlocked(g, c, r)) return false;
  }
  return true;
}

export function pathLength(path: Vec2[]): number {
  let l = 0;
  for (let i = 1; i < path.length; i++) l += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
  return l;
}

class MinHeap {
  private items: number[] = [];
  private prio: number[] = [];
  get size() {
    return this.items.length;
  }
  push(item: number, p: number) {
    this.items.push(item);
    this.prio.push(p);
    let i = this.items.length - 1;
    while (i > 0) {
      const parent = (i - 1) >> 1;
      if (this.prio[parent] <= this.prio[i]) break;
      this.swap(i, parent);
      i = parent;
    }
  }
  pop(): number {
    const top = this.items[0];
    const lastI = this.items.pop()!;
    const lastP = this.prio.pop()!;
    if (this.items.length) {
      this.items[0] = lastI;
      this.prio[0] = lastP;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < this.items.length && this.prio[l] < this.prio[m]) m = l;
        if (r < this.items.length && this.prio[r] < this.prio[m]) m = r;
        if (m === i) break;
        this.swap(i, m);
        i = m;
      }
    }
    return top;
  }
  private swap(a: number, b: number) {
    [this.items[a], this.items[b]] = [this.items[b], this.items[a]];
    [this.prio[a], this.prio[b]] = [this.prio[b], this.prio[a]];
  }
}
