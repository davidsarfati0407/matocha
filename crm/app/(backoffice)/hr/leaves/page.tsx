import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Badge, Card, Empty, PageHeader } from "@/components/ui/kit";
import { getCtx } from "@/lib/backoffice/context";
import { LEAVE_STATUS, LEAVE_TYPE } from "@/lib/backoffice/labels";
import { checkLeave } from "@/lib/domain/leave";
import { formatDate, formatNumber } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { LeaveDecision, RequestLeave } from "./client";

export async function generateMetadata() {
  const t = await getTranslations("hr");
  return { title: t("leaves.metaTitle") };
}

export default async function LeavesPage() {
  const ctx = await getCtx();
  const t = await getTranslations("hr.leaves");
  const tAll = await getTranslations();
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
      <PageHeader title={t("title")} subtitle={t("subtitle", { pct: Math.round(minPresence * 100) })} actions={me ? <RequestLeave balance={Number(me.leave_balance_days)} /> : undefined} />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="flex flex-col gap-3 lg:col-span-2">
          <h2 className="text-sm font-semibold">{t("toApprove", { count: pending.length })}</h2>
          {pending.length === 0 && <Empty icon="check" title={t("noPending")} />}
          {pending.map((p) => (
            <Card key={p.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <Link className="font-semibold hover:text-accent" href={`/hr/employees/${p.employee_id}`}>{p.name}</Link>
                  <p className="text-sm">{t.rich("pendingLine", { type: tAll(LEAVE_TYPE[p.type] as never), from: formatDate(p.starts_on), to: formatDate(p.ends_on), days: formatNumber(Number(p.days), "fr", 1), balance: formatNumber(p.balance, "fr", 1), b: (c) => <b>{c}</b>, muted: (c) => <span className="text-muted">{c}</span> })}</p>
                  {p.comment && <p className="text-sm text-muted">« {p.comment} »</p>}
                  <ul className="mt-2 space-y-1 text-xs">
                    {p.check.errors.map((x) => <li key={x.code} className="font-medium text-[#b3402a]">✕ {tAll(`domain.leave.${x.code}`, x.values)}</li>)}
                    {p.check.warnings.map((x, i) => <li key={i} className="text-[#9a6a00]">! {x.code === "presence" ? tAll("domain.leave.presence", { pct: x.values!.pct, date: new Date(`${x.values!.date}T12:00:00Z`) }) : tAll(`domain.leave.${x.code}`, x.values)}</li>)}
                    {p.check.ok && p.check.warnings.length === 0 && <li className="text-brand">✓ {t("allRulesOk")}</li>}
                  </ul>
                </div>
                <LeaveDecision id={p.id} blocked={!p.check.ok} />
              </div>
            </Card>
          ))}
        </div>
        <div className="flex flex-col gap-4">
          <Card title={t("upcoming")}>
            <ul className="text-sm">
              {upcoming.map((l) => {
                const e = E.get(l.employee_id);
                return <li key={l.id} className="flex justify-between py-1"><span>{e?.first_name} {e?.last_name?.[0]}.</span><span className="text-muted">{formatDate(l.starts_on)} → {formatDate(l.ends_on)}</span></li>;
              })}
              {upcoming.length === 0 && <li className="text-muted">{t("none")}</li>}
            </ul>
          </Card>
          {me && (
            <Card title={t("mine")}>
              <ul className="text-sm">
                {mine.map((l) => <li key={l.id} className="flex justify-between py-1"><span>{tAll(LEAVE_TYPE[l.type] as never)} · {formatDate(l.starts_on)}</span><Badge tone={LEAVE_STATUS[l.status][0]}>{tAll(LEAVE_STATUS[l.status][1] as never)}</Badge></li>)}
                {mine.length === 0 && <li className="text-muted">{t("noRequest")}</li>}
              </ul>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
