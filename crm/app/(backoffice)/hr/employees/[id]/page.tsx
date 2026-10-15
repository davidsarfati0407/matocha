import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Pill } from "@/components/map/hud/ui";
import { Badge, ButtonLink, Card, Dl, PageHeader, Stat, Tabs } from "@/components/ui/kit";
import { sectorConfig } from "@/config/sector.config";
import { getCtx } from "@/lib/backoffice/context";
import { LEAVE_STATUS, LEAVE_TYPE, PRESENCE } from "@/lib/backoffice/labels";
import { nowMs } from "@/lib/clock";
import { computeDay, groupByLocalDay, weeklyOvertime, type Badge as B } from "@/lib/domain/time";
import { formatDate, formatNumber, formatTime } from "@/lib/format";
import { mapHref } from "@/lib/map/links";
import { createClient } from "@/lib/supabase/server";
import { OnboardingItem, SalaryCard } from "./client";

export async function generateMetadata() {
  const t = await getTranslations("hr");
  return { title: t("employee.metaTitle") };
}


export default async function EmployeePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { id } = await params;
  const tab = (await searchParams).tab ?? "resume";
  const ctx = await getCtx();
  const t = await getTranslations("hr.employee");
  const tAll = await getTranslations();
  const dateLocale = (await getLocale()) === "en" ? "en-GB" : "fr-FR";
  const hm = (min: number) => t("hm", { h: Math.floor(min / 60), m: String(min % 60).padStart(2, "0") });
  const supabase = await createClient();
  const { data: e } = await supabase.from("employees").select("*, departments(name), manager:manager_id(id, first_name, last_name)").eq("id", id).maybeSingle();
  if (!e) notFound();
  const self = ctx.employeeId === id;
  const hr = ctx.can("rh") || self;
  const since = new Date(nowMs() - 13 * 86400_000).toISOString();
  const [pres, badges, leaves, reviews, trainings, onboarding, team, assets] = await Promise.all([
    supabase.from("presence_status").select("status, since, first_in, current_event").eq("employee_id", id).maybeSingle(),
    hr ? supabase.from("badge_events").select("kind, at").eq("employee_id", id).gte("at", since).order("at") : Promise.resolve({ data: [] }),
    supabase.from("leave_requests").select("id, type, starts_on, ends_on, days, status").eq("employee_id", id).order("starts_on", { ascending: false }),
    supabase.from("reviews").select("id, scheduled_on, status, summary").eq("employee_id", id),
    supabase.from("trainings").select("id, title, starts_on, hours, status").eq("employee_id", id),
    supabase.from("onboarding_tasks").select("id, kind, title, due_on, done_at").eq("employee_id", id).order("due_on"),
    supabase.from("employees").select("id, first_name, last_name, job_title").eq("manager_id", id),
    supabase.from("assets").select("id, name, type").eq("assigned_employee_id", id),
  ]);
  const byDay = groupByLocalDay((badges.data ?? []) as B[]);
  const now = nowMs();
  const days = [...byDay.entries()].sort(([a], [b]) => b.localeCompare(a)).map(([d, list]) => ({ d, ...computeDay(list, now) }));
  const monday = new Date(now);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  const weekMin = days.filter((x) => x.d >= monday.toISOString().slice(0, 10)).reduce((s, x) => s + x.workedMin, 0);
  const mgr = e.manager as unknown as { id: string; first_name: string; last_name: string } | null;
  const status = pres.data?.status ?? "pas_badge";
  return (
    <>
      <PageHeader
        kicker={(e.departments as unknown as { name: string } | null)?.name}
        title={`${e.first_name} ${e.last_name}`}
        subtitle={<span className="inline-flex items-center gap-2">{e.job_title} · <Pill tone={status}>{PRESENCE[status] ? tAll(PRESENCE[status] as never) : status}</Pill>{pres.data?.current_event ? ` · ${pres.data.current_event}` : ""}</span>}
        actions={<ButtonLink href={mapHref(sectorConfig.lieux[0].id, "employees", id)} icon="map">{t("seeOnMap")}</ButtonLink>}
      />
      {hr && (
        <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label={t("arrivedToday")} value={pres.data?.first_in ? formatTime(pres.data.first_in) : "—"} icon="badge" />
          <Stat label={t("thisWeek")} value={hm(weekMin)} sub={t("baseHours", { h: formatNumber(35 * Number(e.work_rate), "fr", 1) })} icon="clock" />
          <Stat label={t("overtimeWeek")} value={t("hours", { h: formatNumber(weeklyOvertime(weekMin, Number(e.work_rate)), "fr", 2) })} sub={t("overtimeTotal", { h: formatNumber(Number(e.overtime_hours), "fr", 1) })} icon="timer" />
          <Stat label={t("leaveBalance")} value={t("days", { n: formatNumber(Number(e.leave_balance_days), "fr", 1) })} icon="sun" href="/hr/leaves" />
        </div>
      )}
      <Tabs
        current={tab}
        tabs={[
          { id: "resume", label: t("tabSummary"), href: "?tab=resume" },
          ...(hr ? [{ id: "temps", label: t("tabTimesheet"), href: "?tab=temps", count: days.length }] : []),
          { id: "conges", label: t("tabLeaves"), href: "?tab=conges", count: (leaves.data ?? []).length },
          { id: "dev", label: t("tabDev"), href: "?tab=dev", count: (reviews.data ?? []).length + (trainings.data ?? []).length },
          ...(onboarding.data?.length ? [{ id: "integration", label: t("tabOnboarding"), href: "?tab=integration", count: onboarding.data.length }] : []),
        ]}
      />
      {tab === "resume" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card title={t("contact")}>
            <Dl items={[[t("email"), e.email], [t("phone"), e.phone], [t("manager"), mgr ? <Link className="text-accent" href={`/hr/employees/${mgr.id}`}>{mgr.first_name} {mgr.last_name}</Link> : null], [t("skills"), (e.skills ?? []).join(", ") || null]]} />
          </Card>
          {hr && (
            <Card title={t("contract")}>
              <Dl items={[[t("contractType"), e.contract_type], [t("workRate"), t("percent", { n: Math.round(Number(e.work_rate) * 100) })], [t("hiredOn"), formatDate(e.hired_on)]]} />
            </Card>
          )}
          {ctx.role.seesSalaries && ctx.can("salaires") ? <SalaryCard id={id} /> : <Card title={t("pay")}><p className="text-sm text-muted">{t("payHidden")}</p></Card>}
          <Card title={t("team")}>
            {(team.data ?? []).length === 0 ? <p className="text-sm text-muted">{t("noTeam")}</p> : (
              <ul className="text-sm">
                {(team.data ?? []).map((m) => <li key={m.id}><Link className="hover:text-accent" href={`/hr/employees/${m.id}`}>{m.first_name} {m.last_name}</Link> <span className="text-muted">· {m.job_title}</span></li>)}
              </ul>
            )}
          </Card>
          <Card title={t("assets")}>
            {(assets.data ?? []).length === 0 ? <p className="text-sm text-muted">{t("none")}</p> : (
              <ul className="text-sm">{(assets.data ?? []).map((a) => <li key={a.id}><Link className="hover:text-accent" href={`/resources/assets/${a.id}`}>{a.name}</Link></li>)}</ul>
            )}
          </Card>
        </div>
      )}
      {tab === "temps" && hr && (
        <Card padded={false}>
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted">
              <tr><th className="px-5 py-2 font-medium">{t("colDay")}</th><th className="px-3 font-medium">{t("colIn")}</th><th className="px-3 font-medium">{t("colOut")}</th><th className="px-3 font-medium">{t("colPause")}</th><th className="px-3 text-right font-medium">{t("colWorked")}</th><th className="px-5 font-medium">{t("colChecks")}</th></tr>
            </thead>
            <tbody>
              {days.map((x) => (
                <tr key={x.d} className="border-t border-black/5">
                  <td className="px-5 py-2">{new Date(`${x.d}T12:00:00Z`).toLocaleDateString(dateLocale, { weekday: "short", day: "2-digit", month: "2-digit" })}</td>
                  <td className="px-3 tabular-nums">{x.firstIn ? formatTime(x.firstIn) : "—"}</td>
                  <td className="px-3 tabular-nums">{x.open ? <Badge tone="info">{t("ongoing")}</Badge> : x.lastOut ? formatTime(x.lastOut) : "—"}</td>
                  <td className="px-3 tabular-nums">{t("minutes", { n: x.pauseMin })}</td>
                  <td className="px-3 text-right tabular-nums">{hm(x.workedMin)}</td>
                  <td className="px-5">{x.anomalies.length ? <Badge tone="warn">{x.anomalies.map((a) => tAll(`domain.anomaly.${a}`)).join(", ")}</Badge> : <span className="text-muted">{t("ok")}</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="px-5 py-3 text-xs text-muted">{t("timesheetHint")}</p>
        </Card>
      )}
      {tab === "conges" && (
        <Card padded={false}>
          <ul className="divide-y divide-black/5 text-sm">
            {(leaves.data ?? []).map((l) => (
              <li key={l.id} className="flex justify-between px-5 py-2.5">
                <span>{t("leaveLine", { type: tAll(LEAVE_TYPE[l.type] as never), from: formatDate(l.starts_on), to: formatDate(l.ends_on), days: formatNumber(Number(l.days), "fr", 1) })}</span>
                <Badge tone={LEAVE_STATUS[l.status][0]}>{tAll(LEAVE_STATUS[l.status][1] as never)}</Badge>
              </li>
            ))}
            {(leaves.data ?? []).length === 0 && <li className="px-5 py-3 text-muted">{t("noLeave")}</li>}
          </ul>
        </Card>
      )}
      {tab === "dev" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title={t("reviews")}>
            <ul className="text-sm">{(reviews.data ?? []).map((r) => <li key={r.id} className="py-1">{r.scheduled_on ? formatDate(r.scheduled_on) : "—"} · <Badge tone={r.status === "done" ? "ok" : "info"}>{r.status === "done" ? t("reviewDone") : t("reviewPlanned")}</Badge> {r.summary && <span className="text-muted">· {r.summary}</span>}</li>)}</ul>
          </Card>
          <Card title={t("trainings")}>
            <ul className="text-sm">{(trainings.data ?? []).map((tr) => <li key={tr.id} className="py-1">{tr.title} · {tr.starts_on ? formatDate(tr.starts_on) : ""} · {t("hours", { h: String(tr.hours) })}</li>)}</ul>
          </Card>
        </div>
      )}
      {tab === "integration" && (
        <Card title={t("onboarding")}>
          {(onboarding.data ?? []).map((o) => <OnboardingItem key={o.id} id={o.id} title={o.title} due={o.due_on} done={Boolean(o.done_at)} disabled={!ctx.can("rh", "update")} />)}
        </Card>
      )}
    </>
  );
}
