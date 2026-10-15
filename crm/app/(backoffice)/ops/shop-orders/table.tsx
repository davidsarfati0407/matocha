"use client";
import { useTranslations } from "next-intl";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/kit";
import { formatDate, formatMoney, formatTime } from "@/lib/format";
import { report } from "@/lib/ui/toast";
import { markShopOrders } from "../actions";

type R = { id: string; number: string; channel: string; customer_name: string; city: string | null; items: number; total_ttc: number; status: string; pack_station: number | null; ordered_at: string; ship_deadline: string | null };
const ST: Record<string, "ok" | "info" | "warn" | "muted" | "brand"> = { payee: "warn", preparation: "info", emballee: "brand", expediee: "ok", livree: "ok", annulee: "muted" };

export function ShopOrdersTable({ rows }: { rows: R[] }) {
  const t = useTranslations("ops.shopOrders");
  const status = (s: string) => (s in ST ? t(`status.${s}`) : s);
  const channel = (r: R) => (r.channel === "abonnement" ? t("channel.abonnement") : t("channel.boutique"));
  const columns: Column<R>[] = [
    { key: "number", header: t("col.number"), cell: (r) => <span className="font-mono text-[13px]">{r.number}</span> },
    { key: "ordered_at", header: t("col.orderedAt"), cell: (r) => `${formatDate(r.ordered_at)} ${formatTime(r.ordered_at)}` },
    { key: "customer_name", header: t("col.customer"), cell: (r) => r.customer_name },
    { key: "city", header: t("col.city"), cell: (r) => r.city, filter: true, hideOnMobile: true },
    { key: "channel", header: t("col.channel"), cell: channel, value: channel, filter: true },
    { key: "status", header: t("col.status"), value: (r) => status(r.status), cell: (r) => <Badge tone={ST[r.status]}>{status(r.status)}</Badge>, filter: true },
    { key: "pack_station", header: t("col.station"), value: (r) => (r.pack_station ? `T${r.pack_station}` : ""), cell: (r) => (r.pack_station ? `T${r.pack_station}` : "—"), filter: true },
    { key: "total", header: t("col.total"), align: "right", value: (r) => r.total_ttc, cell: (r) => formatMoney(r.total_ttc) },
  ];
  return (
    <DataTable
      rows={rows}
      columns={columns}
      module="ops:shop-orders"
      exportName="commandes-en-ligne"
      bulk={[
        { label: t("bulkPreparation"), run: async (s) => report(await markShopOrders(s.map((x) => x.id), "preparation")) },
        { label: t("bulkPacked"), icon: "box", run: async (s) => report(await markShopOrders(s.map((x) => x.id), "emballee")) },
      ]}
    />
  );
}
