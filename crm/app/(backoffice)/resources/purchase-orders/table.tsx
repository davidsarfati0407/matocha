"use client";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Badge, Button } from "@/components/ui/kit";
import { formatDate, formatMoney } from "@/lib/format";
import { report } from "@/lib/ui/toast";
import { receivePurchaseOrder, setPurchaseOrderStatus } from "../actions";

type R = { id: string; number: string; status: string; supplier: string; lines: string; total: number; expected_on: string | null };
const ST: Record<string, "ok" | "warn" | "info" | "muted" | "brand"> = { draft: "muted", sent: "info", confirmed: "brand", in_transit: "warn", received: "ok", cancelled: "muted" };

export function PoTable({ rows, canEdit }: { rows: R[]; canEdit: boolean }) {
  const t = useTranslations("resources.purchaseOrders");
  const status = (r: R) => (r.status in ST ? t(`status.${r.status}`) : r.status);
  const router = useRouter();
  const [pending, start] = useTransition();
  const act = (fn: () => Promise<Parameters<typeof report>[0]>) => start(async () => { if (report(await fn())) router.refresh(); });
  const columns: Column<R>[] = [
    { key: "number", header: t("col.number"), cell: (r) => <span className="font-mono text-[13px]">{r.number}</span> },
    { key: "supplier", header: t("col.supplier"), cell: (r) => r.supplier, filter: true },
    { key: "lines", header: t("col.lines"), cell: (r) => <span className="line-clamp-1 max-w-72">{r.lines}</span>, hideOnMobile: true },
    { key: "total", header: t("col.totalHt"), align: "right", value: (r) => r.total, cell: (r) => formatMoney(r.total) },
    { key: "expected_on", header: t("col.expectedOn"), value: (r) => r.expected_on ?? "", cell: (r) => (r.expected_on ? formatDate(r.expected_on) : "—") },
    { key: "status", header: t("col.status"), value: status, filter: true, cell: (r) => <Badge tone={ST[r.status]}>{status(r)}</Badge> },
    {
      key: "action",
      header: "",
      cell: (r) =>
        !canEdit ? null : r.status === "draft" ? (
          <Button size="sm" variant="accent" icon="send" disabled={pending} onClick={() => act(() => setPurchaseOrderStatus(r.id, "sent"))}>
            {t("send")}
          </Button>
        ) : ["sent", "confirmed", "in_transit"].includes(r.status) ? (
          <Button size="sm" variant="primary" icon="check" disabled={pending} onClick={() => act(() => receivePurchaseOrder(r.id))}>
            {t("receive")}
          </Button>
        ) : null,
    },
  ];
  return <DataTable rows={rows} columns={columns} module="resources:po" exportName="achats" />;
}
