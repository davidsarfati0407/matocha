"use client";
/**
 * Map vivante : compose la scène 3D et le HUD, branche le flux d'événements
 * (temps réel ou sondage), rafraîchit l'instantané de données et lance le
 * scénario de démonstration.
 */
import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import * as THREE from "three";
import { sectorConfig } from "@/config/sector.config";
import { formatTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/client";
import { subscribeActivity, type ActivityEvent } from "@/lib/map/realtime";
import { Scenario, type Translate } from "@/lib/map/scenario";
import { loadSnapshot, type MapSnapshot } from "@/lib/map/snapshot";
import { assignAsset } from "@/app/(map)/map/actions";
import { ASSET_DRAG } from "./hud/DetailPanel";
import { useMap } from "@/lib/map/store";
import type { LabelRefs, MapEngine } from "./engine/engine";
import { engineRef } from "./engine/engine";
import { DetailPanel } from "./hud/DetailPanel";
import { FullSheet } from "./hud/FullSheet";
import { TopBar } from "./hud/TopBar";
import { CameraButtons, Kpis, LiveTable, Loading, Rail, Toasts, TourBar, WorkOrderDock, startTour } from "./hud/Widgets";
import { PlanEditor } from "./editor/PlanEditor";

const Scene = dynamic(() => import("./Scene"), { ssr: false });

const STORAGE = (site: string) => `map:view:${site}`;

export default function MapApp({ initial, focus }: { initial: MapSnapshot; focus?: string }) {
  const supabase = useMemo(() => createClient(), []);
  const hoverRef = useRef<HTMLDivElement>(null);
  const selectRef = useRef<HTMLDivElement>(null);
  const labels = useRef<LabelRefs>({ hover: null, select: null });
  const scenario = useRef<Scenario | null>(null);
  const refreshing = useRef<Promise<void> | null>(null);
  const pending = useRef(false);
  const editMode = useMap((s) => s.editMode);
  const hovered = useMap((s) => s.hovered);
  const selection = useMap((s) => s.selection);
  const t = useTranslations("map");
  const tStatus = useTranslations("status");
  // Traducteur lu par les rappels hors rendu (flux d'événements, scénario, raccourcis)
  const tRef = useRef<Translate>((k) => k);

  useEffect(() => {
    tRef.current = (key, values) => t(key, values);
  }, [t]);

  useEffect(() => {
    labels.current.hover = hoverRef.current;
    labels.current.select = selectRef.current;
  });

  useEffect(() => {
    useMap.getState().setSnapshot(initial);
    useMap.getState().set({ loading: { progress: 0.35, done: false } });
  }, [initial]);

  /** Rafraîchit l'instantané (coalescé : un seul en vol, un seul en attente). */
  const refresh = useCallback(async () => {
    if (refreshing.current) {
      pending.current = true;
      return refreshing.current;
    }
    refreshing.current = (async () => {
      do {
        pending.current = false;
        const s = await loadSnapshot(supabase, initial.site.slug, { planId: useMap.getState().snapshot?.plan.id });
        if (s) {
          useMap.getState().setSnapshot(s);
          engineRef.current?.reconcile(s);
        }
      } while (pending.current);
    })();
    try {
      await refreshing.current;
    } finally {
      refreshing.current = null;
    }
  }, [supabase, initial.site.slug]);

  // Flux d'événements → notification + rafraîchissement
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    let lastShopToast = 0;
    const onEvent = (e: ActivityEvent) => {
      const st = useMap.getState();
      const toast = toastFor(e, st.snapshot, tRef.current);
      const muted = st.muted[e.type] ?? 0;
      if (toast && muted < Date.now()) {
        if (e.type.startsWith("shop_order.")) {
          if (Date.now() - lastShopToast > 8000) {
            lastShopToast = Date.now();
            st.toast(toast);
          }
        } else st.toast(toast);
      }
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => void refresh(), 200);
    };
    const stop = subscribeActivity(supabase, initial.org.id, onEvent, (m) => useMap.getState().set({ realtime: m }));
    return () => {
      stop();
      if (timer) clearTimeout(timer);
    };
  }, [supabase, initial.org.id, refresh]);

  const onReady = useCallback(
    async (engine: MapEngine) => {
      useMap.getState().set({ loading: { progress: 0.8, done: false } });
      engine.reconcile(useMap.getState().snapshot ?? initial, true);
      await new Promise((r) => setTimeout(r, 250));
      useMap.getState().set({ loading: { progress: 1, done: true }, engineReady: true });
      const saved = readView(initial.site.slug);
      if (saved && !focus) {
        engine.director.apply({ target: new THREE.Vector3(...saved.target), dist: saved.dist, polar: saved.polar, az: saved.az });
        if (saved.pick) engine.selectPick(saved.pick, false);
      } else await engine.director.intro();
      if (focus) {
        const [type, ...rest] = focus.split(":");
        const pick = engine.resolve(type, rest.join(":"));
        if (pick) engine.selectPick(pick);
        else useMap.getState().toast({ title: tRef.current("app.notFoundTitle"), detail: tRef.current("app.notFoundDetail"), tone: "warn" });
      }
      if (initial.org.demoMode && initial.org.settings.demo_autoplay !== false && !saved) {
        scenario.current = new Scenario(engine, refresh, (key, values) => tRef.current(key, values));
        void scenario.current.start();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  // Continuité : on mémorise caméra et sélection en quittant la map
  useEffect(() => {
    const save = () => {
      const e = engineRef.current;
      if (!e) return;
      const c = e.director.current();
      try {
        sessionStorage.setItem(STORAGE(initial.site.slug), JSON.stringify({ target: c.target.toArray(), dist: c.dist, polar: c.polar, az: c.az, pick: useMap.getState().selection?.pickId ?? null }));
      } catch {
        /* stockage indisponible : pas de continuité, sans conséquence */
      }
    };
    window.addEventListener("pagehide", save);
    return () => {
      save();
      window.removeEventListener("pagehide", save);
      scenario.current?.stop();
    };
  }, [initial.site.slug]);

  // Raccourcis clavier : / recherche, T visite, H vue d'ensemble, Échap
  useEffect(() => {
    const onKey = (ev: KeyboardEvent) => {
      const typing = (ev.target as HTMLElement)?.closest("input, textarea, [contenteditable]");
      const st = useMap.getState();
      if (ev.key === "Escape") {
        if (st.sheetOpen) st.set({ sheetOpen: false });
        else if (st.tour.active) st.set({ tour: { ...st.tour, active: false } });
        else if (st.zoneMenuOpen || st.bellOpen) st.set({ zoneMenuOpen: false, bellOpen: false });
        else engineRef.current?.selectPick(null, false);
        return;
      }
      if (typing || ev.metaKey || ev.ctrlKey || ev.altKey) return;
      if (ev.key === "/") {
        ev.preventDefault();
        (document.getElementById("map-search") as HTMLInputElement | null)?.focus();
      } else if (ev.key.toLowerCase() === "t") void startTour(tRef.current);
      else if (ev.key.toLowerCase() === "h") void engineRef.current?.director.home();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Clic sur un lien interne : on fige le rendu pour que la transition vers le back-office soit fluide
  useEffect(() => {
    const onClick = (ev: MouseEvent) => {
      if (ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
      const a = (ev.target as HTMLElement | null)?.closest?.("a[href^='/']") as HTMLAnchorElement | null;
      if (a && !a.target && !a.getAttribute("href")?.startsWith("/map/")) useMap.getState().set({ leaving: true });
    };
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      useMap.getState().set({ leaving: false });
    };
  }, []);

  // La scène WebGL se monte juste après la transition d'arrivée : la mise à jour du DOM reste
  // légère (sinon le navigateur abandonne la transition sur une machine lente).
  const [show3d, setShow3d] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setShow3d(true)));
    return () => cancelAnimationFrame(id);
  }, []);

  /** Glisser-déposer d'un véhicule (puce de la fiche) sur une personne de la map → affectation en base. */
  const pickUnder = (ev: React.DragEvent) => {
    const r = (ev.currentTarget as HTMLElement).getBoundingClientRect();
    const ndc = new THREE.Vector2(((ev.clientX - r.left) / r.width) * 2 - 1, -((ev.clientY - r.top) / r.height) * 2 + 1);
    return engineRef.current?.pickAt(ndc) ?? null;
  };
  const onAssetDragOver = (ev: React.DragEvent) => {
    if (!ev.dataTransfer.types.includes(ASSET_DRAG)) return;
    ev.preventDefault();
    const p = pickUnder(ev);
    ev.dataTransfer.dropEffect = p?.entityType === "employees" ? "link" : "none";
    engineRef.current?.setHover(p?.entityType === "employees" ? p : null);
  };
  const onAssetDrop = (ev: React.DragEvent) => {
    const assetId = ev.dataTransfer.getData(ASSET_DRAG);
    if (!assetId) return;
    ev.preventDefault();
    const p = pickUnder(ev);
    engineRef.current?.setHover(null);
    if (p?.entityType !== "employees") return useMap.getState().toast({ title: t("app.dropOnPerson"), tone: "warn" });
    void assignAsset(assetId, p.entityId).then((r) => useMap.getState().toast(r.ok ? { title: r.message ?? t("app.assigned"), detail: p.label, tone: "ok" } : { title: t("app.assignRefused"), detail: r.error, tone: "warn" }));
  };

  const hoverLabel = hovered && hovered !== selection?.pickId ? engineRef.current?.world.pickables.get(hovered) : null;
  const hoverStatus = hoverLabel?.kind === "person" ? statusLabel(useMap.getState().snapshot, hoverLabel.entityId, tStatus) : "";

  return (
    <main className="relative h-dvh w-full overflow-hidden bg-ground" onDragOver={onAssetDragOver} onDrop={onAssetDrop}>
      {show3d && <Scene layout={initial.plan.layout} labels={labels} onReady={onReady} />}

      {/* Étiquettes projetées (HTML), repositionnées à chaque image par le moteur */}
      <div className="pointer-events-none absolute inset-0 z-10 overflow-hidden">
        <div ref={hoverRef} className="absolute left-0 top-0 whitespace-nowrap rounded-full bg-white px-2.5 py-1 text-[12px] font-medium opacity-0 shadow-lg ring-1 ring-black/5">
          {hoverLabel?.label}
          {hoverStatus && <span className="text-muted"> · {hoverStatus}</span>}
        </div>
        <div ref={selectRef} className="absolute left-0 top-0 opacity-0">
          {selection && (
            <div className="flex flex-col items-center">
              <span className="flex items-center gap-0 overflow-hidden rounded-md bg-accent text-[12px] font-semibold text-white shadow-lg">
                <span className="px-2 py-1">{selection.label}</span>
                <SelectionStatus />
              </span>
              <span className="size-0 border-x-[6px] border-t-[7px] border-x-transparent border-t-accent" />
            </div>
          )}
        </div>
      </div>

      {/* HUD hybride */}
      <div className="pointer-events-none absolute inset-0 z-20 flex flex-col gap-3 p-3">
        <TopBar />
        <div className="flex min-h-0 flex-1 gap-3">
          <div className="flex flex-col justify-center">
            <Rail onEdit={() => useMap.getState().set({ editMode: !useMap.getState().editMode, selection: null })} />
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-3">
            {!editMode && <Kpis />}
            <Toasts />
            <div className="flex-1" />
            {!editMode && (
              <div className="flex items-end justify-between gap-3">
                <div className="flex flex-col items-start gap-2">
                  <TourBar />
                  <WorkOrderDock />
                </div>
              </div>
            )}
          </div>
          <div className="flex min-h-0 flex-col items-end gap-3">
            <div className="flex min-h-0 flex-1 items-start gap-3">
              <CameraButtons />
              {editMode ? <PlanEditor /> : <DetailPanel />}
            </div>
            {!editMode && (
              <div className="h-[230px] shrink-0">
                <LiveTable />
              </div>
            )}
          </div>
        </div>
      </div>
      <FullSheet />
      <Loading />
      <p className="sr-only" aria-live="polite">
        {selection ? t("app.selection", { label: selection.label }) : ""}
      </p>
      <span className="pointer-events-none absolute bottom-1 left-1/2 z-20 -translate-x-1/2 text-[10px] text-muted/70">{sectorConfig.entreprise.statutDemo}</span>
    </main>
  );
}

function SelectionStatus() {
  const sel = useMap((s) => s.selection);
  const snap = useMap((s) => s.snapshot);
  const tStatus = useTranslations("status");
  if (!sel || !snap) return null;
  let status = "";
  if (sel.entityType === "employees") status = statusLabel(snap, sel.entityId, tStatus);
  if (sel.entityType === "work_orders") {
    const w = snap.workOrders.find((x) => x.id === sel.entityId);
    status = w ? sectorConfig.objetMetierCentral.etapes.find((s) => s.id === w.stage)?.libelle ?? "" : "";
  }
  if (sel.entityType === "lots") status = snap.lots.find((l) => l.id === sel.entityId)?.status ?? "";
  if (!status) return null;
  return <span className="bg-black/15 px-2 py-1">{status}</span>;
}

/** Libellé de présence traduit (status.presence.*), ou la valeur brute si inconnue. */
function statusLabel(s: MapSnapshot | null, id: string, tStatus: ReturnType<typeof useTranslations<"status">>) {
  const e = s?.employees.find((x) => x.id === id);
  return e ? (tStatus.has(`presence.${e.status}`) ? tStatus(`presence.${e.status}`) : e.status) : "";
}

/** Notification d'un événement du flux ; le traducteur (espace « map ») est passé par l'appelant. */
function toastFor(e: ActivityEvent, s: MapSnapshot | null, t: Translate): { title: string; detail?: string; pickId?: string; tone?: "info" | "ok" | "warn" | "accent" } | null {
  const emp = s?.employees.find((x) => x.id === e.entity_id);
  const name = emp ? `${emp.firstName} ${emp.lastName}` : t("toast.someone");
  const p = e.payload as Record<string, string | number>;
  const time = formatTime(e.at);
  switch (e.type) {
    case "badge.in":
      return { title: t("toast.badgeIn", { name }), detail: t("toast.badgeAt", { time }), pickId: `person:${e.entity_id}`, tone: "ok" };
    case "badge.out":
      return { title: t("toast.badgeOut", { name }), detail: t("toast.badgeOutAt", { time }), tone: "info" };
    case "badge.pause_start":
      return { title: t("toast.pauseStart", { name }), detail: t("toast.badgeAt", { time }), pickId: `person:${e.entity_id}`, tone: "warn" };
    case "work_order.stage": {
      const label = sectorConfig.objetMetierCentral.etapes.find((x) => x.id === p.to)?.libelle ?? p.to;
      return { title: `${p.number} → ${label}`, pickId: `wo:${e.entity_id}`, tone: "accent" };
    }
    case "work_order.created":
      return { title: t("toast.workOrderCreated", { object: sectorConfig.objetMetierCentral.nom, number: String(p.number) }), tone: "accent" };
    case "quote.accepted":
      return { title: t("toast.quoteAccepted"), tone: "ok" };
    case "lot.quarantaine":
      return { title: t("toast.lotQuarantine"), pickId: `lot:${e.entity_id}`, tone: "warn" };
    case "lot.libere":
      return { title: t("toast.lotReleased"), tone: "ok" };
    case "expedition.pickup":
      return { title: t("toast.pickup"), detail: t("toast.pickupDetail", { orders: Number(p.orders), workOrders: Number(p.work_orders) }), tone: "ok" };
    case "notification.ambient":
      return { title: String(p.title), tone: "info" };
    case "shop_order.payee":
      return { title: t("toast.shopOrder"), detail: t("toast.shopOrderDetail"), tone: "info" };
    case "leave.approved":
      return { title: t("toast.leaveApproved"), tone: "ok" };
    case "invoice.paid":
      return { title: t("toast.invoicePaid"), tone: "ok" };
    case "room.insert": {
      const a = s?.assets.find((x) => x.id === e.entity_id);
      return { title: t("toast.roomBooked", { room: a?.name ?? t("toast.room") }), detail: `${p.title} · ${formatTime(String(p.starts_at))}–${formatTime(String(p.ends_at))}`, tone: "info" };
    }
    case "room.delete": {
      const a = s?.assets.find((x) => x.id === e.entity_id);
      return { title: t("toast.roomReleased", { room: a?.name ?? t("toast.room") }), tone: "info" };
    }
    case "asset.assigned": {
      const who = s?.employees.find((x) => x.id === p.employee_id);
      return { title: t("toast.assetAssigned", { name: String(p.name) }), detail: who ? t("toast.assetAssignedTo", { name: `${who.firstName} ${who.lastName}` }) : t("toast.assignmentRemoved"), tone: "accent" };
    }
    case "stock.entree":
      return { title: t("toast.stockIn"), detail: String(p.reason ?? ""), tone: "ok" };
    default:
      return null;
  }
}

function readView(site: string): { target: [number, number, number]; dist: number; polar: number; az: number; pick: string | null } | null {
  try {
    const raw = sessionStorage.getItem(STORAGE(site));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}
