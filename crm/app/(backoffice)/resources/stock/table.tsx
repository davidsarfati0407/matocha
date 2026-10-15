"use client";
import { useRouter } from "next/navigation";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge, Button } from "@/components/ui/kit";
import { formatMoney, formatNumber } from "@/lib/format";
import { report } from "@/lib/ui/toast";
import { reorder } from "../actions";

export type StockRow = { id: string; reference: string; name: string; category: string; location: string | null; quantity: number; min: number; value: number; onOrder: boolean; supplier: string | null; coverage: number | null; toOrder: number };

export function StockTable({ rows, canOrder }: { rows: StockRow[]; canOrder: boolean }) {
  const router = useRouter();
  const order = async (ids: string[]) => {
    const r = await reorder(ids);
    if (report(r) && r.ok) router.push("/resources/purchase-orders?status=draft");
  };
  const columns: Column<StockRow>[] = [
    { key: "reference", header: "Réf.", cell: (r) => <span className="font-mono text-[13px]">{r.reference}</span> },
    { key: "name", header: "Article", cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "category", header: "Catégorie", cell: (r) => r.category, filter: true, hideOnMobile: true },
    { key: "location", header: "Emplacement", cell: (r) => r.location ?? "—", hideOnMobile: true },
    { key: "quantity", header: "Quantité", align: "right", value: (r) => r.quantity, cell: (r) => <span className={r.quantity < r.min ? "font-semibold text-[#b3402a]" : ""}>{formatNumber(r.quantity)}</span> },
    { key: "min", header: "Minimum", align: "right", value: (r) => r.min, cell: (r) => formatNumber(r.min), hideOnMobile: true },
    { key: "coverage", header: "Couverture", align: "right", value: (r) => r.coverage ?? 9999, cell: (r) => (r.coverage == null ? "—" : `${r.coverage} j`) },
    { key: "value", header: "Valeur", align: "right", value: (r) => r.value, cell: (r) => formatMoney(r.value, "fr", 0), hideOnMobile: true },
    {
      key: "state",
      header: "État",
      value: (r) => (r.onOrder ? "En commande" : r.quantity < r.min ? "À commander" : "OK"),
      filter: true,
      cell: (r) =>
        r.onOrder ? (
          <Badge tone="info">En commande</Badge>
        ) : r.toOrder > 0 && canOrder ? (
          <Button size="sm" variant="accent" icon="cart" onClick={(e) => (e.stopPropagation(), order([r.id]))}>
            Commander {formatNumber(r.toOrder)}
          </Button>
        ) : r.quantity < r.min ? (
          <Badge tone="warn">À commander</Badge>
        ) : (
          <Badge tone="ok">OK</Badge>
        ),
    },
  ];
  return <DataTable rows={rows} columns={columns} href={(r) => `/resources/stock/${r.id}`} module="resources:stock" exportName="stock" bulk={canOrder ? [{ label: "Réapprovisionner", icon: "cart", tone: "accent", run: (s) => order(s.map((x) => x.id)) }] : []} />;
}
