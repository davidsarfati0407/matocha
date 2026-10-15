import type { Metadata } from "next";
import Link from "next/link";
import { Card, Denied, PageHeader, Stat } from "@/components/ui/kit";
import { getCtx } from "@/lib/backoffice/context";
import { formatMoney, formatNumber } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { RaiseSimulator } from "./client";
import { SalaryCell } from "./reveal";

export const metadata: Metadata = { title: "Salaires" };

/**
 * Masse salariale : agrégée pour la finance (aucun montant individuel), détail
 * nominatif masqué pour RH et direction, chaque révélation est journalisée.
 */
export default async function SalariesPage() {
  const ctx = await getCtx();
  const individual = ctx.role.seesSalaries && ctx.can("salaires");
  if (!individual && !ctx.can("finance")) return <Denied what="les salaires" />;
  const supabase = await createClient();
  const [{ data: agg }, emps] = await Promise.all([supabase.rpc("payroll_summary"), individual ? supabase.from("employees").select("id, first_name, last_name, job_title, departments(name)").is("left_on", null).order("last_name") : Promise.resolve({ data: [] })]);
  const rows = (agg ?? []) as { department: string; headcount: number; fte: number; gross_annual: number; employer_cost: number }[];
  const gross = rows.reduce((s, r) => s + Number(r.gross_annual), 0);
  const cost = rows.reduce((s, r) => s + Number(r.employer_cost), 0);
  const fte = rows.reduce((s, r) => s + Number(r.fte), 0);
  return (
    <>
      <PageHeader title="Salaires & masse salariale" subtitle={individual ? "Montants individuels masqués par défaut · chaque révélation est inscrite au journal d'audit" : "Vue agrégée : aucun salaire individuel n'est transmis à votre navigateur"} />
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Stat label="Masse salariale brute (annuelle, variable inclus)" value={formatMoney(gross, "fr", 0)} icon="bank" />
        <Stat label="Coût employeur estimé" value={formatMoney(cost, "fr", 0)} sub={`charges patronales ${Math.round(Number(ctx.settings.employer_charges ?? 0.42) * 100)} % (paramètre)`} icon="chart" />
        <Stat label="Effectif" value={`${formatNumber(fte, "fr", 1)} ETP`} sub={`${rows.reduce((s, r) => s + r.headcount, 0)} personnes`} icon="user" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Par département" padded={false} className="lg:col-span-2">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted"><tr><th className="px-5 py-2 font-medium">Département</th><th className="px-3 text-right font-medium">Effectif</th><th className="px-3 text-right font-medium">Brut annuel</th><th className="px-5 text-right font-medium">Coût employeur</th></tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.department} className="border-t border-black/5">
                  <td className="px-5 py-2">{r.department}</td>
                  <td className="px-3 text-right tabular-nums">{r.headcount} · {formatNumber(Number(r.fte), "fr", 1)} ETP</td>
                  <td className="px-3 text-right tabular-nums">{formatMoney(Number(r.gross_annual), "fr", 0)}</td>
                  <td className="px-5 text-right tabular-nums">{formatMoney(Number(r.employer_cost), "fr", 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-5 py-3 text-xs text-muted">Les départements de moins de 3 personnes sont regroupés pour qu'aucun salaire individuel ne puisse être déduit.</p>
        </Card>
        <RaiseSimulator gross={gross} cost={cost} />
        {individual && (
          <Card title="Détail nominatif" padded={false} className="lg:col-span-3">
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
