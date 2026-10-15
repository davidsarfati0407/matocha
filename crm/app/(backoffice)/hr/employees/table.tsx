"use client";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { useTranslations } from "next-intl";
import { Pill } from "@/components/map/hud/ui";
import { PRESENCE } from "@/lib/backoffice/labels";
import { formatDate, formatNumber } from "@/lib/format";

type R = { id: string; name: string; job: string; dept: string; email: string; phone: string; contract: string; rate: number; hired: string; balance: number | null; manager: string; status: string };

export function EmployeesTable({ rows, hr }: { rows: R[]; hr: boolean }) {
  const t = useTranslations("hr.employees");
  const tAll = useTranslations();
  const presence = (s: string) => (PRESENCE[s] ? tAll(PRESENCE[s] as never) : "");
  const columns: Column<R>[] = [
    { key: "name", header: t("colName"), cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "job", header: t("colJob"), cell: (r) => r.job },
    { key: "dept", header: t("colTeam"), cell: (r) => r.dept, filter: true },
    { key: "status", header: t("colPresence"), value: (r) => presence(r.status), filter: true, cell: (r) => <Pill tone={r.status}>{presence(r.status)}</Pill> },
    { key: "email", header: t("colEmail"), cell: (r) => r.email, hideOnMobile: true },
    ...(hr
      ? [
          { key: "contract", header: t("colContract"), cell: (r: R) => `${r.contract}${r.rate < 1 ? ` · ${Math.round(r.rate * 100)} %` : ""}`, value: (r: R) => r.contract, filter: true, hideOnMobile: true },
          { key: "hired", header: t("colHired"), value: (r: R) => r.hired, cell: (r: R) => formatDate(r.hired), hideOnMobile: true },
          { key: "balance", header: t("colBalance"), align: "right" as const, value: (r: R) => r.balance ?? 0, cell: (r: R) => t("days", { n: formatNumber(r.balance ?? 0, "fr", 1) }) },
        ]
      : []),
  ];
  return <DataTable rows={rows} columns={columns} href={(r) => `/hr/employees/${r.id}`} module="hr:employees" exportName={t("exportName")} />;
}
