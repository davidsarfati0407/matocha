"use client";
/** Tiroir latéral d'édition rapide (aria-modal, Échap pour fermer, focus initial). */
import { useEffect, useRef, type ReactNode } from "react";
import { Icon } from "@/components/map/hud/ui";

export function Drawer({ open, onClose, title, children, footer, width = 480 }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; width?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    ref.current?.querySelector<HTMLElement>("input, select, textarea, button")?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-ink/20 backdrop-blur-[1px]" onClick={onClose}>
      <div ref={ref} role="dialog" aria-modal aria-label={typeof title === "string" ? title : undefined} className="flex h-full max-w-full flex-col bg-white shadow-2xl animate-[toastin_.25s_ease-out]" style={{ width }} onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between gap-3 border-b border-black/5 px-5 py-4">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <button aria-label="Fermer" onClick={onClose} className="grid size-8 place-items-center rounded-full hover:bg-black/5">
            <Icon name="x" size={16} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-black/5 px-5 py-3">{footer}</footer>}
      </div>
    </div>
  );
}

export function Modal({ open, onClose, title, children, footer, width = 560 }: { open: boolean; onClose: () => void; title: ReactNode; children: ReactNode; footer?: ReactNode; width?: number }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-ink/25 p-4" onClick={onClose}>
      <div role="dialog" aria-modal aria-label={typeof title === "string" ? title : undefined} className="card flex max-h-[88vh] w-full flex-col overflow-hidden" style={{ maxWidth: width }} onClick={(e) => e.stopPropagation()}>
        <header className="flex items-center justify-between gap-3 border-b border-black/5 px-5 py-4">
          <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
          <button aria-label="Fermer" onClick={onClose} className="grid size-8 place-items-center rounded-full hover:bg-black/5">
            <Icon name="x" size={16} />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <footer className="flex justify-end gap-2 border-t border-black/5 px-5 py-3">{footer}</footer>}
      </div>
    </div>
  );
}
