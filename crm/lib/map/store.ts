"use client";
/** État de l'interface de la map (sélection, survol, notifications, visite…). */
import { create } from "zustand";
import type { RealtimeMode } from "./realtime";
import type { MapSnapshot } from "./snapshot";

export interface Selection {
  pickId: string;
  kind: string;
  entityType: string;
  entityId: string;
  label: string;
}

export interface Toast {
  id: string;
  title: string;
  detail?: string;
  pickId?: string;
  tone?: "info" | "ok" | "warn" | "accent";
  at: number;
}

export interface Notice extends Toast {
  read: boolean;
}

interface MapState {
  snapshot: MapSnapshot | null;
  selection: Selection | null;
  hovered: string | null;
  following: boolean;
  sheetOpen: boolean;
  searchOpen: boolean;
  zoneMenuOpen: boolean;
  bellOpen: boolean;
  tour: { active: boolean; index: number; total: number; title: string; progress: number };
  loading: { progress: number; done: boolean };
  realtime: RealtimeMode;
  toasts: Toast[];
  notices: Notice[];
  flash: Record<string, number>;
  editMode: boolean;
  engineReady: boolean;
  /** Objet du plan en cours d'édition (mode édition). */
  editTarget: string | null;
  transformMode: "translate" | "rotate";
  planDirty: boolean;
  /** Types d'événements dont la notification est déjà affichée par le scénario. */
  muted: Record<string, number>;
  mute: (types: string[], ms?: number) => void;
  setSnapshot: (s: MapSnapshot) => void;
  select: (s: Selection | null) => void;
  hover: (id: string | null) => void;
  set: (p: Partial<MapState>) => void;
  toast: (t: Omit<Toast, "id" | "at">) => void;
  dismissToast: (id: string) => void;
  flashKpi: (id: string) => void;
}

let n = 0;
export const useMap = create<MapState>((set, get) => ({
  snapshot: null,
  selection: null,
  hovered: null,
  following: false,
  sheetOpen: false,
  searchOpen: false,
  zoneMenuOpen: false,
  bellOpen: false,
  tour: { active: false, index: 0, total: 0, title: "", progress: 0 },
  loading: { progress: 0, done: false },
  realtime: "connexion",
  toasts: [],
  notices: [],
  flash: {},
  editMode: false,
  engineReady: false,
  editTarget: null,
  transformMode: "translate",
  planDirty: false,
  muted: {},
  mute: (types, ms = 6000) => set((s) => ({ muted: { ...s.muted, ...Object.fromEntries(types.map((t) => [t, Date.now() + ms])) } })),
  setSnapshot: (s) => {
    const prev = get().snapshot;
    if (prev)
      for (const [k, v] of Object.entries(s.kpis))
        if (JSON.stringify(prev.kpis[k]?.value) !== JSON.stringify(v.value)) get().flashKpi(k);
    set({ snapshot: s });
  },
  select: (selection) => set({ selection, following: false, sheetOpen: false }),
  hover: (hovered) => (get().hovered === hovered ? undefined : set({ hovered })),
  set: (p) => set(p),
  toast: (t) => {
    const toast = { ...t, id: `t${++n}`, at: Date.now() };
    set((s) => ({ toasts: [toast, ...s.toasts].slice(0, 3), notices: [{ ...toast, read: false }, ...s.notices].slice(0, 40) }));
    setTimeout(() => get().dismissToast(toast.id), 6000);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  flashKpi: (id) => set((s) => ({ flash: { ...s.flash, [id]: Date.now() } })),
}));
