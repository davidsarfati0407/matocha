import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, Empty, PageHeader } from "@/components/ui/kit";
import { getCtx } from "@/lib/backoffice/context";
import { LEAVE_STATUS, LEAVE_TYPE } from "@/lib/backoffice/labels";
import { checkLeave } from "@/lib/domain/leave";
import { formatDate, formatNumber } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { LeaveDecision, RequestLeave } from "./client";

export const metadata: Metadata = { title: "Congés" };

export default async function LeavesPage() {
  const ctx = await getCtx();
  const supabase = await createClient();
  const [leaves, emps] = await Promise.all([
    supabase.from("leave_requests").select("id, employee_id, type, starts_on, ends_on, days, status, comment, created_at").order("starts_on"),
    supabase.from("employees").select("id, first_name, last_name, department_id, leave_balance_days, manager_id").is("left_on", null),
  ]);
  const E = new Map((emps.data ?? []).map((e) => [e.id, e]));
  const all = leaves.data ?? [];
  const blackouts = (ctx.settings.leave_blackouts as { from: string; to: string; label: string }[] | undefined) ?? [];
  const minPresence = Number(ctx.settings.min_presence ?? 0.5);
  const pending = all.filter((l) => l.status === "pending" && l.employee_id !== ctx.employeeId).map((l) => {
    const e = E.get(l.employee_id)!;
    const team = (emps.data ?? []).filter((x) => x.department_id === e?.department_id);
    const check = checkLeave({ type: l.type, from: l.starts_on, to: l.ends_on, days: Number(l.days), balance: Number(e?.leave_balance_days ?? 0), blackouts, teamSize: team.length, teamAbsences: all.filter((a) => a.status === "approved" && a.employee_id !== l.employee_id && team.some((t) => t.id === a.employee_id)).map((a) => ({ from: a.starts_on, to: a.ends_on })), minPresence });
    return { ...l, name: e ? `${e.first_name} ${e.last_name}` : "?", balance: Number(e?.leave_balance_days ?? 0), check };
  });
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = all.filter((l) => l.status === "approved" && l.ends_on >= today);
  const mine = all.filter((l) => l.employee_id === ctx.employeeId);
  const me = ctx.employeeId ? E.get(ctx.employeeId) : null;
  return (
    <>
      <PageHeader title="Congés & absences" subtitle={`Contrôles automatiques : solde, périodes bloquées, présence minimale de l'équipe (${Math.round(minPresence * 100)} %)`} actions={me ? <RequestLeave balance={Number(me.leave_balance_days)} /> : undefined} />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-3 lg:col-span-2">
          <h2 className="text-sm font-semibold">À valider ({pending.length})</h2>
          {pending.length === 0 && <Empty icon="check" title="Aucune demande en attente" />}
          {pending.map((p) => (
            <Card key={p.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link className="font-semibold hover:text-accent" href={`/hr/employees/${p.employee_id}`}>{p.name}</Link>
                  <p className="text-sm">{LEAVE_TYPE[p.type]} · du {formatDate(p.starts_on)} au {formatDate(p.ends_on)} · <b>{formatNumber(Number(p.days), "fr", 1)} j</b> <span className="text-muted">(solde {formatNumber(p.balance, "fr", 1)} j)</span></p>
                  {p.comment && <p className="text-sm text-muted">« {p.comment} »</p>}
                  <ul className="mt-2 space-y-1 text-xs">
                    {p.check.errors.map((x) => <li key={x} className="font-medium text-[#b3402a]">✕ {x}</li>)}
                    {p.check.warnings.map((x) => <li key={x} className="text-[#9a6a00]">! {x}</li>)}
                    {p.check.ok && p.check.warnings.length === 0 && <li className="text-brand">✓ Toutes les règles sont respectées</li>}
                  </ul>
                </div>
                <LeaveDecision id={p.id} blocked={!p.check.ok} />
              </div>
            </Card>
          ))}
        </div>
        <div className="flex flex-col gap-4">
          <Card title="Absences à venir">
            <ul className="text-sm">
              {upcoming.map((l) => {
                const e = E.get(l.employee_id);
                return <li key={l.id} className="flex justify-between py-1"><span>{e?.first_name} {e?.last_name?.[0]}.</span><span className="text-muted">{formatDate(l.starts_on)} → {formatDate(l.ends_on)}</span></li>;
              })}
              {upcoming.length === 0 && <li className="text-muted">Aucune.</li>}
            </ul>
          </Card>
          {me && (
            <Card title="Mes demandes">
              <ul className="text-sm">
                {mine.map((l) => <li key={l.id} className="flex justify-between py-1"><span>{LEAVE_TYPE[l.type]} · {formatDate(l.starts_on)}</span><Badge tone={LEAVE_STATUS[l.status][0]}>{LEAVE_STATUS[l.status][1]}</Badge></li>)}
                {mine.length === 0 && <li className="text-muted">Aucune demande.</li>}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
