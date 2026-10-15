"use client";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/kit";
import { formatDate, formatMoney, formatTime } from "@/lib/format";
import { report } from "@/lib/ui/toast";
import { markShopOrders } from "../actions";

type R = { id: string; number: string; channel: string; customer_name: string; city: string | null; items: number; total_ttc: number; status: string; pack_station: number | null; ordered_at: string; ship_deadline: string | null };
const ST: Record<string, [string, "ok" | "info" | "warn" | "muted" | "brand"]> = { payee: ["Payée", "warn"], preparation: ["En préparation", "info"], emballee: ["Emballée", "brand"], expediee: ["Expédiée", "ok"], livree: ["Livrée", "ok"], annulee: ["Annulée", "muted"] };

export function ShopOrdersTable({ rows }: { rows: R[] }) {
  const columns: Column<R>[] = [
    { key: "number", header: "N°", cell: (r) => <span className="font-mono text-[13px]">{r.number}</span> },
    { key: "ordered_at", header: "Passée", cell: (r) => `${formatDate(r.ordered_at)} ${formatTime(r.ordered_at)}` },
    { key: "customer_name", header: "Client", cell: (r) => r.customer_name },
    { key: "city", header: "Ville", cell: (r) => r.city, filter: true, hideOnMobile: true },
    { key: "channel", header: "Canal", cell: (r) => (r.channel === "abonnement" ? "Abonnement" : "Boutique"), value: (r) => (r.channel === "abonnement" ? "Abonnement" : "Boutique"), filter: true },
    { key: "status", header: "Statut", value: (r) => ST[r.status]?.[0], cell: (r) => <Badge tone={ST[r.status]?.[1]}>{ST[r.status]?.[0]}</Badge>, filter: true },
    { key: "pack_station", header: "Table", value: (r) => (r.pack_station ? `T${r.pack_station}` : ""), cell: (r) => (r.pack_station ? `T${r.pack_station}` : "—"), filter: true },
    { key: "total", header: "Total TTC", align: "right", value: (r) => r.total_ttc, cell: (r) => formatMoney(r.total_ttc) },
  ];
  return (
    <DataTable
      rows={rows}
      columns={columns}
      module="ops:shop-orders"
      exportName="commandes-en-ligne"
      bulk={[
        { label: "En préparation", run: async (s) => report(await markShopOrders(s.map((x) => x.id), "preparation")) },
        { label: "Marquer emballées", icon: "box", run: async (s) => report(await markShopOrders(s.map((x) => x.id), "emballee")) },
      ]}
    />
  );
}
