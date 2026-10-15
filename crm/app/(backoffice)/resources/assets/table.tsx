"use client";
import { useTranslations } from "next-intl";
import { nowMs } from "@/lib/clock";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/kit";
import { formatDate } from "@/lib/format";
import { ASSET_STATUS, ASSET_TYPE } from "@/lib/backoffice/labels";

type R = { id: string; name: string; type: string; status: string; zone: string; assigned: string; next: string | null };

export function AssetsTable({ rows }: { rows: R[] }) {
  const t = useTranslations("resources.assets");
  const tAll = useTranslations();
  const type = (r: R) => (ASSET_TYPE[r.type] ? tAll(ASSET_TYPE[r.type] as never) : r.type);
  const status = (r: R) => (ASSET_STATUS[r.status] ? tAll(ASSET_STATUS[r.status][1] as never) : r.status);
  const soon = new Date(nowMs() + 30 * 86400_000).toISOString().slice(0, 10);
  const columns: Column<R>[] = [
    { key: "name", header: t("col.name"), cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "type", header: t("col.type"), value: type, cell: type, filter: true },
    { key: "zone", header: t("col.zone"), cell: (r) => r.zone || "—", filter: true, hideOnMobile: true },
    { key: "assigned", header: t("col.assigned"), cell: (r) => r.assigned || "—", hideOnMobile: true },
    { key: "next", header: t("col.next"), value: (r) => r.next ?? "", cell: (r) => (r.next ? <span className={r.next <= soon ? "font-semibold text-[#9a6a00]" : ""}>{formatDate(r.next)}</span> : "—") },
    { key: "status", header: t("col.status"), value: status, filter: true, cell: (r) => <Badge tone={ASSET_STATUS[r.status]?.[0]}>{status(r)}</Badge> },
  ];
  return <DataTable rows={rows} columns={columns} href={(r) => `/resources/assets/${r.id}`} module="resources:assets" exportName="equipements" />;
}
