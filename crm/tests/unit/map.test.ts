import { describe, expect, it } from "vitest";
import { sectorConfig } from "@/config/sector.config";
import { generatePlan } from "@/lib/map/generate";
import { pointInPolygon } from "@/lib/map/layout";
import { buildNavGrid, findPath, lineOfSight, pathLength } from "@/lib/map/nav";

const resolve = (type: string, key: string) => `${type}:${key}`;
const plan = generatePlan(sectorConfig, resolve);
const grid = buildNavGrid(plan);
const zone = (k: string) => plan.zones.find((z) => z.key === k)!;
const inZone = (k: string, p: [number, number]) => pointInPolygon(p, zone(k).polygon);

describe("générateur de plan", () => {
  it("crée une zone par espace de la fiche", () => {
    expect(plan.zones.map((z) => z.key).sort()).toEqual(sectorConfig.lieux[0].zones.map((z) => z.id).sort());
  });
  it("donne un emplacement de travail à chaque collaborateur, dans l'espace de son poste", () => {
    const spots = plan.objects.flatMap((o) => o.workspots ?? []).filter((w) => w.owner);
    for (const p of sectorConfig.postes)
      for (let i = 0; i < p.effectif; i++) {
        const mine = spots.filter((w) => w.owner === `${p.id}:${i}`);
        expect(mine, `${p.id}:${i}`).toHaveLength(1);
        expect(inZone(p.zone, mine[0].at), `${p.id}:${i} dans ${p.zone}`).toBe(true);
      }
  });
  it("relie les équipements aux entités", () => {
    const keys = plan.objects.map((o) => o.entity?.key).filter(Boolean);
    expect(keys).toEqual(expect.arrayContaining(["badgeuse", "set_tournage", "table_pack_1", "imprimante_mfp", "A", "salle_uji"]));
  });
  it("met les murs du fond hauts et les façades côté caméra basses", () => {
    expect(plan.walls.some((w) => w.height === "high")).toBe(true);
    expect(plan.walls.some((w) => w.height === "low")).toBe(true);
  });
  it("aucun objet ne chevauche un autre objet bloquant au même endroit", () => {
    const solid = plan.objects.filter((o) => (o.footprint?.[0] ?? 0) > 0 && !["chair", "stool", "cushion"].includes(o.kit));
    for (let i = 0; i < solid.length; i++)
      for (let j = i + 1; j < solid.length; j++) expect(Math.hypot(solid[i].at[0] - solid[j].at[0], solid[i].at[1] - solid[j].at[1]), `${solid[i].id}/${solid[j].id}`).toBeGreaterThan(0.3);
  });
});

describe("navigation A*", () => {
  it("trouve un chemin de la rue jusqu'à chaque poste de travail", () => {
    const from = plan.anchors.gate_cour.at;
    for (const w of plan.objects.flatMap((o) => o.workspots ?? []).filter((s) => s.owner)) {
      const path = findPath(grid, from, w.at);
      expect(path, w.owner).not.toBeNull();
    }
  });
  it("passe par une porte plutôt qu'à travers un mur", () => {
    const path = findPath(grid, plan.anchors.street_west.at, plan.anchors.badge.at)!;
    for (let i = 1; i < path.length - 1; i++) expect(lineOfSight(grid, path[i - 1], path[i]) || i === 1).toBe(true);
    const straight = Math.hypot(plan.anchors.badge.at[0] - plan.anchors.street_west.at[0], plan.anchors.badge.at[1] - plan.anchors.street_west.at[1]);
    expect(pathLength(path)).toBeGreaterThan(straight);
  });
  it("relie l'atelier et les bureaux", () => {
    const prep = plan.objects.find((o) => o.entity?.key === "table_pack_1")!.workspots![0].at;
    const pp = plan.objects.find((o) => o.kit === "ping_pong")!.workspots![0].at;
    expect(findPath(grid, prep, pp)).not.toBeNull();
  });
});

import { snap, transformObject } from "@/lib/map/edit";

describe("éditeur de plan", () => {
  it("aimante sur une grille de 0,5 m", () => {
    expect(snap(1.26)).toBe(1.5);
    expect(snap(-0.74)).toBe(-0.5);
  });
  it("déplace les emplacements de travail avec l'objet (rotation de 90°)", () => {
    const o = { id: "d", kit: "desk" as const, at: [0, 0] as [number, number], rotation: 0, workspots: [{ at: [0, 1] as [number, number], rotation: Math.PI, pose: "sit_type" as const }] };
    const t = transformObject(o, [10, 5], Math.PI / 2);
    expect(t.workspots![0].at[0]).toBeCloseTo(11);
    expect(t.workspots![0].at[1]).toBeCloseTo(5);
    expect(t.workspots![0].rotation).toBeCloseTo(Math.PI * 1.5);
  });
});
