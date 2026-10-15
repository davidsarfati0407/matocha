"use client";
import { nowMs } from "@/lib/clock";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge } from "@/components/ui/kit";
import { formatDate } from "@/lib/format";
import { ASSET_STATUS, ASSET_TYPE } from "@/lib/backoffice/labels";

type R = { id: string; name: string; type: string; status: string; zone: string; assigned: string; next: string | null };

export function AssetsTable({ rows }: { rows: R[] }) {
  const soon = new Date(nowMs() + 30 * 86400_000).toISOString().slice(0, 10);
  const columns: Column<R>[] = [
    { key: "name", header: "Nom", cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "type", header: "Type", value: (r) => ASSET_TYPE[r.type], cell: (r) => ASSET_TYPE[r.type], filter: true },
    { key: "zone", header: "Espace", cell: (r) => r.zone || "—", filter: true, hideOnMobile: true },
    { key: "assigned", header: "Affecté à", cell: (r) => r.assigned || "—", hideOnMobile: true },
    { key: "next", header: "Prochaine maintenance", value: (r) => r.next ?? "", cell: (r) => (r.next ? <span className={r.next <= soon ? "font-semibold text-[#9a6a00]" : ""}>{formatDate(r.next)}</span> : "—") },
    { key: "status", header: "État", value: (r) => ASSET_STATUS[r.status][1], filter: true, cell: (r) => <Badge tone={ASSET_STATUS[r.status][0]}>{ASSET_STATUS[r.status][1]}</Badge> },
  ];
  return <DataTable rows={rows} columns={columns} href={(r) => `/resources/assets/${r.id}`} module="resources:assets" exportName="equipements" />;
}
