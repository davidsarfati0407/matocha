"use client";
/** KPI, notifications volantes, tableau en direct, suivi du dossier, boutons caméra, rail, visite. */
import Link from "next/link";
import { useEffect, useState } from "react";
import { sectorConfig } from "@/config/sector.config";
import { formatDate, formatMoney, formatNumber, formatPercent, formatTime } from "@/lib/format";
import { backOfficeHref } from "@/lib/map/links";
import type { MapSnapshot, MapWorkOrder } from "@/lib/map/snapshot";
import { useMap } from "@/lib/map/store";
import { engineRef } from "../engine/engine";
import { useNow } from "./DetailPanel";
import { Bar, Icon, Pill, Ring, panel } from "./ui";

const KPI_ICON: Record<string, string> = { nombre: "box", pourcent: "clock", eur: "layers" };

export function Kpis() {
  const kpis = useMap((s) => s.snapshot?.kpis);
  const flash = useMap((s) => s.flash);
  if (!kpis) return null;
  return (
    <div className="pointer-events-auto flex gap-2.5">
      {sectorConfig.kpisEnTete.map((k) => {
        const v = kpis[k.id];
        const value = v?.value == null ? "—" : k.unite === "eur" ? formatMoney(Number(v.value), "fr", 0) : k.unite === "pourcent" ? formatPercent(Number(v.value)) : formatNumber(Number(v.value));
        const d = v?.delta == null ? null : Number(v.delta);
        const delta = d == null ? null : k.unite === "nombre" ? `${d >= 0 ? "+" : ""}${formatNumber(d)}` : `${d >= 0 ? "+" : ""}${formatPercent(d)}`;
        const target = v?.target ? ` · objectif ${formatMoney(Number(v.target), "fr", 0)}` : "";
        return (
          // La clé change à chaque flash : l'animation CSS est rejouée
          <div key={`${k.id}:${flash[k.id] ?? 0}`} className={`${panel} flex min-w-44 items-center gap-3 px-3.5 py-2.5 ${flash[k.id] ? "animate-[kpiflash_1.6s_ease-out]" : ""}`}>
            <span className="grid size-9 place-items-center rounded-xl bg-accent/10 text-accent">
              <Icon name={KPI_ICON[k.unite]} size={17} />
            </span>
            <div className="leading-tight">
              <p className="text-[11px] font-medium text-muted">{k.libelle}</p>
              <p className="text-[20px] font-semibold tracking-tight">
                {value} {delta && <span className={`align-middle text-[11px] font-semibold ${d! >= 0 ? "text-ok" : "text-accent"}`}>{d! >= 0 ? "↑" : "↓"} {delta}</span>}
              </p>
              <p className="text-[10px] text-muted">
                {k.sousTitre}
                {target}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function Toasts() {
  const toasts = useMap((s) => s.toasts);
  const dismiss = useMap((s) => s.dismissToast);
  return (
    <div className="pointer-events-none flex w-80 flex-col gap-2" aria-live="polite">
      {toasts.map((t) => (
        <button
          key={t.id}
          onClick={() => {
            if (t.pickId) engineRef.current?.selectPick(t.pickId);
            dismiss(t.id);
          }}
          className={`${panel} pointer-events-auto relative animate-[toastin_.35s_cubic-bezier(.2,.9,.3,1.2)] overflow-hidden px-3.5 py-2.5 text-left`}
        >
          <span className="flex items-start gap-2.5">
            <span className={`mt-1 size-2 shrink-0 rounded-full ${t.tone === "warn" ? "bg-warn" : t.tone === "ok" ? "bg-ok" : "bg-accent"}`} />
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold">{t.title}</span>
              {t.detail && <span className="line-clamp-2 block text-xs text-muted">{t.detail}</span>}
            </span>
            <span className="ml-auto shrink-0 text-[10px] text-muted">{formatTime(new Date(t.at))}</span>
          </span>
          <span className="absolute bottom-0 left-0 h-0.5 w-full origin-left animate-[toastbar_6s_linear] bg-accent/60" />
        </button>
      ))}
    </div>
  );
}

const TABS = ["Préparation", "Équipe", "Commandes pro", "Stock"] as const;

export function LiveTable() {
  const snap = useMap((s) => s.snapshot);
  useMap((s) => s.engineReady); // re-rendu quand la scène (tables de pack) est prête
  const [tab, setTab] = useState<(typeof TABS)[number]>("Préparation");
  if (!snap) return null;
  const go = (type: string, id: string) => {
    const pick = engineRef.current?.resolve(type, id);
    if (pick) engineRef.current?.selectPick(pick);
  };
  const tables = engineRef.current ? [...engineRef.current.world.objects.values()].filter((o) => o.def.kit === "pack_table") : [];
  const counts: Record<string, number> = {
    Préparation: tables.length,
    Équipe: snap.employees.filter((e) => !["absent", "teletravail", "deplacement", "pas_badge", "parti"].includes(e.status)).length,
    "Commandes pro": snap.workOrders.filter((w) => !["livree", "facturee"].includes(w.stage)).length,
    Stock: snap.stock.filter((s) => s.quantity < s.minQuantity).length,
  };
  return (
    <div className={`${panel} pointer-events-auto flex h-full w-[420px] flex-col overflow-hidden`}>
      <div role="tablist" className="flex gap-1 border-b border-black/5 p-1.5">
        {TABS.map((t) => (
          <button key={t} role="tab" aria-selected={tab === t} onClick={() => setTab(t)} className={`flex-1 rounded-lg px-2 py-1.5 text-[12px] font-semibold ${tab === t ? "bg-white shadow-sm ring-1 ring-black/10" : "text-muted hover:text-ink"}`}>
            {t} <span className="font-normal text-muted">{counts[t]}</span>
          </button>
        ))}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto px-2 py-1 text-[12px]">
        {tab === "Préparation" &&
          tables.map((o) => {
            const slot = o.def.workspots?.[0]?.owner;
            const e = snap.employees.find((x) => x.slot === slot);
            const n = snap.shopToday.byStation[String(o.def.params?.index)] ?? 0;
            return (
              <TableRow key={o.def.id} id={`T${o.def.params?.index}`} sub="Table" onClick={() => engineRef.current?.selectPick(`obj:${o.def.id}`)} title={e ? `${e.firstName} ${e.lastName}` : "Libre"} pill={<Pill tone={e?.status === "au_poste" ? "ok" : e ? e.status : "muted"}>{e?.status === "au_poste" ? "En préparation" : undefined}</Pill>} progress={Math.min(1, n / 12)} />
            );
          })}
        {tab === "Équipe" &&
          snap.employees
            .slice()
            .sort((a, b) => statusOrder(a.status) - statusOrder(b.status))
            .map((e) => <TableRow key={e.id} id={`${e.firstName[0]}${e.lastName[0]}`} sub={e.firstIn ? formatTime(e.firstIn) : "—"} title={`${e.firstName} ${e.lastName} · ${e.jobTitle}`} pill={<Pill tone={e.status} />} onClick={() => go("employees", e.id)} />)}
        {tab === "Commandes pro" &&
          snap.workOrders
            .filter((w) => !["livree", "facturee"].includes(w.stage))
            .map((w) => (
              <TableRow key={w.id} id={w.number.slice(-4)} sub={w.number.slice(0, 5)} title={`${w.clientName} · ${w.title}`} pill={<Pill tone={w.status === "attente" ? "warn" : "accent"}>{w.status === "attente" ? "Attente" : sectorConfig.objetMetierCentral.etapes.find((s) => s.id === w.stage)?.libelle}</Pill>} progress={w.progress} onClick={() => go("work_orders", w.id)} />
            ))}
        {tab === "Stock" &&
          snap.stock.map((s) => {
            const low = s.quantity < s.minQuantity;
            return <TableRow key={s.id} id={s.location ?? ""} sub="Empl." title={s.name} pill={<Pill tone={s.onOrder ? "muted" : low ? "accent" : "ok"}>{s.onOrder ? "Commandé" : low ? "Stock bas" : "En stock"}</Pill>} progress={s.quantity / Math.max(1, s.minQuantity * 2)} tone={low ? "accent" : "ok"} onClick={() => go("stock_items", s.id)} />;
          })}
      </div>
    </div>
  );
}

function statusOrder(s: string) {
  return ["au_poste", "reunion", "pause", "pas_badge", "teletravail", "deplacement", "absent", "parti"].indexOf(s);
}

function TableRow({ id, sub, title, pill, progress, tone = "accent", onClick }: { id: string; sub: string; title: string; pill: React.ReactNode; progress?: number; tone?: "accent" | "ok"; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 border-b border-black/5 px-1 py-1.5 text-left last:border-0 hover:bg-black/[0.02]">
      <span className="w-10 shrink-0 leading-tight">
        <span className="block font-mono text-[11px] font-semibold">{id}</span>
        <span className="block text-[10px] text-muted">{sub}</span>
      </span>
      <span className="min-w-0 flex-1 truncate">{title}</span>
      {pill}
      {progress !== undefined && <Bar value={progress} tone={tone} className="w-12 shrink-0" />}
      <Icon name="chevron" size={12} className="shrink-0 text-muted" />
    </button>
  );
}

/** Suivi du dossier lié à la sélection (ou le plus urgent). */
export function WorkOrderDock() {
  const snap = useMap((s) => s.snapshot);
  const sel = useMap((s) => s.selection);
  const now = useNow(30000);
  if (!snap) return null;
  const wo = pickWorkOrder(snap, sel);
  if (!wo) return null;
  const stages = sectorConfig.objetMetierCentral.etapes;
  const idx = stages.findIndex((s) => s.id === wo.stage);
  const href = backOfficeHref("work_orders", wo.id);
  return (
    <div className={`${panel} pointer-events-auto flex items-center gap-4 px-4 py-3`}>
      <div className="min-w-0">
        <p className="flex items-center gap-1.5 text-[13px] font-semibold">
          <Icon name="truck" size={15} className="text-accent" /> Suivi {sectorConfig.objetMetierCentral.nom}
        </p>
        <ol className="mt-2 flex items-start">
          {stages.map((s, i) => {
            const st = wo.stages.find((x) => x.stage === s.id);
            const done = i < idx;
            const current = i === idx;
            return (
              <li key={s.id} className="flex items-start">
                <div className="flex w-[74px] flex-col items-center text-center">
                  <span className={`relative grid size-6 place-items-center rounded-full text-white ${done ? "bg-accent" : current ? "bg-accent" : "bg-black/10"}`}>
                    {current && <span className="absolute inset-0 animate-ping rounded-full bg-accent/40" />}
                    {done ? <Icon name="check" size={13} /> : current ? <span className="size-2 rounded-full bg-white" /> : null}
                  </span>
                  <span className={`mt-1 text-[11px] font-semibold ${i > idx ? "text-muted" : ""}`}>{s.libelle}</span>
                  <span className="text-[10px] text-muted">{st ? `${formatDate(st.enteredAt).slice(0, 5)} · ${formatTime(st.enteredAt)}` : i === stages.length - 1 && wo.dueAt ? `ETA ${formatDate(wo.dueAt).slice(0, 5)}` : "—"}</span>
                </div>
                {i < stages.length - 1 && <span className={`mt-3 h-0.5 w-4 ${i < idx ? "bg-accent" : "bg-black/10"}`} />}
              </li>
            );
          })}
        </ol>
      </div>
      <Link href={href ?? "#"} className="flex items-center gap-3 rounded-xl bg-ground/70 px-3 py-2 hover:bg-ground">
        <Ring value={wo.progress} />
        <span className="leading-tight">
          <span className="block font-mono text-[12px] font-semibold">#{wo.number}</span>
          <span className="block max-w-36 truncate text-[12px]">{wo.clientName}</span>
          <span className="block text-[10px] text-muted">{wo.dueAt ? `échéance ${formatTime(wo.dueAt)}${Date.parse(wo.dueAt) < now ? " · en retard" : ""}` : ""}</span>
        </span>
        <Icon name="chevron" size={14} className="text-muted" />
      </Link>
    </div>
  );
}

function pickWorkOrder(s: MapSnapshot, sel: ReturnType<typeof useMap.getState>["selection"]): MapWorkOrder | undefined {
  const active = s.workOrders.filter((w) => !["livree", "facturee"].includes(w.stage));
  if (sel?.entityType === "work_orders") return s.workOrders.find((w) => w.id === sel.entityId);
  if (sel?.entityType === "employees") return active.find((w) => w.ownerId === sel.entityId);
  if (sel?.entityType === "zones") {
    const z = s.zones.find((x) => x.key === sel.entityId);
    const found = active.find((w) => w.zoneId === z?.id);
    if (found) return found;
  }
  return active.slice().sort((a, b) => (a.dueAt ?? "9").localeCompare(b.dueAt ?? "9"))[0];
}

export function CameraButtons() {
  const d = () => engineRef.current?.director;
  const btn = "grid size-9 place-items-center rounded-xl hover:bg-black/5";
  return (
    <div className={`${panel} pointer-events-auto flex flex-col p-1`}>
      <button aria-label="Zoom avant" className={btn} onClick={() => d()?.zoom(0.7)}>
        <Icon name="plus" />
      </button>
      <button aria-label="Zoom arrière" className={btn} onClick={() => d()?.zoom(1.4)}>
        <Icon name="minus" />
      </button>
      <span className="mx-2 my-1 h-px bg-black/10" />
      <button aria-label="Pivoter à gauche" className={btn} onClick={() => d()?.rotate(Math.PI / 4)}>
        <Icon name="rotl" />
      </button>
      <button aria-label="Pivoter à droite" className={btn} onClick={() => d()?.rotate(-Math.PI / 4)}>
        <Icon name="rotr" />
      </button>
      <button aria-label="Vue d'ensemble (H)" className={btn} onClick={() => d()?.home()}>
        <Icon name="home" />
      </button>
      <button aria-label="Visite guidée (T)" className="mt-1 grid size-9 place-items-center rounded-xl bg-accent text-white" onClick={() => startTour()}>
        <Icon name="play" />
      </button>
    </div>
  );
}

export function TourBar() {
  const tour = useMap((s) => s.tour);
  if (!tour.active) return null;
  return (
    <div className={`${panel} pointer-events-auto flex items-center gap-3 px-4 py-2 text-[13px]`}>
      <span className="size-2 animate-pulse rounded-full bg-accent" />
      <span className="font-semibold">Visite guidée</span>
      <span className="text-muted">— {tour.title} · {tour.index + 1}/{tour.total}</span>
      <Bar value={tour.progress} className="w-28" tone="accent" />
      <button onClick={() => useMap.getState().set({ tour: { ...tour, active: false } })} className="text-xs text-muted hover:text-ink">
        Échap
      </button>
    </div>
  );
}

/** Visite guidée : plans enchaînés automatiquement, lente orbite pendant chaque plan. */
export async function startTour() {
  const e = engineRef.current;
  const st = useMap.getState();
  if (!e) return;
  const zones = e.layout.zones;
  const zoneShot = (type: string) => zones.find((z) => z.type === type);
  const shots: { title: string; pick?: string; home?: boolean }[] = [{ title: "Vue d'ensemble", home: true }];
  for (const t of ["bar", "open_space", "studio", "reunion", "preparation", "stock", "quarantaine", "expedition", "detente"]) {
    const z = zoneShot(t);
    if (z) shots.push({ title: z.name, pick: `zone:${z.key}` });
  }
  shots.push({ title: "Retour à la vue d'ensemble", home: true });
  st.select(null);
  st.set({ tour: { active: true, index: 0, total: shots.length, title: shots[0].title, progress: 0 } });
  const SHOT = 5500;
  for (let i = 0; i < shots.length; i++) {
    if (!useMap.getState().tour.active) break;
    const s = shots[i];
    useMap.getState().set({ tour: { active: true, index: i, total: shots.length, title: s.title, progress: 0 } });
    e.director.orbitSpeed = 0;
    if (s.home) await e.director.home();
    else if (s.pick) {
      const p = e.objectPosition(s.pick);
      if (p) await e.director.to({ target: p.setY(0.5), dist: 42, polar: 0.82 }, 1.6);
    }
    e.director.orbitSpeed = 0.05;
    const t0 = performance.now();
    while (performance.now() - t0 < SHOT && useMap.getState().tour.active) {
      await new Promise((r) => setTimeout(r, 100));
      useMap.getState().set({ tour: { ...useMap.getState().tour, progress: (performance.now() - t0) / SHOT } });
    }
  }
  e.director.orbitSpeed = 0;
  useMap.getState().set({ tour: { ...useMap.getState().tour, active: false } });
}

export function Rail({ onEdit }: { onEdit?: () => void }) {
  const snap = useMap((s) => s.snapshot);
  const editMode = useMap((s) => s.editMode);
  const icons: Record<string, string> = { bar: "cup", open_space: "users", studio: "target", reunion: "users", preparation: "box", stock: "layers", expedition: "truck", detente: "cup", reception: "truck" };
  const zones = (snap?.zones ?? []).filter((z) => icons[z.type]);
  return (
    <nav aria-label="Raccourcis d'espaces" className="pointer-events-auto flex flex-col items-center gap-1 rounded-2xl bg-brand-deep p-1.5 text-ground/80 shadow-xl">
      {zones.map((z) => (
        <button key={z.key} title={z.name} aria-label={z.name} onClick={() => engineRef.current?.selectPick(`zone:${z.key}`)} className="grid size-9 place-items-center rounded-xl hover:bg-white/10 hover:text-white">
          <Icon name={icons[z.type]} size={17} />
        </button>
      ))}
      <span className="my-1 h-px w-6 bg-white/15" />
      {snap?.me.editsPlan && (
        <button title="Modifier le plan" aria-label="Modifier le plan" aria-pressed={editMode} onClick={onEdit} className={`grid size-9 place-items-center rounded-xl ${editMode ? "bg-accent text-white" : "hover:bg-white/10 hover:text-white"}`}>
          <Icon name="edit" size={17} />
        </button>
      )}
      <Link href="/tech" title="Back-office (page technique)" aria-label="Back-office" className="grid size-9 place-items-center rounded-xl hover:bg-white/10 hover:text-white">
        <Icon name="layers" size={17} />
      </Link>
    </nav>
  );
}

export function Loading() {
  const loading = useMap((s) => s.loading);
  const [gone, setGone] = useState(false);
  useEffect(() => {
    if (loading.done) {
      const t = setTimeout(() => setGone(true), 700);
      return () => clearTimeout(t);
    }
  }, [loading.done]);
  if (gone) return null;
  return (
    <div className={`absolute inset-0 z-50 grid place-items-center bg-ground transition-opacity duration-700 ${loading.done ? "opacity-0" : "opacity-100"}`}>
      <div className="flex flex-col items-center gap-5">
        <div className="animate-[pulse_1.6s_ease-in-out_infinite]">
          <svg width={72} height={72} viewBox="0 0 40 40" aria-hidden>
            <rect width="40" height="40" rx="11" fill="var(--brand)" />
            <path d="M10 28V13l10 9 10-9v15" fill="none" stroke="var(--ground)" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" />
            <circle cx="31" cy="9.5" r="3" fill="var(--matcha)" />
          </svg>
        </div>
        <p className="text-sm font-medium text-muted">Ouverture de la Maison {sectorConfig.entreprise.nomCourt}…</p>
        <Bar value={loading.progress} tone="accent" className="w-56" />
      </div>
    </div>
  );
}
