import type { Metadata } from "next";
import { Denied, PageHeader, Stat } from "@/components/ui/kit";
import { requirePerm } from "@/lib/backoffice/context";
import { formatMoney, formatNumber } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { ShopOrdersTable } from "./table";

export const metadata: Metadata = { title: "Commandes en ligne" };

export default async function ShopOrdersPage({ searchParams }: { searchParams: Promise<{ days?: string }> }) {
  const { allowed } = await requirePerm("operations");
  if (!allowed) return <Denied what="les commandes en ligne" />;
  const days = Math.min(30, Math.max(1, Number((await searchParams).days ?? 2)));
  const supabase = await createClient();
  const since = new Date(Date.parse(new Date().toISOString().slice(0, 10)) - (days - 1) * 86400_000).toISOString();
  const { data } = await supabase.from("shop_orders").select("id, number, channel, customer_name, city, items, total_ttc, status, pack_station, ordered_at, ship_deadline, shipped_at").gte("ordered_at", since).lte("ordered_at", new Date().toISOString()).order("ordered_at", { ascending: false });
  const rows = data ?? [];
  const toPack = rows.filter((r) => ["payee", "preparation"].includes(r.status)).length;
  return (
    <>
      <PageHeader title="Commandes en ligne" subtitle={`Flux de la boutique (adaptateur en mode simulé) · ${days} dernier(s) jour(s)`} />
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Stat label="Commandes" value={formatNumber(rows.length)} icon="cart" />
        <Stat label="À préparer" value={formatNumber(toPack)} tone={toPack > 40 ? "warn" : undefined} icon="box" />
        <Stat label="CA TTC" value={formatMoney(rows.reduce((s, r) => s + Number(r.total_ttc), 0), "fr", 0)} icon="chart" />
      </div>
      <ShopOrdersTable rows={rows.map((r) => ({ ...r, total_ttc: Number(r.total_ttc) }))} />
    </>
  );
}
