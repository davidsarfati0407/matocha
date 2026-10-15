"use client";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/kit";
import { formatDate } from "@/lib/format";

type R = { id: string; name: string; kind: string; owner: string; date: string; open: string | null; link: string | null; stored: boolean };

export function DocumentsTable({ rows }: { rows: R[] }) {
  const t = useTranslations("comms.documents");
  const columns: Column<R>[] = [
    { key: "name", header: t("colDocument"), cell: (r) => (r.open ? <a className="font-medium hover:text-accent" href={r.open} target="_blank" rel="noreferrer">{r.name}</a> : <span className="font-medium">{r.name}</span>) },
    { key: "kind", header: t("colType"), cell: (r) => r.kind, filter: true },
    { key: "owner", header: t("colOwner"), cell: (r) => (r.link ? <Link className="text-accent" href={r.link}>{r.owner}</Link> : r.owner) },
    { key: "date", header: t("colDate"), value: (r) => r.date, cell: (r) => (r.date ? formatDate(r.date) : "—") },
    { key: "src", header: t("colSource"), value: (r) => (r.stored ? t("uploaded") : t("generated")), filter: true, cell: (r) => (r.stored ? <Badge tone="muted">{t("uploadedBadge")}</Badge> : <Badge tone="ok">{t("generatedBadge")}</Badge>) },
  ];
  return <DataTable rows={rows} columns={columns} module="comms:documents" exportName={t("exportName")} />;
}
