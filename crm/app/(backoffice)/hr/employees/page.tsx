import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/kit";
import { getCtx } from "@/lib/backoffice/context";
import { createClient } from "@/lib/supabase/server";
import { EmployeesTable } from "./table";

export const metadata: Metadata = { title: "Collaborateurs" };

/** Annuaire : visible par tous ; le détail RH (soldes, contrats) seulement avec le droit RH. */
export default async function EmployeesPage() {
  const ctx = await getCtx();
  const supabase = await createClient();
  const [emps, pres] = await Promise.all([
    supabase.from("employees").select("id, first_name, last_name, job_title, email, phone, contract_type, work_rate, hired_on, leave_balance_days, departments(name), manager:manager_id(first_name, last_name)").is("left_on", null).order("last_name"),
    supabase.from("presence_status").select("employee_id, status"),
  ]);
  const st = new Map((pres.data ?? []).map((p) => [p.employee_id, p.status]));
  const hr = ctx.can("rh");
  const rows = (emps.data ?? []).map((e) => {
    const m = e.manager as unknown as { first_name: string; last_name: string } | null;
    return { id: e.id, name: `${e.first_name} ${e.last_name}`, job: e.job_title, dept: (e.departments as unknown as { name: string } | null)?.name ?? "", email: e.email ?? "", phone: e.phone ?? "", contract: e.contract_type, rate: Number(e.work_rate), hired: e.hired_on, balance: hr ? Number(e.leave_balance_days) : null, manager: m ? `${m.first_name} ${m.last_name}` : "", status: st.get(e.id) ?? "pas_badge" };
  });
  return (
    <>
      <PageHeader title="Collaborateurs" subtitle={`${rows.length} personnes · statut de présence en direct (même source que la map)`} />
      <EmployeesTable rows={rows} hr={hr} />
    </>
  );
}
