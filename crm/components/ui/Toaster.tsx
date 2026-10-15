"use client";
import { useToasts } from "@/lib/ui/toast";
import { Icon } from "@/components/map/hud/ui";

export function Toaster() {
  const toasts = useToasts((s) => s.toasts);
  const dismiss = useToasts((s) => s.dismiss);
  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-4 right-4 z-[60] flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-2">
      {toasts.map((t) => (
        <div key={t.id} role="status" className="card pointer-events-auto flex animate-[toastin_.3s_ease-out] items-start gap-3 px-4 py-3">
          <span className={`mt-1.5 size-2 shrink-0 rounded-full ${t.tone === "danger" ? "bg-[#b3402a]" : t.tone === "warn" ? "bg-warn" : t.tone === "info" ? "bg-[#3D5A80]" : "bg-ok"}`} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">{t.title}</p>
            {t.detail && <p className="text-xs text-muted">{t.detail}</p>}
          </div>
          {t.undo && (
            <button
              onClick={async () => {
                dismiss(t.id);
                await t.undo!();
              }}
              className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-accent hover:bg-accent/10"
            >
              Annuler
            </button>
          )}
          <button aria-label="Fermer" onClick={() => dismiss(t.id)} className="shrink-0 text-muted hover:text-ink">
            <Icon name="x" size={14} />
          </button>
        </div>
      ))}
    </div>
  );
}
