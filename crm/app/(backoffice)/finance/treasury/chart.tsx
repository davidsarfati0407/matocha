"use client";
import { PairedBars } from "@/components/ui/charts";
import { formatMoney, formatNumber } from "@/lib/format";

const compact = (v: number) => (Math.abs(v) >= 1000 ? `${formatNumber(v / 1000, "fr", 0)} k€` : formatMoney(v, "fr", 0));

export function TreasuryChart({ data }: { data: Record<string, unknown>[] }) {
  return <PairedBars data={data} x="week" a={{ key: "inflow", name: "Encaissements" }} b={{ key: "outflow", name: "Décaissements" }} fmt={compact} labelFmt={(d) => `Sem. du ${d.slice(8, 10)}/${d.slice(5, 7)}`} height={280} />;
}
