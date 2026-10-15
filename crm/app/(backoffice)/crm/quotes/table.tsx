"use client";
import { useTranslations } from "next-intl";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/kit";
import { QUOTE_STATUS } from "@/lib/backoffice/labels";
import { formatDate, formatMoney } from "@/lib/format";

type R = { id: string; number: string; status: string; ht: number; issued: string | null; valid: string | null; client: string; owner: string };

export function QuotesTable({ rows }: { rows: R[] }) {
  const t = useTranslations("crm.quotes.table");
  const tAll = useTranslations();
  const columns: Column<R>[] = [
    { key: "number", header: t("number"), cell: (r) => <span className="font-mono text-[13px]">{r.number}</span> },
    { key: "client", header: t("account"), cell: (r) => <span className="font-medium">{r.client}</span>, filter: true },
    { key: "issued", header: t("issued"), value: (r) => r.issued ?? "", cell: (r) => (r.issued ? formatDate(r.issued) : "—"), hideOnMobile: true },
    { key: "valid", header: t("valid"), value: (r) => r.valid ?? "", cell: (r) => (r.valid ? formatDate(r.valid) : "—"), hideOnMobile: true },
    { key: "owner", header: t("owner"), cell: (r) => r.owner, filter: true, hideOnMobile: true },
    { key: "ht", header: t("totalHt"), align: "right", value: (r) => r.ht, cell: (r) => formatMoney(r.ht) },
    { key: "status", header: t("status"), value: (r) => tAll(QUOTE_STATUS[r.status][1] as never), filter: true, cell: (r) => <Badge tone={QUOTE_STATUS[r.status][0]}>{tAll(QUOTE_STATUS[r.status][1] as never)}</Badge> },
  ];
  return <DataTable rows={rows} columns={columns} href={(r) => `/crm/quotes/${r.id}`} module="crm:quotes" exportName={t("exportName")} />;
}
