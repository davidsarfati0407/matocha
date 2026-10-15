"use client";
import { useTranslations } from "next-intl";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/kit";
import { formatDate, formatNumber } from "@/lib/format";
import { LOT_STATUS } from "@/lib/backoffice/labels";

type R = { id: string; number: string; item: string; supplier: string; quantity: number; status: string; best_before: string | null; received_at: string | null; coa: boolean | null };

export function LotsTable({ rows }: { rows: R[] }) {
  const t = useTranslations("resources.lots");
  const tAll = useTranslations();
  const coa = (r: R) => (r.coa == null ? t("coa.pending") : r.coa ? t("coa.ok") : t("coa.ko"));
  const status = (r: R) => (LOT_STATUS[r.status] ? tAll(LOT_STATUS[r.status][1] as never) : r.status);
  const columns: Column<R>[] = [
    { key: "number", header: t("col.number"), cell: (r) => <span className="font-mono text-[13px] font-medium">{r.number}</span> },
    { key: "item", header: t("col.item"), cell: (r) => r.item, filter: true },
    { key: "supplier", header: t("col.supplier"), cell: (r) => r.supplier, filter: true, hideOnMobile: true },
    { key: "received_at", header: t("col.receivedAt"), value: (r) => r.received_at ?? "", cell: (r) => (r.received_at ? formatDate(r.received_at) : "—"), hideOnMobile: true },
    { key: "best_before", header: t("col.bestBefore"), value: (r) => r.best_before ?? "", cell: (r) => (r.best_before ? formatDate(r.best_before) : "—") },
    { key: "quantity", header: t("col.quantity"), align: "right", value: (r) => r.quantity, cell: (r) => formatNumber(r.quantity) },
    { key: "coa", header: t("col.coa"), value: coa, cell: coa, filter: true, hideOnMobile: true },
    { key: "status", header: t("col.status"), value: status, filter: true, cell: (r) => <Badge tone={LOT_STATUS[r.status]?.[0]}>{status(r)}</Badge> },
  ];
  return <DataTable rows={rows} columns={columns} href={(r) => `/resources/lots/${r.id}`} module="resources:lots" exportName="lots" />;
}
