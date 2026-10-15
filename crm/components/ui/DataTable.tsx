"use client";
/**
 * Liste générique : recherche, filtres par colonne, tri, sélection multiple,
 * actions groupées, vues enregistrées, export CSV (Excel) et .xlsx.
 */
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { toCsv } from "@/lib/domain/csv";
import { Icon } from "@/components/map/hud/ui";
import { deleteView, listViews, saveView, type ViewState } from "@/app/(backoffice)/_actions/views";
import { toast } from "@/lib/ui/toast";
import { Empty, btn } from "./kit";

export interface Column<T> {
  key: string;
  header: string;
  cell: (r: T) => ReactNode;
  /** Valeur brute pour le tri, la recherche et l'export. */
  value?: (r: T) => string | number | null | undefined;
  /** Filtre par liste de valeurs (dérivée des lignes). */
  filter?: boolean;
  align?: "left" | "right";
  className?: string;
  hideOnMobile?: boolean;
}

export interface BulkAction<T> {
  label: string;
  icon?: string;
  run: (rows: T[]) => Promise<unknown> | unknown;
  tone?: "accent" | "danger";
}

export function DataTable<T extends { id: string }>({
  rows,
  columns,
  href,
  module,
  exportName,
  bulk = [],
  empty,
  initialSort,
  toolbar,
  pageSize = 50,
}: {
  rows: T[];
  columns: Column<T>[];
  href?: (r: T) => string;
  module: string;
  exportName: string;
  bulk?: BulkAction<T>[];
  empty?: ReactNode;
  initialSort?: ViewState["sort"];
  toolbar?: ReactNode;
  pageSize?: number;
}) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [sort, setSort] = useState<ViewState["sort"]>(initialSort);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [views, setViews] = useState<{ id: string; name: string; state: ViewState }[]>([]);
  const [limit, setLimit] = useState(pageSize);

  useEffect(() => {
    void listViews(module).then(setViews);
  }, [module]);

  const val = (c: Column<T>, r: T) => {
    const v = c.value ? c.value(r) : (r as Record<string, unknown>)[c.key];
    return v == null ? "" : (v as string | number);
  };
  const norm = (s: unknown) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

  const filtered = useMemo(() => {
    const nq = norm(q.trim());
    let out = rows.filter((r) => {
      if (nq && !columns.some((c) => norm(val(c, r)).includes(nq))) return false;
      for (const [k, v] of Object.entries(filters)) {
        const c = columns.find((x) => x.key === k);
        if (c && v && String(val(c, r)) !== v) return false;
      }
      return true;
    });
    if (sort) {
      const c = columns.find((x) => x.key === sort.key);
      if (c)
        out = [...out].sort((a, b) => {
          const va = val(c, a);
          const vb = val(c, b);
          const cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb), "fr", { numeric: true });
          return sort.dir === "asc" ? cmp : -cmp;
        });
    }
    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, q, filters, sort, columns]);

  const options = (c: Column<T>) => [...new Set(rows.map((r) => String(val(c, r))).filter(Boolean))].sort((a, b) => a.localeCompare(b, "fr"));
  const selRows = filtered.filter((r) => selected.has(r.id));
  const allChecked = filtered.length > 0 && filtered.every((r) => selected.has(r.id));
  const exportCols = columns.map((c) => ({ header: c.header, value: (r: T) => val(c, r) }));

  const download = (blob: Blob, name: string) => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = name;
    a.click();
    URL.revokeObjectURL(a.href);
  };
  const exportCsv = () => download(new Blob([toCsv(selRows.length ? selRows : filtered, exportCols)], { type: "text/csv;charset=utf-8" }), `${exportName}.csv`);
  const exportXlsx = async () => {
    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(exportName.slice(0, 30));
    ws.addRow(exportCols.map((c) => c.header)).font = { bold: true };
    for (const r of selRows.length ? selRows : filtered) ws.addRow(exportCols.map((c) => c.value(r)));
    ws.columns.forEach((col) => (col.width = 18));
    download(new Blob([await wb.xlsx.writeBuffer()], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), `${exportName}.xlsx`);
  };
  const applyView = (s: ViewState) => {
    setQ(s.q ?? "");
    setFilters(s.filters ?? {});
    setSort(s.sort);
  };

  return (
    <div className="card overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-black/5 p-3">
        <label className="flex h-9 min-w-48 flex-1 items-center gap-2 rounded-xl bg-black/[0.03] px-3 text-sm ring-1 ring-black/5 focus-within:ring-accent/50 sm:max-w-xs">
          <Icon name="search" size={14} className="text-muted" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Rechercher…" aria-label="Rechercher dans la liste" className="min-w-0 flex-1 bg-transparent outline-none" />
        </label>
        {columns
          .filter((c) => c.filter)
          .map((c) => (
            <select key={c.key} aria-label={`Filtrer : ${c.header}`} value={filters[c.key] ?? ""} onChange={(e) => setFilters({ ...filters, [c.key]: e.target.value })} className="h-9 rounded-xl bg-white px-2 text-sm ring-1 ring-black/10">
              <option value="">{c.header} : tous</option>
              {options(c).map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ))}
        {(q || Object.values(filters).some(Boolean)) && (
          <button className={btn("ghost", "sm")} onClick={() => applyView({})}>
            Effacer
          </button>
        )}
        <div className="ml-auto flex items-center gap-2">
          {toolbar}
          <select
            aria-label="Vues enregistrées"
            className="h-9 rounded-xl bg-white px-2 text-sm ring-1 ring-black/10"
            value=""
            onChange={async (e) => {
              const v = e.target.value;
              if (v === "__save") {
                const name = window.prompt("Nom de la vue");
                if (!name) return;
                const r = await saveView(module, name, { q, filters, sort });
                if (r.ok) {
                  setViews(await listViews(module));
                  toast({ title: `Vue « ${name} » enregistrée`, tone: "ok" });
                }
              } else if (v.startsWith("del:")) {
                await deleteView(v.slice(4));
                setViews(await listViews(module));
              } else {
                const view = views.find((x) => x.id === v);
                if (view) applyView(view.state);
              }
            }}
          >
            <option value="">Vues…</option>
            {views.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
            <option value="__save">+ Enregistrer la vue actuelle</option>
            {views.map((v) => (
              <option key={`d${v.id}`} value={`del:${v.id}`}>
                Supprimer « {v.name} »
              </option>
            ))}
          </select>
          <button className={btn("secondary", "sm")} onClick={exportCsv} title="CSV lisible par Excel">
            <Icon name="download" size={14} /> CSV
          </button>
          <button className={btn("secondary", "sm")} onClick={() => void exportXlsx()}>
            <Icon name="download" size={14} /> Excel
          </button>
        </div>
      </div>
      {selRows.length > 0 && bulk.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-black/5 bg-accent/[0.06] px-3 py-2 text-sm">
          <span className="font-medium">{selRows.length} sélectionné(s)</span>
          {bulk.map((b) => (
            <button
              key={b.label}
              className={btn(b.tone === "danger" ? "danger" : "accent", "sm")}
              onClick={async () => {
                await b.run(selRows);
                setSelected(new Set());
                router.refresh();
              }}
            >
              {b.icon && <Icon name={b.icon} size={14} />}
              {b.label}
            </button>
          ))}
          <button className={btn("ghost", "sm")} onClick={() => setSelected(new Set())}>
            Désélectionner
          </button>
        </div>
      )}
      {filtered.length === 0 ? (
        empty ?? <Empty title="Aucun résultat" hint="Modifiez la recherche ou les filtres." icon="search" />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-black/[0.02] text-left text-[12px] text-muted">
              <tr>
                {bulk.length > 0 && (
                  <th className="w-10 px-3 py-2">
                    <input type="checkbox" aria-label="Tout sélectionner" checked={allChecked} onChange={() => setSelected(allChecked ? new Set() : new Set(filtered.map((r) => r.id)))} className="accent-[var(--accent)]" />
                  </th>
                )}
                {columns.map((c) => (
                  <th key={c.key} className={`px-3 py-2 font-medium ${c.align === "right" ? "text-right" : ""} ${c.hideOnMobile ? "hidden md:table-cell" : ""}`} aria-sort={sort?.key === c.key ? (sort.dir === "asc" ? "ascending" : "descending") : undefined}>
                    <button className="inline-flex items-center gap-1 hover:text-ink" onClick={() => setSort(sort?.key === c.key && sort.dir === "asc" ? { key: c.key, dir: "desc" } : { key: c.key, dir: "asc" })}>
                      {c.header}
                      {sort?.key === c.key && <span aria-hidden>{sort.dir === "asc" ? "↑" : "↓"}</span>}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, limit).map((r) => (
                <tr key={r.id} className={`border-t border-black/5 ${href ? "cursor-pointer hover:bg-black/[0.02]" : ""} ${selected.has(r.id) ? "bg-accent/[0.04]" : ""}`} onClick={(e) => href && !(e.target as HTMLElement).closest("a,button,input,select") && router.push(href(r))}>
                  {bulk.length > 0 && (
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        aria-label="Sélectionner la ligne"
                        checked={selected.has(r.id)}
                        onChange={() => {
                          const s = new Set(selected);
                          if (s.has(r.id)) s.delete(r.id);
                          else s.add(r.id);
                          setSelected(s);
                        }}
                        className="accent-[var(--accent)]"
                      />
                    </td>
                  )}
                  {columns.map((c, i) => (
                    <td key={c.key} className={`px-3 py-2 ${c.align === "right" ? "text-right tabular-nums" : ""} ${c.hideOnMobile ? "hidden md:table-cell" : ""} ${c.className ?? ""}`}>
                      {i === 0 && href ? (
                        <Link href={href(r)} className="font-medium hover:text-accent">
                          {c.cell(r)}
                        </Link>
                      ) : (
                        c.cell(r)
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <footer className="flex items-center justify-between border-t border-black/5 px-3 py-2 text-xs text-muted">
        <span>
          {filtered.length} ligne(s){rows.length !== filtered.length ? ` sur ${rows.length}` : ""}
        </span>
        {filtered.length > limit && (
          <button className={btn("ghost", "sm")} onClick={() => setLimit(limit + pageSize)}>
            Afficher plus
          </button>
        )}
      </footer>
    </div>
  );
}
