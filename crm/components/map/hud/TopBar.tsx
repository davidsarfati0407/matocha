"use client";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Logo } from "@/components/ui/Logo";
import { sectorConfig } from "@/config/sector.config";
import { formatTime } from "@/lib/format";
import { useMap } from "@/lib/map/store";
import { engineRef } from "../engine/engine";
import { useNow } from "./DetailPanel";
import { Bar, Icon, panel } from "./ui";

/** Barre supérieure pleine largeur : marque, recherche, sélecteur d'espace, Live, cloche, utilisateur. */
export function TopBar() {
  const snap = useMap((s) => s.snapshot);
  return (
    <div className={`${panel} pointer-events-auto flex h-14 items-center gap-3 px-3`}>
      <Logo size={34} />
      <div className="hidden min-w-0 leading-tight sm:block">
        <p className="truncate text-[15px] font-semibold tracking-tight">{snap?.site.name ?? sectorConfig.entreprise.nomCourt}</p>
        <p className="truncate text-[10px] font-medium uppercase tracking-wider text-muted">{sectorConfig.entreprise.nomCourt} · Montreuil · démo</p>
      </div>
      <Search />
      <div className="ml-auto flex items-center gap-2">
        <ZoneSelector />
        <LiveClock />
        <Bell />
        <UserMenu />
      </div>
    </div>
  );
}

type Result = { group: string; label: string; sub: string; entityType: string; entityId: string };

