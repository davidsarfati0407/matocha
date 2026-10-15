"use client";
/** Tableau de bord personnalisable : widgets à glisser-déposer, masquables ; ordre enregistré par utilisateur. */
import { useEffect, useState, type ReactNode } from "react";
import { Icon } from "@/components/map/hud/ui";
import { listViews, saveView, deleteView } from "@/app/(backoffice)/_actions/views";
import { toast } from "@/lib/ui/toast";

export interface Widget {
  id: string;
  title: string;
  span?: 1 | 2 | 3;
  node: ReactNode;
}

export function WidgetBoard({ widgets, storageKey }: { widgets: Widget[]; storageKey: string }) {
  const [order, setOrder] = useState<string[]>(widgets.map((w) => w.id));
  const [hidden, setHidden] = useState<string[]>([]);
  const [editing, setEditing] = useState(false);
  const [drag, setDrag] = useState<string | null>(null);
  const [viewId, setViewId] = useState<string | null>(null);

  useEffect(() => {
    void listViews(storageKey).then((v) => {
      const s = v[0];
      if (!s) return;
      setViewId(s.id);
      const f = (s.state.filters ?? {}) as Record<string, string>;
      if (f.order) setOrder([...f.order.split(","), ...widgets.map((w) => w.id).filter((id) => !f.order.split(",").includes(id))]);
      if (f.hidden) setHidden(f.hidden.split(",").filter(Boolean));
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  const persist = async (o: string[], h: string[]) => {
    if (viewId) await deleteView(viewId);
    const r = await saveView(storageKey, "Disposition", { filters: { order: o.join(","), hidden: h.join(",") } });
    if (r.ok) setViewId(r.id);
  };

  const byId = new Map(widgets.map((w) => [w.id, w]));
  const visible = order.map((id) => byId.get(id)).filter((w): w is Widget => Boolean(w) && (editing || !hidden.includes(w!.id)));

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button
          onClick={async () => {
            if (editing) {
              await persist(order, hidden);
              toast({ title: "Disposition enregistrée", tone: "ok" });
            }
            setEditing(!editing);
          }}
          className="inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-medium ring-1 ring-black/10 hover:bg-black/[0.03]"
        >
          <Icon name={editing ? "check" : "edit"} size={13} /> {editing ? "Terminer" : "Personnaliser"}
        </button>
      </div>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {visible.map((w) => (
          <div
            key={w.id}
            draggable={editing}
            onDragStart={() => setDrag(w.id)}
            onDragOver={(e) => editing && e.preventDefault()}
            onDrop={() => {
              if (!drag || drag === w.id) return;
              const o = order.filter((x) => x !== drag);
              o.splice(o.indexOf(w.id), 0, drag);
              setOrder(o);
              setDrag(null);
            }}
            className={`${w.span === 3 ? "lg:col-span-3" : w.span === 2 ? "lg:col-span-2" : ""} ${editing ? "cursor-move rounded-[18px] ring-2 ring-dashed ring-accent/40" : ""} ${hidden.includes(w.id) ? "opacity-40" : ""}`}
          >
            {editing && (
              <div className="flex items-center justify-between px-2 py-1 text-xs">
                <span className="font-medium">⠿ {w.title}</span>
                <button onClick={() => setHidden(hidden.includes(w.id) ? hidden.filter((x) => x !== w.id) : [...hidden, w.id])} className="text-accent">
                  {hidden.includes(w.id) ? "Afficher" : "Masquer"}
                </button>
              </div>
            )}
            {w.node}
          </div>
        ))}
      </div>
    </div>
  );
}
