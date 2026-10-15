"use client";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/kit";
import { INVOICE_STATUS } from "@/lib/backoffice/labels";
import { formatDate, formatMoney } from "@/lib/format";

type R = { id: string; number: string; kind: string; status: string; issued: string | null; due: string | null; ht: number; ttc: number; paid: number; client: string; wo: string };

export function InvoicesTable({ rows }: { rows: R[] }) {
  const columns: Column<R>[] = [
    { key: "number", header: "N°", cell: (r) => <span className="font-mono text-[13px]">{r.number}{r.kind === "avoir" && <span className="ml-1 text-xs text-muted">avoir</span>}</span> },
    { key: "client", header: "Compte", cell: (r) => <span className="font-medium">{r.client}</span>, filter: true },
    { key: "wo", header: "Commande", cell: (r) => <span className="font-mono text-xs">{r.wo || "—"}</span>, hideOnMobile: true },
    { key: "issued", header: "Émise", value: (r) => r.issued ?? "", cell: (r) => (r.issued ? formatDate(r.issued) : "—"), hideOnMobile: true },
    { key: "due", header: "Échéance", value: (r) => r.due ?? "", cell: (r) => (r.due ? formatDate(r.due) : "—") },
    { key: "ttc", header: "TTC", align: "right", value: (r) => r.ttc, cell: (r) => formatMoney(r.ttc) },
    { key: "rest", header: "Reste dû", align: "right", value: (r) => r.ttc - r.paid, cell: (r) => (r.kind === "avoir" || r.status === "cancelled" ? "—" : formatMoney(Math.max(0, r.ttc - r.paid))) },
    { key: "status", header: "Statut", value: (r) => INVOICE_STATUS[r.status][1], filter: true, cell: (r) => <Badge tone={INVOICE_STATUS[r.status][0]}>{INVOICE_STATUS[r.status][1]}</Badge> },
  ];
  return <DataTable rows={rows} columns={columns} href={(r) => `/finance/invoices/${r.id}`} module="finance:invoices" exportName="factures" />;
}
