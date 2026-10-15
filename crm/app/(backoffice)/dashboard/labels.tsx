"use client";
/** Graphiques du tableau de bord (les formateurs sont des fonctions : composant client). */
import { useTranslations } from "next-intl";
import { AreaTrend, Columns } from "@/components/ui/charts";
import { formatMoney, formatNumber } from "@/lib/format";

const day = (d: string) => d.slice(8, 10) + "/" + d.slice(5, 7);
const compact = (v: number) => (Math.abs(v) >= 1000 ? `${formatNumber(v / 1000, "fr", v >= 10000 ? 0 : 1)} k€` : formatMoney(v, "fr", 0));

export function ChartLabels({ kind, data }: { kind: "revenue" | "orders"; data: Record<string, unknown>[] }) {
  const t = useTranslations("dashboard");
  return kind === "revenue" ? (
    <AreaTrend data={data} x="day" y="ca" name={t("revenue.series")} fmt={compact} labelFmt={day} />
  ) : (
    <Columns data={data} x="day" y="orders" name={t("orders.series")} fmt={(v) => formatNumber(v)} labelFmt={day} />
  );
}
