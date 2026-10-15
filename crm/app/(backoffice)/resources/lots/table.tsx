"use client";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/kit";
import { formatDate, formatNumber } from "@/lib/format";
import { LOT_STATUS } from "@/lib/backoffice/labels";

type R = { id: string; number: string; item: string; supplier: string; quantity: number; status: string; best_before: string | null; received_at: string | null; coa: boolean | null };

export function LotsTable({ rows }: { rows: R[] }) {
  const columns: Column<R>[] = [
    { key: "number", header: "Lot", cell: (r) => <span className="font-mono text-[13px] font-medium">{r.number}</span> },
    { key: "item", header: "Article", cell: (r) => r.item, filter: true },
    { key: "supplier", header: "Fournisseur", cell: (r) => r.supplier, filter: true, hideOnMobile: true },
    { key: "received_at", header: "Reçu le", value: (r) => r.received_at ?? "", cell: (r) => (r.received_at ? formatDate(r.received_at) : "—"), hideOnMobile: true },
    { key: "best_before", header: "DDM", value: (r) => r.best_before ?? "", cell: (r) => (r.best_before ? formatDate(r.best_before) : "—") },
    { key: "quantity", header: "Quantité", align: "right", value: (r) => r.quantity, cell: (r) => formatNumber(r.quantity) },
    { key: "coa", header: "Certificat", value: (r) => (r.coa == null ? "À vérifier" : r.coa ? "Conforme" : "Non conforme"), cell: (r) => (r.coa == null ? "À vérifier" : r.coa ? "Conforme" : "Non conforme"), filter: true, hideOnMobile: true },
    { key: "status", header: "Statut", value: (r) => LOT_STATUS[r.status][1], filter: true, cell: (r) => <Badge tone={LOT_STATUS[r.status][0]}>{LOT_STATUS[r.status][1]}</Badge> },
  ];
  return <DataTable rows={rows} columns={columns} href={(r) => `/resources/lots/${r.id}`} module="resources:lots" exportName="lots" />;
}
