"use client";
/** Notifications de confirmation (6 s), avec action « Annuler » optionnelle. */
import { create } from "zustand";

export interface UiToast {
  id: number;
  title: string;
  detail?: string;
  tone?: "ok" | "warn" | "danger" | "info";
  undo?: () => unknown;
}
interface S {
  toasts: UiToast[];
  push: (t: Omit<UiToast, "id">) => void;
  dismiss: (id: number) => void;
}
let n = 0;
export const useToasts = create<S>((set, get) => ({
  toasts: [],
  push: (t) => {
    const toast = { ...t, id: ++n };
    set({ toasts: [...get().toasts.slice(-3), toast] });
    setTimeout(() => get().dismiss(toast.id), t.undo ? 8000 : 6000);
  },
  dismiss: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),
}));
export const toast = (t: Omit<UiToast, "id">) => useToasts.getState().push(t);

import type { ActionResult } from "@/lib/backoffice/result";
export type { ActionResult };

/** Affiche le résultat d'une action (succès ou erreur). */
export function report(r: ActionResult, opts: { undo?: () => unknown; success?: string } = {}) {
  // Titres « ui.* » : clés traduites à l'affichage par le Toaster
  if (r.ok) toast({ title: r.message ?? opts.success ?? "ui.saved", tone: "ok", undo: opts.undo });
  else toast({ title: "ui.actionImpossible", detail: r.error, tone: "danger" });
  return r.ok;
}
