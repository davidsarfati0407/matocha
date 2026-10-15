import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Card, Denied, PageHeader, Stat } from "@/components/ui/kit";
import { getCtx } from "@/lib/backoffice/context";
import { formatMoney, formatNumber } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { RaiseSimulator } from "./client";
import { SalaryCell } from "./reveal";

export async function generateMetadata() {
  const t = await getTranslations("hr");
  return { title: t("salaries.metaTitle") };
}

/**
 * Masse salariale : agrégée pour la finance (aucun montant individuel), détail
 * nominatif masqué pour RH et direction, chaque révélation est journalisée.
 */
export default async function SalariesPage() {
  const ctx = await getCtx();
  const t = await getTranslations("hr.salaries");
  const individual = ctx.role.seesSalaries && ctx.can("salaires");
  if (!individual && !ctx.can("finance")) return <Denied what={t("deniedWhat")} />;
  const supabase = await createClient();
  const [{ data: agg }, emps] = await Promise.all([supabase.rpc("payroll_summary"), individual ? supabase.from("employees").select("id, first_name, last_name, job_title, departments(name)").is("left_on", null).order("last_name") : Promise.resolve({ data: [] })]);
  const rows = (agg ?? []) as { department: string; headcount: number; fte: number; gross_annual: number; employer_cost: number }[];
  const gross = rows.reduce((s, r) => s + Number(r.gross_annual), 0);
  const cost = rows.reduce((s, r) => s + Number(r.employer_cost), 0);
  const fte = rows.reduce((s, r) => s + Number(r.fte), 0);
  return (
    <>
      <PageHeader title={t("title")} subtitle={individual ? t("subtitleIndividual") : t("subtitleAggregate")} />
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Stat label={t("grossPayroll")} value={formatMoney(gross, "fr", 0)} icon="bank" />
        <Stat label={t("estimatedCost")} value={formatMoney(cost, "fr", 0)} sub={t("charges", { pct: Math.round(Number(ctx.settings.employer_charges ?? 0.42) * 100) })} icon="chart" />
        <Stat label={t("headcount")} value={t("fte", { n: formatNumber(fte, "fr", 1) })} sub={t("people", { count: rows.reduce((s, r) => s + r.headcount, 0) })} icon="user" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title={t("byDept")} padded={false} className="lg:col-span-2">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted"><tr><th className="px-5 py-2 font-medium">{t("colDept")}</th><th className="px-3 text-right font-medium">{t("headcount")}</th><th className="px-3 text-right font-medium">{t("grossAnnual")}</th><th className="px-5 text-right font-medium">{t("employerCost")}</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.department} className="border-t border-black/5">
                  <td className="px-5 py-2">{r.department}</td>
                  <td className="px-3 text-right tabular-nums">{r.headcount} · {t("fte", { n: formatNumber(Number(r.fte), "fr", 1) })}</td>
                  <td className="px-3 text-right tabular-nums">{formatMoney(Number(r.gross_annual), "fr", 0)}</td>
                  <td className="px-5 text-right tabular-nums">{formatMoney(Number(r.employer_cost), "fr", 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-5 py-3 text-xs text-muted">{t("groupingHint")}</p>
        </Card>
        <RaiseSimulator gross={gross} cost={cost} />
        {individual && (
          <Card title={t("detail")} padded={false} className="lg:col-span-3">
            <ul className="divide-y divide-black/5 text-sm">
              {(emps.data ?? []).map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-3 px-5 py-2">
                  <span><Link className="font-medium hover:text-accent" href={`/hr/employees/${e.id}`}>{e.first_name} {e.last_name}</Link> <span className="text-muted">· {e.job_title} · {(e.departments as unknown as { name: string } | null)?.name}</span></span>
                  <SalaryCell id={e.id} />
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>
    </>
  );
}
