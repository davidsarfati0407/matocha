import { nowMs } from "@/lib/clock";
import type { Metadata } from "next";
import { Denied, PageHeader, Stat, Tabs } from "@/components/ui/kit";
import { requirePerm } from "@/lib/backoffice/context";
import { coverageDays, reorderQuantity } from "@/lib/domain/stock";
import { formatMoney, formatNumber } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { StockTable, type StockRow } from "./table";

export const metadata: Metadata = { title: "Stock" };

export default async function StockPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { ctx, allowed } = await requirePerm("ressources");
  if (!allowed) return <Denied what="le stock" />;
  const tab = (await searchParams).tab ?? "all";
  const supabase = await createClient();
  const since = new Date(nowMs() - 30 * 86400_000).toISOString();
  const [items, moves] = await Promise.all([
    supabase.from("stock_items").select("id, reference, name, category, unit, quantity, min_quantity, location, unit_cost, on_order, suppliers(name)").order("reference"),
    supabase.from("stock_movements").select("stock_item_id, quantity").eq("kind", "sortie").gte("at", since),
  ]);
  const out = new Map<string, number>();
  for (const m of moves.data ?? []) out.set(m.stock_item_id, (out.get(m.stock_item_id) ?? 0) + Number(m.quantity));
  const all: StockRow[] = (items.data ?? []).map((i) => {
    const q = Number(i.quantity);
    const min = Number(i.min_quantity);
    return {
      id: i.id,
      reference: i.reference,
      name: i.name,
      category: i.category,
      location: i.location,
      quantity: q,
      min,
      value: q * Number(i.unit_cost),
      onOrder: i.on_order,
      supplier: (i.suppliers as unknown as { name: string } | null)?.name ?? null,
      coverage: coverageDays(q, (out.get(i.id) ?? 0) / 30),
      toOrder: reorderQuantity({ quantity: q, minQuantity: min, onOrder: i.on_order }),
    };
  });
  const low = all.filter((r) => r.quantity < r.min);
  const rows = tab === "low" ? low : all;
  return (
    <>
      <PageHeader title="Stock" subtitle="Niveaux, emplacements, couverture au rythme des 30 derniers jours" />
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Stat label="Références" value={formatNumber(all.length)} icon="layers" />
        <Stat label="Sous le minimum" value={formatNumber(low.length)} tone={low.some((r) => !r.onOrder) ? "warn" : undefined} sub={`${low.filter((r) => r.onOrder).length} déjà en commande`} icon="bell" href="?tab=low" />
        <Stat label="Valeur du stock" value={formatMoney(all.reduce((s, r) => s + r.value, 0), "fr", 0)} sub="au coût d'achat" icon="chart" />
      </div>
      <Tabs
        current={tab}
        tabs={[
          { id: "all", label: "Tout le stock", href: "?tab=all", count: all.length },
          { id: "low", label: "Stock bas", href: "?tab=low", count: low.length },
        ]}
      />
      <StockTable rows={rows} canOrder={ctx.can("ressources", "create")} />
    </>
  );
}
