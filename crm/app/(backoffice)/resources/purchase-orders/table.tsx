"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge, Button } from "@/components/ui/kit";
import { formatDate, formatMoney } from "@/lib/format";
import { report } from "@/lib/ui/toast";
import { receivePurchaseOrder, setPurchaseOrderStatus } from "../actions";

type R = { id: string; number: string; status: string; supplier: string; lines: string; total: number; expected_on: string | null };
const ST: Record<string, ["ok" | "warn" | "info" | "muted" | "brand", string]> = { draft: ["muted", "Brouillon"], sent: ["info", "Envoyé"], confirmed: ["brand", "Confirmé"], in_transit: ["warn", "En transit"], received: ["ok", "Reçu"], cancelled: ["muted", "Annulé"] };

export function PoTable({ rows, canEdit }: { rows: R[]; canEdit: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const act = (fn: () => Promise<Parameters<typeof report>[0]>) => start(async () => { if (report(await fn())) router.refresh(); });
  const columns: Column<R>[] = [
    { key: "number", header: "N°", cell: (r) => <span className="font-mono text-[13px]">{r.number}</span> },
    { key: "supplier", header: "Fournisseur", cell: (r) => r.supplier, filter: true },
    { key: "lines", header: "Lignes", cell: (r) => <span className="line-clamp-1 max-w-72">{r.lines}</span>, hideOnMobile: true },
    { key: "total", header: "Total HT", align: "right", value: (r) => r.total, cell: (r) => formatMoney(r.total) },
    { key: "expected_on", header: "Attendu le", value: (r) => r.expected_on ?? "", cell: (r) => (r.expected_on ? formatDate(r.expected_on) : "—") },
    { key: "status", header: "Statut", value: (r) => ST[r.status][1], filter: true, cell: (r) => <Badge tone={ST[r.status][0]}>{ST[r.status][1]}</Badge> },
    {
      key: "action",
      header: "",
      cell: (r) =>
        !canEdit ? null : r.status === "draft" ? (
          <Button size="sm" variant="accent" icon="send" disabled={pending} onClick={() => act(() => setPurchaseOrderStatus(r.id, "sent"))}>
            Envoyer
          </Button>
        ) : ["sent", "confirmed", "in_transit"].includes(r.status) ? (
          <Button size="sm" variant="primary" icon="check" disabled={pending} onClick={() => act(() => receivePurchaseOrder(r.id))}>
            Réceptionner
          </Button>
        ) : null,
    },
  ];
  return <DataTable rows={rows} columns={columns} module="resources:po" exportName="achats" />;
}
