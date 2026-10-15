import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Logo } from "@/components/ui/Logo";
import { sectorConfig } from "@/config/sector.config";
import { entityFromRoute, mapHref } from "@/lib/map/links";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Back-office" };

/**
 * Point d'arrivée des liens « Ouvrir dans le back-office » de la map.
 * Les modules complets arrivent en phase 3 ; cette page affiche déjà la fiche
 * brute (avec les droits de l'utilisateur) et le lien retour « Voir sur la map ».
 */
const TABLES: Record<string, string> = {
  employees: "employees",
  work_orders: "work_orders",
  clients: "clients",
  quotes: "quotes",
  invoices: "invoices",
  assets: "assets",
  lots: "lots",
  stock_items: "stock_items",
};
const HIDDEN = new Set(["org_id", "created_by", "appearance", "telemetry", "specs"]);

export default async function BackOfficeEntityPage({ params }: { params: Promise<{ module: string; entity: string; id: string }> }) {
  const { module, entity, id } = await params;
  const type = entityFromRoute(module, entity);
  if (!type) notFound();
  const site = sectorConfig.lieux[0].id;
  const supabase = await createClient();
  let row: Record<string, unknown> | null = null;
  let title = decodeURIComponent(id);
  if (type === "stock_rack") {
    const { data } = await supabase.from("stock_items").select("reference, name, quantity, min_quantity, location").like("location", `${id}%`).order("location");
    row = { rayonnage: id, references: (data ?? []).map((d) => `${d.location} · ${d.name} (${d.quantity}/${d.min_quantity})`).join("\n") };
    title = `Rayonnage ${id}`;
  } else if (type === "zones") {
    const { data } = await supabase.from("zones").select("key, code, name, type, capacity, description").eq("key", id).maybeSingle();
    row = data;
    title = data?.name ?? title;
  } else if (TABLES[type]) {
    const { data } = await supabase.from(TABLES[type]).select("*").eq("id", id).maybeSingle();
    row = data;
    title = (data?.number as string) ?? (data?.name as string) ?? (data?.first_name ? `${data.first_name} ${data.last_name}` : title);
  }
  const focusType = type === "stock_rack" ? "stock_rack" : type;
  const focusId = type === "stock_rack" ? `rack:${id}` : id;
  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-6 px-4 py-8">
      <header className="card flex flex-wrap items-center gap-4 px-5 py-4">
        <Logo />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            {module} · {entity}
          </p>
          <h1 className="truncate text-xl font-semibold tracking-tight">{title}</h1>
        </div>
        <Link href={mapHref(site, focusType, focusId)} className="rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white">
          Voir sur la map
        </Link>
      </header>
      <section className="card p-5">
        <p className="mb-4 rounded-xl bg-warn/12 px-3 py-2 text-sm text-[#8a5d08]">
          Module en cours de construction (phase 3). Données brutes lues avec vos droits :
        </p>
        {!row && <p className="text-sm text-muted">Aucune donnée visible avec votre rôle.</p>}
        {row && (
          <dl className="grid grid-cols-[minmax(140px,auto)_1fr] gap-x-6 gap-y-1.5 text-sm">
            {Object.entries(row)
              .filter(([k]) => !HIDDEN.has(k))
              .map(([k, v]) => (
                <div key={k} className="contents">
                  <dt className="text-muted">{k}</dt>
                  <dd className="whitespace-pre-wrap break-words font-mono text-[13px]">{v == null ? "—" : typeof v === "object" ? JSON.stringify(v) : String(v)}</dd>
                </div>
              ))}
          </dl>
        )}
      </section>
    </main>
  );
}
