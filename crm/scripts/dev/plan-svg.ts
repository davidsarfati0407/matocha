/** Vue de dessus du plan généré (zones, murs, objets, grille bloquée) → SVG, pour contrôle visuel. */
import { writeFileSync } from "node:fs";
import { sectorConfig } from "../../config/sector.config";
import { generatePlan } from "../../lib/map/generate";
import { buildNavGrid, toWorld } from "../../lib/map/nav";

const plan = generatePlan(sectorConfig, (t, k) => `${t}:${k}`);
const g = buildNavGrid(plan);
const S = 8;
const [x0, z0] = [-50, -36];
const [x1, z1] = [62, 24];
const X = (x: number) => (x - x0) * S;
const Z = (z: number) => (z - z0) * S;
const parts: string[] = [];
const colors: Record<string, string> = { parquet_clair: "#e9d8b8", beton_cire: "#d6d3cc", tatami: "#d9d39a", carrelage: "#e8e8e8", moquette: "#b9c2c8", resine: "#cfd8d2", paves: "#c9c1b2", gazon: "#b8d49a", enrobe: "#9a9a9a" };
for (const z of plan.zones) parts.push(`<polygon points="${z.polygon.map((p) => `${X(p[0])},${Z(p[1])}`).join(" ")}" fill="${colors[z.floor]}" stroke="#999"/><text x="${X(z.label?.at[0] ?? z.polygon[0][0])}" y="${Z(z.label?.at[1] ?? z.polygon[0][1])}" font-size="10" text-anchor="middle">${z.code}</text>`);
let d = "";
for (let r = 0; r < g.rows; r++) for (let c = 0; c < g.cols; c++) if (g.blocked[r * g.cols + c]) { const [wx, wz] = toWorld(g, c, r); if (wx > x0 && wx < x1 && wz > z0 && wz < z1) d += `M${X(wx - 0.25)} ${Z(wz - 0.25)}h${S / 2}v${S / 2}h${-S / 2}z`; }
parts.push(`<path d="${d}" fill="rgba(200,0,0,.3)"/>`);
for (const w of plan.walls) parts.push(`<line x1="${X(w.a[0])}" y1="${Z(w.a[1])}" x2="${X(w.b[0])}" y2="${Z(w.b[1])}" stroke="${w.height === "high" ? "#222" : "#777"}" stroke-width="3"/>`);
for (const p of plan.partitions) parts.push(`<line x1="${X(p.a[0])}" y1="${Z(p.a[1])}" x2="${X(p.b[0])}" y2="${Z(p.b[1])}" stroke="#39c" stroke-width="2"/>`);
for (const o of plan.objects) {
  parts.push(`<circle cx="${X(o.at[0])}" cy="${Z(o.at[1])}" r="2" fill="#333"><title>${o.id}</title></circle>`);
  for (const w of o.workspots ?? []) parts.push(`<circle cx="${X(w.at[0])}" cy="${Z(w.at[1])}" r="3" fill="${w.owner ? "#E07A5F" : "#79A84B"}"><title>${w.owner ?? w.pose}</title></circle>`);
}
for (const [k, a] of Object.entries(plan.anchors)) parts.push(`<circle cx="${X(a.at[0])}" cy="${Z(a.at[1])}" r="4" fill="#00f"><title>${k}</title></circle>`);
writeFileSync(process.argv[2] ?? "plan.svg", `<svg xmlns="http://www.w3.org/2000/svg" width="${(x1 - x0) * S}" height="${(z1 - z0) * S}" style="background:#f3efe5">${parts.join("")}</svg>`);
