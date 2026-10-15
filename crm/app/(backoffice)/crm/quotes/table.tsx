"use client";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/kit";
import { QUOTE_STATUS } from "@/lib/backoffice/labels";
import { formatDate, formatMoney } from "@/lib/format";

type R = { id: string; number: string; status: string; ht: number; issued: string | null; valid: string | null; client: string; owner: string };

export function QuotesTable({ rows }: { rows: R[] }) {
  const columns: Column<R>[] = [
    { key: "number", header: "N°", cell: (r) => <span className="font-mono text-[13px]">{r.number}</span> },
    { key: "client", header: "Compte", cell: (r) => <span className="font-medium">{r.client}</span>, filter: true },
    { key: "issued", header: "Émis le", value: (r) => r.issued ?? "", cell: (r) => (r.issued ? formatDate(r.issued) : "—"), hideOnMobile: true },
    { key: "valid", header: "Valable jusqu'au", value: (r) => r.valid ?? "", cell: (r) => (r.valid ? formatDate(r.valid) : "—"), hideOnMobile: true },
    { key: "owner", header: "Responsable", cell: (r) => r.owner, filter: true, hideOnMobile: true },
    { key: "ht", header: "Total HT", align: "right", value: (r) => r.ht, cell: (r) => formatMoney(r.ht) },
    { key: "status", header: "Statut", value: (r) => QUOTE_STATUS[r.status][1], filter: true, cell: (r) => <Badge tone={QUOTE_STATUS[r.status][0]}>{QUOTE_STATUS[r.status][1]}</Badge> },
  ];
  return <DataTable rows={rows} columns={columns} href={(r) => `/crm/quotes/${r.id}`} module="crm:quotes" exportName="devis" />;
}
