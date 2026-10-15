"use client";
import { useTranslations } from "next-intl";
import { PairedBars } from "@/components/ui/charts";
import { formatMoney, formatNumber } from "@/lib/format";

const compact = (v: number) => (Math.abs(v) >= 1000 ? `${formatNumber(v / 1000, "fr", 0)} k€` : formatMoney(v, "fr", 0));

export function TreasuryChart({ data }: { data: Record<string, unknown>[] }) {
  const t = useTranslations("finance.treasury");
  return <PairedBars data={data} x="week" a={{ key: "inflow", name: t("inflow") }} b={{ key: "outflow", name: t("outflow") }} fmt={compact} labelFmt={(d) => t("weekOf", { day: d.slice(8, 10), month: d.slice(5, 7) })} height={280} />;
}
