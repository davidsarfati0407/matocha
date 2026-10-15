"use client";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Pill, STATUS } from "@/components/map/hud/ui";
import { formatDate, formatNumber } from "@/lib/format";

type R = { id: string; name: string; job: string; dept: string; email: string; phone: string; contract: string; rate: number; hired: string; balance: number | null; manager: string; status: string };

export function EmployeesTable({ rows, hr }: { rows: R[]; hr: boolean }) {
  const columns: Column<R>[] = [
    { key: "name", header: "Nom", cell: (r) => <span className="font-medium">{r.name}</span> },
    { key: "job", header: "Poste", cell: (r) => r.job },
    { key: "dept", header: "Équipe", cell: (r) => r.dept, filter: true },
    { key: "status", header: "Présence", value: (r) => STATUS[r.status]?.label, filter: true, cell: (r) => <Pill tone={r.status}>{STATUS[r.status]?.label}</Pill> },
    { key: "email", header: "E-mail", cell: (r) => r.email, hideOnMobile: true },
    ...(hr
      ? [
          { key: "contract", header: "Contrat", cell: (r: R) => `${r.contract}${r.rate < 1 ? ` · ${Math.round(r.rate * 100)} %` : ""}`, value: (r: R) => r.contract, filter: true, hideOnMobile: true },
          { key: "hired", header: "Arrivée", value: (r: R) => r.hired, cell: (r: R) => formatDate(r.hired), hideOnMobile: true },
          { key: "balance", header: "Solde congés", align: "right" as const, value: (r: R) => r.balance ?? 0, cell: (r: R) => `${formatNumber(r.balance ?? 0, "fr", 1)} j` },
        ]
      : []),
  ];
  return <DataTable rows={rows} columns={columns} href={(r) => `/hr/employees/${r.id}`} module="hr:employees" exportName="collaborateurs" />;
}
