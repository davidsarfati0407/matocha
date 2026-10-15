"use client";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Drawer } from "@/components/ui/Drawer";
import { Field, Input, Select } from "@/components/ui/Form";
import { Badge, Button } from "@/components/ui/kit";
import { formatDate, formatMoney } from "@/lib/format";
import { report } from "@/lib/ui/toast";
import { decideExpenses, submitExpense } from "../actions";

type R = { id: string; on: string; category: string; label: string; ttc: number; vat: number; status: string; who: string; mine: boolean };
const ST: Record<string, ["warn" | "ok" | "danger" | "muted", string]> = { submitted: ["warn", "status.submitted"], approved: ["ok", "status.approved"], rejected: ["danger", "status.rejected"], reimbursed: ["muted", "status.reimbursed"] };
// Catégories enregistrées telles quelles en base (valeur) ; seul le libellé affiché est traduit
const CATEGORIES: [string, string][] = [["Transport", "transport"], ["Repas client", "clientMeal"], ["Hébergement", "lodging"], ["Fournitures", "supplies"], ["Salon", "tradeShow"], ["Autre", "other"]];

export function ExpensesTable({ rows, approver }: { rows: R[]; approver: boolean }) {
  const t = useTranslations("finance.expenses");
  const router = useRouter();
  const [pending, start] = useTransition();
  const decide = (ids: string[], s: "approved" | "rejected" | "reimbursed") => start(async () => { report(await decideExpenses(ids, s)); router.refresh(); });
  const columns: Column<R>[] = [
    { key: "on", header: t("table.date"), value: (r) => r.on, cell: (r) => formatDate(r.on) },
    { key: "who", header: t("table.employee"), cell: (r) => r.who, filter: true },
    { key: "category", header: t("table.category"), cell: (r) => r.category, filter: true },
    { key: "label", header: t("table.label"), cell: (r) => r.label },
    { key: "ttc", header: t("table.ttc"), align: "right", value: (r) => r.ttc, cell: (r) => formatMoney(r.ttc) },
    { key: "vat", header: t("table.vat"), align: "right", value: (r) => r.vat, cell: (r) => formatMoney(r.vat), hideOnMobile: true },
    { key: "status", header: t("table.status"), value: (r) => t(ST[r.status][1] as never), filter: true, cell: (r) => <Badge tone={ST[r.status][0]}>{t(ST[r.status][1] as never)}</Badge> },
    ...(approver
      ? [{ key: "act", header: "", cell: (r: R) => (r.status === "submitted" ? <span className="flex gap-1"><Button size="sm" variant="accent" disabled={pending} onClick={() => decide([r.id], "approved")}>{t("approve")}</Button><Button size="sm" disabled={pending} onClick={() => decide([r.id], "rejected")}>{t("reject")}</Button></span> : r.status === "approved" ? <Button size="sm" disabled={pending} onClick={() => decide([r.id], "reimbursed")}>{t("status.reimbursed")}</Button> : null) }]
      : []),
  ];
  return <DataTable rows={rows} columns={columns} module="finance:expenses" exportName={t("exportName")} bulk={approver ? [{ label: t("approve"), icon: "check", tone: "accent", run: (s) => decide(s.filter((x) => x.status === "submitted").map((x) => x.id), "approved") }] : []} />;
}

export function NewExpense() {
  const t = useTranslations("finance.expenses");
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [ttc, setTtc] = useState(0);
  const [rate, setRate] = useState(0.2);
  const router = useRouter();
  const vat = Math.round((ttc - ttc / (1 + rate)) * 100) / 100;
  return (
    <>
      <Button variant="accent" icon="plus" onClick={() => setOpen(true)}>{t("newShort")}</Button>
      <Drawer open={open} onClose={() => setOpen(false)} title={t("new")}>
        <form className="flex flex-col gap-4" action={(fd) => start(async () => { if (report(await submitExpense({ spent_on: String(fd.get("on")), category: String(fd.get("cat")), label: String(fd.get("label")), amount_ttc: ttc, vat_amount: vat }))) { setOpen(false); router.refresh(); } })}>
          <label className="rounded-xl border border-dashed border-black/15 p-4 text-center text-sm text-muted">
            {t("receipt")}
            <input type="file" accept="image/*,.pdf" className="sr-only" />
          </label>
          <Field label={t("table.date")}><Input name="on" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></Field>
          <Field label={t("table.category")}>
            <Select name="cat">
              {CATEGORIES.map(([v, k]) => <option key={v} value={v}>{t(`categories.${k}` as never)}</option>)}
            </Select>
          </Field>
          <Field label={t("table.label")}><Input name="label" required /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("amountTtc")}><Input type="number" step="0.01" min="0.01" required onChange={(e) => setTtc(Number(e.target.value))} /></Field>
            <Field label={t("vatRate")} hint={t("vatComputed", { amount: formatMoney(vat) })}>
              <Select value={rate} onChange={(e) => setRate(Number(e.target.value))}>
                <option value={0.2}>20 %</option>
                <option value={0.1}>10 %</option>
                <option value={0.055}>5,5 %</option>
                <option value={0}>{t("noVat")}</option>
              </Select>
            </Field>
          </div>
          <Button variant="accent" disabled={pending || ttc <= 0}>{t("submit")}</Button>
        </form>
      </Drawer>
    </>
  );
}