function Search() {
  const open = useMap((s) => s.searchOpen);
  const set = useMap((s) => s.set);
  const snap = useMap((s) => s.snapshot);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (open) input.current?.focus();
  }, [open]);

  const results = useMemo<Result[]>(() => {
    if (!snap || q.trim().length < 1) return [];
    const n = q.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const has = (...parts: (string | null | undefined)[]) => parts.some((p) => p?.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").includes(n));
    const out: Result[] = [];
    for (const e of snap.employees) if (has(e.firstName, e.lastName, `${e.firstName} ${e.lastName}`, e.jobTitle)) out.push({ group: "Personnes", label: `${e.firstName} ${e.lastName}`, sub: e.jobTitle, entityType: "employees", entityId: e.id });
    for (const w of snap.workOrders) if (has(w.number, w.clientName, w.title)) out.push({ group: sectorConfig.objetMetierCentral.nomPluriel, label: `${w.number} · ${w.clientName}`, sub: w.title, entityType: "work_orders", entityId: w.id });
    const clients = new Map(snap.workOrders.map((w) => [w.clientId, w.clientName]));
    for (const [id, name] of clients) if (has(name)) out.push({ group: "Comptes", label: name ?? "", sub: "Compte pro", entityType: "clients", entityId: id });
    for (const a of snap.assets) if (has(a.name, a.key, String(a.specs.plaque ?? ""))) out.push({ group: "Équipements", label: a.name, sub: a.type.replace("_", " "), entityType: "assets", entityId: a.id });
    for (const z of snap.zones) if (has(z.name, z.code)) out.push({ group: "Espaces", label: z.name, sub: z.code, entityType: "zones", entityId: z.key });
    for (const s of snap.stock) if (has(s.name, s.reference)) out.push({ group: "Stock", label: s.name, sub: `${s.reference} · ${s.location}`, entityType: "stock_items", entityId: s.id });
    for (const l of snap.lots) if (has(l.number)) out.push({ group: "Lots", label: `Lot ${l.number}`, sub: l.status, entityType: "lots", entityId: l.id });
    return out.slice(0, 24);
  }, [q, snap]);

  const go = (r: Result) => {
    const id = engineRef.current?.resolve(r.entityType, r.entityId);
    if (id) engineRef.current?.selectPick(id);
    else useMap.getState().toast({ title: r.label, detail: "Pas de présence physique sur la map en ce moment.", tone: "info" });
    set({ searchOpen: false });
    setQ("");
  };

  return (
    <div className="relative min-w-0 flex-1 sm:max-w-md">
      <label className="flex h-9 items-center gap-2 rounded-xl bg-black/[0.04] px-3 text-sm ring-1 ring-black/5 focus-within:ring-accent/50">
        <Icon name="search" size={15} className="text-muted" />
        <input
          ref={input}
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(0);
            set({ searchOpen: true });
          }}
          onFocus={() => set({ searchOpen: true })}
          onBlur={() => setTimeout(() => set({ searchOpen: false }), 150)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") setActive((a) => Math.min(results.length - 1, a + 1));
            if (e.key === "ArrowUp") setActive((a) => Math.max(0, a - 1));
            if (e.key === "Enter" && results[active]) go(results[active]);
            if (e.key === "Escape") (e.target as HTMLInputElement).blur();
          }}
          placeholder="Rechercher personnes, commandes, comptes, équipements…"
          aria-label="Recherche globale"
          role="combobox"
          aria-expanded={open && results.length > 0}
          aria-controls="search-results"
          className="min-w-0 flex-1 bg-transparent outline-none placeholder:text-muted/80"
        />
        <kbd className="rounded-md bg-white px-1.5 text-[10px] text-muted ring-1 ring-black/10">/</kbd>
      </label>
      {open && results.length > 0 && (
        <ul id="search-results" role="listbox" className={`${panel} absolute left-0 right-0 top-11 z-30 max-h-[60vh] overflow-y-auto p-1.5`}>
          {results.map((r, i) => (
            <li key={`${r.entityType}:${r.entityId}`}>
              {(i === 0 || results[i - 1].group !== r.group) && <p className="px-2 pb-1 pt-2 text-[10px] font-semibold uppercase tracking-wider text-muted">{r.group}</p>}
              <button role="option" aria-selected={i === active} onMouseDown={(e) => e.preventDefault()} onClick={() => go(r)} onMouseEnter={() => setActive(i)} className={`flex w-full items-center justify-between gap-2 rounded-lg px-2 py-1.5 text-left text-sm ${i === active ? "bg-accent/10" : ""}`}>
                <span className="truncate font-medium">{r.label}</span>
                <span className="truncate text-xs text-muted">{r.sub}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ZoneSelector() {
  const snap = useMap((s) => s.snapshot);
  const open = useMap((s) => s.zoneMenuOpen);
  const set = useMap((s) => s.set);
  const zones = (snap?.zones ?? []).filter((z) => z.type !== "exterieur" || /cour/.test(z.key));
  const present = snap?.employees.filter((e) => !["absent", "teletravail", "deplacement", "pas_badge", "parti"].includes(e.status)).length ?? 0;
  const occupancy = (key: string) => {
    const sim = engineRef.current?.sim;
    if (!sim || !snap) return 0;
    return snap.employees.filter((e) => {
      const a = sim.agentByEmployee(e.id);
      return a?.onSite && sim.zoneAt(a.pos) === key;
    }).length;
  };
  return (
    <div className="relative hidden md:block">
      <button onClick={() => set({ zoneMenuOpen: !open })} aria-expanded={open} className="flex h-10 items-center gap-2 rounded-xl px-2 ring-1 ring-black/10 hover:bg-black/[0.03]">
        <span className="grid h-7 place-items-center rounded-lg bg-accent px-2 text-[10px] font-bold text-white">ALL</span>
        <span className="text-left leading-tight">
          <span className="block text-[13px] font-semibold">Vue d’ensemble</span>
          <span className="block text-[10px] text-muted">
            {present}/{snap?.employees.length ?? 0} présents · {zones.length} espaces
          </span>
        </span>
        <Icon name="down" size={14} className="text-muted" />
      </button>
      {open && (
        <div className={`${panel} absolute right-0 top-12 z-30 max-h-[70vh] w-80 overflow-y-auto p-1.5`}>
          <button
            className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm hover:bg-black/[0.04]"
            onClick={() => {
              void engineRef.current?.director.home();
              set({ zoneMenuOpen: false });
            }}
          >
            <span className="grid h-6 w-9 place-items-center rounded-md bg-accent text-[10px] font-bold text-white">ALL</span> Vue d’ensemble
          </button>
          {zones.map((z) => {
            const occ = occupancy(z.key);
            return (
              <button
                key={z.key}
                className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left hover:bg-black/[0.04]"
                onClick={() => {
                  engineRef.current?.selectPick(`zone:${z.key}`);
                  set({ zoneMenuOpen: false });
                }}
              >
                <span className="grid h-6 w-9 shrink-0 place-items-center rounded-md bg-brand/10 font-mono text-[10px] font-bold text-brand">{z.code}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium">{z.name}</span>
                  <span className="block truncate text-[10px] text-muted">{z.description}</span>
                </span>
                <span className="w-14 shrink-0 text-right">
                  <span className="block text-[11px] text-muted">
                    {occ}/{z.capacity || "—"}
                  </span>
                  <Bar value={z.capacity ? occ / z.capacity : 0} tone={z.capacity && occ / z.capacity > 0.8 ? "accent" : "ok"} />
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function LiveClock() {
  const now = useNow(1000);
  const mode = useMap((s) => s.realtime);
  const title = mode === "temps_reel" ? "Temps réel Supabase" : mode === "sondage" ? "Mode simulé du temps réel : sondage toutes les secondes (pas de serveur Realtime local)" : "Connexion…";
  return (
    <div title={title} className="flex h-9 items-center gap-2 rounded-xl bg-ok/10 px-3 text-[13px] font-semibold text-ok">
      <span className="relative flex size-2">
        <span className="absolute inline-flex size-full animate-ping rounded-full bg-ok opacity-60" />
        <span className="relative inline-flex size-2 rounded-full bg-ok" />
      </span>
      Live {formatTime(new Date(now))}
      {mode === "sondage" && <span className="rounded bg-warn/20 px-1 text-[9px] font-semibold uppercase text-[#8a5d08]">sondage</span>}
    </div>
  );
}

function Bell() {
  const notices = useMap((s) => s.notices);
  const open = useMap((s) => s.bellOpen);
  const set = useMap((s) => s.set);
  const unread = notices.filter((n) => !n.read).length;
  return (
    <div className="relative">
      <button
        aria-label={`Notifications (${unread} non lues)`}
        onClick={() => set({ bellOpen: !open, notices: notices.map((n) => ({ ...n, read: true })) })}
        className="relative grid size-9 place-items-center rounded-xl ring-1 ring-black/10 hover:bg-black/[0.03]"
      >
        <Icon name="bell" size={17} />
        {unread > 0 && <span key={unread} className="absolute -right-1 -top-1 grid min-w-4 animate-[pop_.3s_ease-out] place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-white">{unread}</span>}
      </button>
      {open && (
        <div className={`${panel} absolute right-0 top-11 z-30 max-h-[60vh] w-80 overflow-y-auto p-1.5`}>
          {notices.length === 0 && <p className="p-3 text-sm text-muted">Aucune notification.</p>}
          {notices.map((n) => (
            <button
              key={n.id}
              onClick={() => {
                if (n.pickId) engineRef.current?.selectPick(n.pickId);
                set({ bellOpen: false });
              }}
              className="block w-full rounded-lg px-2.5 py-2 text-left hover:bg-black/[0.04]"
            >
              <span className="flex justify-between gap-2 text-[13px] font-medium">
                {n.title}
                <span className="shrink-0 text-[10px] text-muted">{formatTime(new Date(n.at))}</span>
              </span>
              {n.detail && <span className="line-clamp-2 text-xs text-muted">{n.detail}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function UserMenu() {
  const me = useMap((s) => s.snapshot?.me);
  const [open, setOpen] = useState(false);
  if (!me) return null;
  const initials = me.fullName.split(" ").map((p) => p[0]).slice(0, 2).join("");
  return (
    <div className="relative">
      <button onClick={() => setOpen(!open)} className="flex items-center gap-2 rounded-xl py-1 pl-1 pr-2 hover:bg-black/[0.03]" aria-expanded={open}>
        <span className="grid size-8 place-items-center rounded-full bg-ink text-xs font-semibold text-white">{initials}</span>
        <span className="hidden text-left leading-tight lg:block">
          <span className="block text-[13px] font-semibold">{me.fullName}</span>
          <span className="block text-[10px] text-muted">{me.roleLabel}</span>
        </span>
        <Icon name="down" size={14} className="text-muted" />
      </button>
      {open && (
        <div className={`${panel} absolute right-0 top-11 z-30 w-56 p-1.5 text-sm`}>
          <Link href="/tech" className="block rounded-lg px-2.5 py-2 hover:bg-black/[0.04]">
            Page technique
          </Link>
          <form action="/auth/signout" method="post">
            <button className="w-full rounded-lg px-2.5 py-2 text-left hover:bg-black/[0.04]">Se déconnecter</button>
          </form>
        </div>
      )}
    </div>
  );
}
