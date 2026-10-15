"use client";
/**
 * Éditeur de plan (rôles autorisés à modifier le plan) : palette du kit,
 * propriétés de l'objet (liaison à une entité), rotation par pas de 15°,
 * annuler / rétablir, sauvegarde versionnée et publication.
 * Le déplacement se fait à la souris (gizmo, grille magnétique de 0,5 m).
 */
import { useEffect, useMemo, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import type { EntityRef, KitType, ObjectDef, Vec2 } from "@/lib/map/layout";
import { pointInPolygon } from "@/lib/map/layout";
import { useMap } from "@/lib/map/store";
import { savePlan } from "@/app/(map)/map/actions";
import { engineRef } from "../engine/engine";
import { KIT_PALETTE } from "../kit/furniture";
import { Icon, panel } from "../hud/ui";

import { SNAP, STEP, snap, transformObject } from "@/lib/map/edit";
export { SNAP };

/** Objets proposés dans la palette ; libellés traduits (map.editor.kit.*). */
const KIT_LABELLED = new Set<KitType>(["desk", "chair", "meeting_table", "sofa", "plant", "rack", "pack_table", "pallet", "printer", "wall_screen", "ping_pong", "bamboo", "tree", "bench", "cafe_table", "parcel_stack", "lockers", "server_rack", "kitchen", "shelf_boxes", "art_ceramic", "cone", "totem"]);

/** Historique : copies profondes de la liste d'objets. */
class History {
  private past: ObjectDef[][] = [];
  private future: ObjectDef[][] = [];
  push(state: ObjectDef[]) {
    this.past.push(structuredClone(state));
    if (this.past.length > 80) this.past.shift();
    this.future = [];
  }
  undo(current: ObjectDef[]) {
    const prev = this.past.pop();
    if (!prev) return null;
    this.future.push(structuredClone(current));
    return prev;
  }
  redo(current: ObjectDef[]) {
    const next = this.future.pop();
    if (!next) return null;
    this.past.push(structuredClone(current));
    return next;
  }
  get canUndo() {
    return this.past.length > 0;
  }
  get canRedo() {
    return this.future.length > 0;
  }
}
export const history = new History();

/** Identifiant unique d'un objet ajouté dans l'éditeur (préfixe « ed_ »). */
function nextId(kit: string, objects: ObjectDef[]) {
  const used = new Set(objects.map((o) => o.id));
  let n = objects.length;
  while (used.has(`ed_${kit}_${n}`)) n++;
  return `ed_${kit}_${n}`;
}

/** Enregistre la position du gizmo dans le plan (appelé en fin de glisser). */
export function commitTransform(id: string) {
  const e = engineRef.current;
  const entry = e?.world.objects.get(id);
  if (!e || !entry) return;
  const g = entry.built.group;
  const at: Vec2 = [snap(g.position.x), snap(g.position.z)];
  const rotation = Math.round(g.rotation.y / STEP) * STEP;
  g.position.set(at[0], g.position.y, at[1]);
  g.rotation.y = rotation;
  if (at[0] === entry.def.at[0] && at[1] === entry.def.at[1] && rotation === entry.def.rotation) return;
  history.push(e.layout.objects);
  const next = transformObject(entry.def, at, rotation);
  next.zone = e.layout.zones.find((z) => z.type !== "exterieur" && pointInPolygon(at, z.polygon))?.key ?? next.zone;
  entry.def = next;
  e.layout.objects = e.layout.objects.map((o) => (o.id === id ? next : o));
  useMap.getState().set({ planDirty: true });
}

export function PlanEditor() {
  const target = useMap((s) => s.editTarget);
  const mode = useMap((s) => s.transformMode);
  const dirty = useMap((s) => s.planDirty);
  const snapState = useMap((s) => s.snapshot);
  const set = useMap((s) => s.set);
  const [, force] = useState(0);
  const [pending, start] = useTransition();
  const t = useTranslations("map");
  const kitLabel = (kit: KitType) => (KIT_LABELLED.has(kit) ? t(`editor.kit.${kit}`) : kit);
  const e = engineRef.current;
  const obj = target ? e?.world.objects.get(target)?.def : undefined;

  useEffect(() => {
    engineRef.current?.enterEdit();
    return () => {
      engineRef.current?.exitEdit();
      useMap.getState().set({ editTarget: null });
    };
  }, []);

  const replace = (objects: ObjectDef[] | null) => {
    if (!objects || !e) return;
    e.setObjects(objects);
    set({ editTarget: objects.some((o) => o.id === target) ? target : null, planDirty: true });
    force((n) => n + 1);
  };

  const update = (patch: Partial<ObjectDef>) => {
    if (!e || !obj) return;
    history.push(e.layout.objects);
    let next: ObjectDef = { ...obj, ...patch };
    if (patch.rotation !== undefined) next = transformObject(obj, obj.at, patch.rotation);
    e.setObjects(e.layout.objects.map((o) => (o.id === obj.id ? next : o)));
    set({ planDirty: true });
    force((n) => n + 1);
  };

  const add = (kit: KitType) => {
    if (!e) return;
    history.push(e.layout.objects);
    const c = e.director.current().target;
    const def: ObjectDef = { id: nextId(kit, e.layout.objects), kit, at: [snap(c.x), snap(c.z)], rotation: 0, footprint: [0.8, 0.8] };
    def.zone = e.layout.zones.find((z) => z.type !== "exterieur" && pointInPolygon(def.at, z.polygon))?.key;
    e.setObjects([...e.layout.objects, def]);
    set({ editTarget: def.id, planDirty: true });
  };

  const remove = () => {
    if (!e || !obj) return;
    if (obj.workspots?.some((w) => w.owner)) {
      useMap.getState().toast({ title: t("editor.deleteImpossible"), detail: t("editor.deleteImpossibleDetail"), tone: "warn" });
      return;
    }
    history.push(e.layout.objects);
    e.setObjects(e.layout.objects.filter((o) => o.id !== obj.id));
    set({ editTarget: null, planDirty: true });
  };

  const entities = useMemo(() => {
    const out: { label: string; ref: EntityRef }[] = [];
    for (const a of snapState?.assets ?? []) out.push({ label: t("editor.entityAsset", { name: a.name }), ref: { type: "assets", id: a.id, key: a.key } });
    for (const l of ["A", "B", "C", "D"]) out.push({ label: t("common.rack", { letter: l }), ref: { type: "stock_rack", id: `rack:${l}`, key: l } });
    return out;
  }, [snapState?.assets, t]);

  const save = (publish: boolean) =>
    start(async () => {
      if (!e || !snapState) return;
      const r = await savePlan(snapState.site.id, e.layout, publish);
      if ("error" in r) useMap.getState().toast({ title: t("editor.planNotSaved"), detail: r.error, tone: "warn" });
      else {
        useMap.getState().toast({ title: t(publish ? "editor.planPublished" : "editor.draftSaved", { version: r.version }), detail: publish ? t("editor.publishedDetail") : t("editor.draftDetail"), tone: "ok" });
        set({ planDirty: false });
      }
    });

  return (
    <aside aria-label={t("editor.ariaLabel")} className={`${panel} pointer-events-auto flex max-h-full w-[340px] flex-col overflow-hidden`}>
      <header className="flex items-center gap-2 border-b border-black/5 p-3">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">{t("editor.editMode")}</p>
          <h2 className="text-[15px] font-semibold">{t(dirty ? "editor.planVersionDirty" : "editor.planVersion", { version: snapState?.plan.version ?? "" })}</h2>
        </div>
        <button title={t("editor.undo")} aria-label={t("editor.undo")} disabled={!history.canUndo} onClick={() => e && replace(history.undo(e.layout.objects))} className="grid size-8 place-items-center rounded-lg ring-1 ring-black/10 disabled:opacity-30">
          <Icon name="undo" size={15} />
        </button>
        <button title={t("editor.redo")} aria-label={t("editor.redo")} disabled={!history.canRedo} onClick={() => e && replace(history.redo(e.layout.objects))} className="grid size-8 place-items-center rounded-lg ring-1 ring-black/10 disabled:opacity-30">
          <Icon name="redo" size={15} />
        </button>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto p-3 text-[13px]">
        <p className="mb-3 rounded-lg bg-ground/70 p-2 text-xs text-muted">{t("editor.help")}</p>
        {obj ? (
          <section className="mb-4">
            <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider">{t("editor.selectedObject")}</h3>
            <p className="font-medium">
              {kitLabel(obj.kit)} <span className="font-mono text-xs text-muted">{obj.id}</span>
            </p>
            <p className="text-xs text-muted">
              x {obj.at[0].toFixed(1)} · z {obj.at[1].toFixed(1)} · {Math.round((obj.rotation * 180) / Math.PI) % 360}° · {obj.zone ?? t("editor.outside")}
            </p>
            <div className="mt-2 grid grid-cols-4 gap-1.5">
              <button onClick={() => set({ transformMode: "translate" })} className={`rounded-lg px-2 py-1.5 text-xs ring-1 ring-black/10 ${mode === "translate" ? "bg-ink text-white" : ""}`}>
                {t("editor.move")}
              </button>
              <button onClick={() => update({ rotation: obj.rotation - STEP })} title={t("editor.rotateLeft")} className="rounded-lg px-2 py-1.5 text-xs ring-1 ring-black/10">
                −15°
              </button>
              <button onClick={() => update({ rotation: obj.rotation + STEP })} title={t("editor.rotateRight")} className="rounded-lg px-2 py-1.5 text-xs ring-1 ring-black/10">
                +15°
              </button>
              <button onClick={remove} aria-label={t("editor.delete")} title={t("editor.delete")} className="grid place-items-center rounded-lg text-accent ring-1 ring-black/10">
                <Icon name="trash" size={14} />
              </button>
            </div>
            <label className="mt-3 block text-xs font-medium">
              {t("editor.label")}
              <input defaultValue={obj.label ?? ""} key={obj.id} onBlur={(ev) => ev.target.value !== (obj.label ?? "") && update({ label: ev.target.value || undefined })} className="mt-1 w-full rounded-lg px-2 py-1.5 ring-1 ring-black/10" />
            </label>
            <label className="mt-3 block text-xs font-medium">
              {t("editor.linkEntity")}
              <select
                key={`${obj.id}:ent`}
                value={obj.entity ? `${obj.entity.type}:${obj.entity.id}` : ""}
                onChange={(ev) => {
                  const found = entities.find((x) => `${x.ref.type}:${x.ref.id}` === ev.target.value);
                  update({ entity: found?.ref, label: obj.label ?? found?.label.split(" · ").pop() });
                }}
                className="mt-1 w-full rounded-lg px-2 py-1.5 ring-1 ring-black/10"
              >
                <option value="">{t("editor.noEntity")}</option>
                {entities.map((x) => (
                  <option key={`${x.ref.type}:${x.ref.id}`} value={`${x.ref.type}:${x.ref.id}`}>
                    {x.label}
                  </option>
                ))}
              </select>
            </label>
          </section>
        ) : (
          <p className="mb-4 text-xs text-muted">{t("editor.noSelection")}</p>
        )}
        <h3 className="mb-2 text-[11px] font-semibold uppercase tracking-wider">{t("editor.palette")}</h3>
        <div className="grid grid-cols-3 gap-1.5">
          {KIT_PALETTE.filter((k) => KIT_LABELLED.has(k)).map((k) => (
            <button key={k} onClick={() => add(k)} className="rounded-lg px-2 py-2 text-xs ring-1 ring-black/10 hover:bg-black/5">
              {kitLabel(k)}
            </button>
          ))}
        </div>
      </div>
      <footer className="flex gap-2 border-t border-black/5 p-3">
        <button disabled={pending} onClick={() => save(false)} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium ring-1 ring-black/10 hover:bg-black/5">
          <Icon name="save" size={14} /> {t("editor.save")}
        </button>
        <button disabled={pending} onClick={() => save(true)} className="flex-1 rounded-xl bg-accent px-3 py-2 text-sm font-medium text-white">
          {t("editor.publish")}
        </button>
      </footer>
    </aside>
  );
}
