import type { Metadata } from "next";
import { PageHeader, Stat } from "@/components/ui/kit";
import { getCtx } from "@/lib/backoffice/context";
import { formatMoney } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { ExpensesTable, NewExpense } from "./client";

export const metadata: Metadata = { title: "Notes de frais" };

export default async function ExpensesPage() {
  const ctx = await getCtx();
  const supabase = await createClient();
  const { data } = await supabase.from("expenses").select("id, spent_on, category, label, amount_ttc, vat_amount, status, employee_id, employees:employee_id(first_name, last_name)").order("spent_on", { ascending: false });
  const rows = (data ?? []).map((e) => {
    const p = e.employees as unknown as { first_name: string; last_name: string } | null;
    return { id: e.id, on: e.spent_on, category: e.category, label: e.label, ttc: Number(e.amount_ttc), vat: Number(e.vat_amount), status: e.status, who: p ? `${p.first_name} ${p.last_name}` : "", mine: e.employee_id === ctx.employeeId };
  });
  const pending = rows.filter((r) => r.status === "submitted");
  const approver = ctx.can("finance", "update");
  return (
    <>
      <PageHeader title="Notes de frais" subtitle={approver ? "Validation en un clic, TVA récupérable isolée" : "Vos notes de frais et leur statut"} actions={ctx.employeeId ? <NewExpense /> : undefined} />
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Stat label="À valider" value={pending.length} tone={pending.length ? "warn" : undefined} sub={formatMoney(pending.reduce((s, r) => s + r.ttc, 0))} icon="receipt" />
        <Stat label="TVA récupérable" value={formatMoney(rows.filter((r) => r.status !== "rejected").reduce((s, r) => s + r.vat, 0))} icon="bank" />
        <Stat label="Validées à rembourser" value={formatMoney(rows.filter((r) => r.status === "approved").reduce((s, r) => s + r.ttc, 0))} icon="check" />
      </div>
      <ExpensesTable rows={rows} approver={approver} />
    </>
  );
}
