/** Fonctions pures de l'éditeur de plan (testées). */
import type { ObjectDef, Vec2 } from "./layout";

export const SNAP = 0.5; // grille magnétique (m)
export const STEP = Math.PI / 12; // rotation par pas de 15°

/** Applique un déplacement / une rotation à un objet et à ses emplacements de travail (transformation rigide). */
export function transformObject(o: ObjectDef, at: Vec2, rotation: number): ObjectDef {
  const d = rotation - o.rotation;
  const cos = Math.cos(d);
  const sin = Math.sin(d);
  const move = (p: Vec2): Vec2 => {
    const x = p[0] - o.at[0];
    const z = p[1] - o.at[1];
    return [at[0] + x * cos + z * sin, at[1] - x * sin + z * cos];
  };
  return { ...o, at, rotation, workspots: o.workspots?.map((w) => ({ ...w, at: move(w.at), rotation: w.rotation + d })) };
}

export const snap = (v: number) => Math.round(v / SNAP) * SNAP;

