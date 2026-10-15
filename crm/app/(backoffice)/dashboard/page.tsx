import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { ActivityFeed } from "@/components/backoffice/ActivityFeed";
import { MiniMap } from "@/components/backoffice/MiniMap";
import { WidgetBoard } from "@/components/backoffice/WidgetBoard";
import { Badge, Card, Empty, PageHeader, Stat } from "@/components/ui/kit";
import { Icon } from "@/components/map/hud/ui";
import { sectorConfig } from "@/config/sector.config";
import { getCtx } from "@/lib/backoffice/context";
import { formatMoney, formatNumber, formatPercent, formatTime } from "@/lib/format";
import type { FloorPlanLayout } from "@/lib/map/layout";
import type { ActivityEvent } from "@/lib/map/realtime";
import { createClient } from "@/lib/supabase/server";
import { budgetAlertLevel } from "@/lib/domain/money";
import { nowMs } from "@/lib/clock";
import { ChartLabels } from "./labels";

export async function generateMetadata() {
  const t = await getTranslations("dashboard");
  return { title: t("metaTitle") };
}

export default async function Dashboard() {
  const [t, locale] = await Promise.all([getTranslations("dashboard"), getLocale()]);
  const ctx = await getCtx();
  const supabase = await createClient();
  const site = sectorConfig.lieux[0].id;
  const [counters, kpis, revenue, calendar, activity, plan, presence, zones, emps, wos, hours] = await Promise.all([
    supabase.rpc("backoffice_counters"),
    Promise.all(sectorConfig.kpisEnTete.map((k) => supabase.rpc(k.source.replace(/\(\)$/, "")))),
    supabase.rpc("revenue_daily", { days: 30 }),
    ctx.employeeId
      ? supabase.from("calendar_events").select("id, title, type, starts_at, ends_at, owner_id, attendees").or(`owner_id.eq.${ctx.employeeId},attendees.cs.{${ctx.employeeId}}`).gte("ends_at", new Date().toISOString()).order("starts_at").limit(8)
      : Promise.resolve({ data: [] as { id: string; title: string; type: string; starts_at: string; ends_at: string }[] }),
    supabase.from("activity_events").select("id, type, entity, entity_id, payload, at").order("at", { ascending: false }).limit(20),
    supabase.from("floor_plans").select("layout").eq("status", "published").order("version", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("presence_status").select("employee_id, status, zone_id"),
    supabase.from("zones").select("id, key"),
    supabase.from("employees").select("id, first_name, last_name"),
    ctx.can("operations") ? supabase.from("work_orders").select("id, number, title, hours_budget, stage, status, due_at, clients(name)").not("stage", "in", "(livree,facturee)") : Promise.resolve({ data: [] }),
    ctx.can("operations") ? supabase.from("time_entries").select("work_order_id, hours") : Promise.resolve({ data: [] }),
  ]);
  const now = nowMs();
  const c = (counters.data ?? {}) as Record<string, number>;
  const zoneKey = new Map((zones.data ?? []).map((z) => [z.id, z.key]));
  const counts: Record<string, number> = {};
  for (const p of presence.data ?? []) if (p.zone_id && ["au_poste", "reunion", "pause"].includes(p.status)) counts[zoneKey.get(p.zone_id) ?? ""] = (counts[zoneKey.get(p.zone_id) ?? ""] ?? 0) + 1;
  const names = Object.fromEntries((emps.data ?? []).map((e) => [e.id, `${e.first_name} ${e.last_name}`]));
  const rev = (revenue.data ?? []).map((r: { day: string; shop_ht: number; pro_ht: number; orders: number }) => ({ day: r.day, ca: Number(r.shop_ht) + Number(r.pro_ht), orders: Number(r.orders) }));
  const rev30 = rev.reduce((s: number, r: { ca: number }) => s + r.ca, 0);
  const used = new Map<string, number>();
  for (const h of (hours.data ?? []) as { work_order_id: string | null; hours: number }[]) if (h.work_order_id) used.set(h.work_order_id, (used.get(h.work_order_id) ?? 0) + Number(h.hours));
  const alerts = ((wos.data ?? []) as unknown as { id: string; number: string; title: string; hours_budget: number; status: string; due_at: string | null; clients: { name: string } | null }[])
    .map((w) => ({ ...w, used: used.get(w.id) ?? 0, level: budgetAlertLevel(used.get(w.id) ?? 0, Number(w.hours_budget)) }))
    .filter((w) => w.level >= 50 || w.status === "attente" || (w.due_at && Date.parse(w.due_at) < now));

  const todos = [
    { key: "quotes_to_send", href: "/crm/quotes?status=draft", icon: "file", module: "commercial" },
    { key: "dunning_due", href: "/finance/dunning", icon: "bell", module: "finance" },
    { key: "invoices_overdue", href: "/finance/invoices?status=overdue", icon: "receipt", module: "finance" },
    { key: "leaves_pending", href: "/hr/leaves?status=pending", icon: "sun", module: "rh" },
    { key: "wo_alerts", href: "/ops/work-orders?alert=1", icon: "box", module: "operations" },
    { key: "stock_low", href: "/resources/stock?tab=low", icon: "layers", module: "ressources" },
    { key: "expenses_pending", href: "/finance/expenses?status=submitted", icon: "receipt", module: "finance" },
    { key: "to_answer", href: "/comms/inbox", icon: "mail", module: "communication" },
  ].filter((td) => ctx.can(td.module as never));
  const hello = new Date().toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: sectorConfig.entreprise.fuseau });

  const widgets = [
    {
      id: "todo",
      title: t("todo.title"),
      span: 3 as const,
      node: (
        <Card title={t("todo.title")} action={<span className="text-xs text-muted">{t("todo.hint")}</span>}>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {todos.map((td) => {
              const n = c[td.key] ?? 0;
              return (
                <Link key={td.key} href={td.href} className={`flex items-center gap-3 rounded-xl p-3 ring-1 transition hover:-translate-y-0.5 ${n ? "bg-accent/[0.06] ring-accent/25" : "ring-black/5"}`}>
                  <span className={`grid size-9 place-items-center rounded-xl ${n ? "bg-accent text-white" : "bg-ground text-muted"}`}>
                    <Icon name={td.icon} size={16} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xl font-semibold leading-none">{n}</span>
                    <span className="block truncate text-xs text-muted">{t(`todo.${td.key}`)}</span>
                  </span>
                </Link>
              );
            })}
          </div>
        </Card>
      ),
    },
    {
      id: "kpis",
      title: t("kpis.title"),
      span: 3 as const,
      node: (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {sectorConfig.kpisEnTete.map((k, i) => {
            const v = (kpis[i].data ?? {}) as { value: number | null; delta: number | null };
            const value = v.value == null ? "—" : k.unite === "eur" ? formatMoney(Number(v.value), "fr", 0) : k.unite === "pourcent" ? formatPercent(Number(v.value)) : formatNumber(Number(v.value));
            const d = v.delta == null ? null : Number(v.delta);
            return <Stat key={k.id} label={k.libelle} value={value} sub={`${d == null ? "" : `${d >= 0 ? "↑" : "↓"} ${k.unite === "nombre" ? formatNumber(Math.abs(d)) : formatPercent(Math.abs(d))} · `}${k.sousTitre}`} icon={["box", "clock", "chart"][i]} href={k.lien} />;
          })}
          <Stat label={t("kpis.revenue30")} value={formatMoney(rev30, "fr", 0)} sub={t("kpis.revenue30Sub")} icon="chart" href="/finance/treasury" />
        </div>
      ),
    },
    {
      id: "revenue",
      title: t("revenue.widget"),
      span: 2 as const,
      node: (
        <Card title={t("revenue.title")}>
          <ChartLabels kind="revenue" data={rev} />
        </Card>
      ),
    },
    {
      id: "minimap",
      title: t("minimap.widget"),
      node: (
        <Card title={t("minimap.title")} action={<Link href={`/map/${site}`} className="text-xs font-medium text-accent">{t("minimap.open")}</Link>}>
          {plan.data ? <MiniMap layout={plan.data.layout as FloorPlanLayout} site={site} counts={counts} /> : <Empty title={t("minimap.noPlan")} />}
          <p className="mt-2 text-xs text-muted">{t("minimap.onSite", { count: (presence.data ?? []).filter((p) => ["au_poste", "reunion", "pause"].includes(p.status)).length })}</p>
        </Card>
      ),
    },
    {
      id: "orders",
      title: t("orders.widget"),
      node: (
        <Card title={t("orders.title")}>
          <ChartLabels kind="orders" data={rev} />
        </Card>
      ),
    },
    {
      id: "agenda",
      title: t("agenda.title"),
      node: (
        <Card title={t("agenda.title")} action={<Link href="/crm/calendar" className="text-xs font-medium text-accent">{t("agenda.link")}</Link>}>
          {(calendar.data ?? []).length === 0 ? (
            <Empty icon="calendar" title={t("agenda.empty")} hint={t("agenda.emptyHint")} />
          ) : (
            <ul className="space-y-2 text-sm">
              {(calendar.data ?? []).map((e) => (
                <li key={e.id} className="flex gap-3">
                  <span className="w-20 shrink-0 font-mono text-xs text-muted">
                    {formatTime(e.starts_at)}–{formatTime(e.ends_at)}
                  </span>
                  <span className="font-medium">{e.title}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ),
    },
    {
      id: "alerts",
      title: t("alerts.widget"),
      node: (
        <Card title={t("alerts.title")}>
          {alerts.length === 0 ? (
            <Empty icon="check" title={t("alerts.empty")} />
          ) : (
            <ul className="space-y-2 text-sm">
              {alerts.slice(0, 6).map((w) => (
                <li key={w.id}>
                  <Link href={`/ops/work-orders/${w.id}`} className="flex items-center justify-between gap-2 hover:text-accent">
                    <span className="truncate">
                      <span className="font-mono text-xs">{w.number}</span> · {w.clients?.name ?? w.title}
                    </span>
                    {w.level >= 50 ? <Badge tone={w.level >= 100 ? "danger" : w.level >= 80 ? "warn" : "info"}>{t("alerts.budget", { level: w.level })}</Badge> : w.status === "attente" ? <Badge tone="warn">{t("alerts.waiting")}</Badge> : <Badge tone="danger">{t("alerts.late")}</Badge>}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      ),
    },
    {
      id: "activity",
      title: t("activity.widget"),
      span: 2 as const,
      node: (
        <Card title={t("activity.title")}>
          <ActivityFeed initial={(activity.data ?? []) as ActivityEvent[]} orgId={ctx.orgId} names={names} />
        </Card>
      ),
    },
  ];

  return (
    <>
      <PageHeader kicker={hello} title={t("hello", { name: ctx.fullName.split(" ")[0] })} subtitle={`${ctx.role.label} · ${ctx.orgName}`} />
      <WidgetBoard widgets={widgets} storageKey={`dashboard:${ctx.role.key}`} />
    </>
  );
}
