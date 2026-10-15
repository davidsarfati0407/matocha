import { nowMs } from "@/lib/clock";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Badge, ButtonLink, Card, Denied, Dl, PageHeader, Stat } from "@/components/ui/kit";
import { sectorConfig } from "@/config/sector.config";
import { requirePerm } from "@/lib/backoffice/context";
import { coverageDays, reorderQuantity } from "@/lib/domain/stock";
import { formatDate, formatMoney, formatNumber, formatTime } from "@/lib/format";
import { mapHref } from "@/lib/map/links";
import { createClient } from "@/lib/supabase/server";
import { CountForm, ReorderButton } from "./client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("resources.stockItem");
  return { title: t("title") };
}

import { LOT_STATUS as LOT } from "@/lib/backoffice/labels";

export default async function StockItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations("resources.stockItem");
  const tAll = await getTranslations();
  const { ctx, allowed } = await requirePerm("ressources");
  if (!allowed) return <Denied what={t("deniedWhat")} />;
  const supabase = await createClient();
  const { data: it } = await supabase.from("stock_items").select("*, suppliers(name, lead_time_days)").eq("id", id).maybeSingle();
  if (!it) notFound();
  const [lots, moves] = await Promise.all([
    supabase.from("lots").select("id, number, quantity, status, best_before").eq("stock_item_id", id).order("best_before"),
    supabase.from("stock_movements").select("id, kind, quantity, reason, at, lots(number), work_orders(id, number)").eq("stock_item_id", id).order("at", { ascending: false }).limit(40),
  ]);
  const q = Number(it.quantity);
  const min = Number(it.min_quantity);
  const out30 = (moves.data ?? []).filter((m) => m.kind === "sortie" && Date.parse(m.at) > nowMs() - 30 * 86400_000).reduce((s, m) => s + Number(m.quantity), 0);
  const cov = coverageDays(q, out30 / 30);
  const toOrder = reorderQuantity({ quantity: q, minQuantity: min, onOrder: it.on_order });
  const sup = it.suppliers as unknown as { name: string; lead_time_days: number } | null;
  return (
    <>
      <PageHeader
        kicker={`${it.category} · ${it.reference}`}
        title={it.name}
        subtitle={sup ? t("supplierSub", { name: sup.name, days: sup.lead_time_days }) : undefined}
        actions={
          <>
            {it.location && <ButtonLink href={mapHref(sectorConfig.lieux[0].id, "stock_items", id)} icon="map">{tAll("resources.viewOnMap")}</ButtonLink>}
            {toOrder > 0 && ctx.can("ressources", "create") && <ReorderButton id={id} qty={toOrder} />}
          </>
        }
      />
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Stat label={t("inStock")} value={`${formatNumber(q)} ${it.unit}`} tone={q < min ? "warn" : undefined} sub={t("minimum", { min: formatNumber(min) })} icon="layers" />
        <Stat label={t("coverage")} value={cov == null ? "—" : t("coverageDays", { count: cov })} tone={cov != null && sup && cov < sup.lead_time_days ? "danger" : undefined} sub={sup && cov != null && cov < sup.lead_time_days ? t("belowLeadTime") : t("last30")} icon="clock" />
        <Stat label={t("value")} value={formatMoney(q * Number(it.unit_cost), "fr", 0)} sub={`${formatMoney(Number(it.unit_cost))} / ${it.unit}`} icon="chart" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title={t("lots")} className="lg:col-span-1">
          {(lots.data ?? []).length === 0 ? (
            <p className="text-sm text-muted">{t("noLots")}</p>
          ) : (
            <ul className="divide-y divide-black/5 text-sm">
              {(lots.data ?? []).map((l) => (
                <li key={l.id}>
                  <Link href={`/resources/lots/${l.id}`} className="flex items-center justify-between gap-2 py-2 hover:text-accent">
                    <span>
                      <span className="font-mono">{l.number}</span>
                      <span className="block text-xs text-muted">{t("bestBefore", { date: l.best_before ? formatDate(l.best_before) : "—" })}</span>
                    </span>
                    <span className="text-right">
                      <Badge tone={LOT[l.status]?.[0]}>{LOT[l.status] ? tAll(LOT[l.status][1] as never) : l.status}</Badge>
                      <span className="block text-xs tabular-nums text-muted">{formatNumber(Number(l.quantity))}</span>
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-muted">{t("fefoHint")}</p>
        </Card>
        <Card title={t("moves")} className="lg:col-span-2" action={ctx.can("ressources", "update") ? <CountForm id={id} current={q} /> : undefined}>
          <ul className="divide-y divide-black/5 text-sm">
            {(moves.data ?? []).map((m) => {
              const wo = m.work_orders as unknown as { id: string; number: string } | null;
              const lot = m.lots as unknown as { number: string } | null;
              return (
                <li key={m.id} className="flex items-center justify-between gap-3 py-2">
                  <span className="min-w-0 truncate">
                    <span className="text-muted">{formatDate(m.at)} {formatTime(m.at)}</span> · {m.reason}
                    {lot && <span className="text-muted"> · {t("lotRef", { number: lot.number })}</span>}
                    {wo && (
                      <Link className="ml-1 text-accent" href={`/ops/work-orders/${wo.id}`}>
                        {wo.number}
                      </Link>
                    )}
                  </span>
                  <span className={`shrink-0 tabular-nums ${m.kind === "sortie" ? "text-[#b3402a]" : m.kind === "entree" ? "text-brand" : ""}`}>
                    {m.kind === "sortie" ? "−" : m.kind === "entree" ? "+" : "="}
                    {formatNumber(Number(m.quantity))}
                  </span>
                </li>
              );
            })}
          </ul>
        </Card>
        <Card title={t("card")} className="lg:col-span-3">
          <Dl items={[[t("location"), it.location], [t("unit"), it.unit], [t("onOrder"), it.on_order ? tAll("common.yes") : tAll("common.no")]]} />
        </Card>
      </div>
    </>
  );
}
