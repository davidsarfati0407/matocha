import { nowMs } from "@/lib/clock";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Denied, PageHeader, Stat, Tabs } from "@/components/ui/kit";
import { requirePerm } from "@/lib/backoffice/context";
import { coverageDays, reorderQuantity } from "@/lib/domain/stock";
import { formatMoney, formatNumber } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { StockTable, type StockRow } from "./table";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("resources.stock");
  return { title: t("title") };
}

export default async function StockPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const t = await getTranslations("resources.stock");
  const { ctx, allowed } = await requirePerm("ressources");
  if (!allowed) return <Denied what={t("deniedWhat")} />;
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
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Stat label={t("statRefs")} value={formatNumber(all.length)} icon="layers" />
        <Stat label={t("statLow")} value={formatNumber(low.length)} tone={low.some((r) => !r.onOrder) ? "warn" : undefined} sub={t("statLowSub", { count: low.filter((r) => r.onOrder).length })} icon="bell" href="?tab=low" />
        <Stat label={t("statValue")} value={formatMoney(all.reduce((s, r) => s + r.value, 0), "fr", 0)} sub={t("statValueSub")} icon="chart" />
      </div>
      <Tabs
        current={tab}
        tabs={[
          { id: "all", label: t("tabAll"), href: "?tab=all", count: all.length },
          { id: "low", label: t("tabLow"), href: "?tab=low", count: low.length },
        ]}
      />
      <StockTable rows={rows} canOrder={ctx.can("ressources", "create")} />
    </>
  );
}
