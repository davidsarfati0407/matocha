import type { Metadata } from "next";
import Link from "next/link";
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

export const metadata: Metadata = { title: "Aujourd'hui" };

export default async function Dashboard() {
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
    { key: "quotes_to_send", label: "Devis à envoyer", href: "/crm/quotes?status=draft", icon: "file", module: "commercial" },
    { key: "dunning_due", label: "Relances dues", href: "/finance/dunning", icon: "bell", module: "finance" },
    { key: "invoices_overdue", label: "Factures échues", href: "/finance/invoices?status=overdue", icon: "receipt", module: "finance" },
    { key: "leaves_pending", label: "Congés à valider", href: "/hr/leaves?status=pending", icon: "sun", module: "rh" },
    { key: "wo_alerts", label: "Alertes commandes pro", href: "/ops/work-orders?alert=1", icon: "box", module: "operations" },
    { key: "stock_low", label: "Stock bas", href: "/resources/stock?tab=low", icon: "layers", module: "ressources" },
    { key: "expenses_pending", label: "Notes de frais à valider", href: "/finance/expenses?status=submitted", icon: "receipt", module: "finance" },
    { key: "to_answer", label: "Messages à répondre", href: "/comms/inbox", icon: "mail", module: "communication" },
  ].filter((t) => ctx.can(t.module as never));
  const hello = new Date().toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", timeZone: sectorConfig.entreprise.fuseau });

  const widgets = [
    {
      id: "todo",
      title: "À faire aujourd'hui",
      span: 3 as const,
      node: (
        <Card title="À faire aujourd'hui" action={<span className="text-xs text-muted">Un clic ouvre la liste filtrée, avec le contenu pré-rempli</span>}>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {todos.map((t) => {
              const n = c[t.key] ?? 0;
              return (
                <Link key={t.key} href={t.href} className={`flex items-center gap-3 rounded-xl p-3 ring-1 transition hover:-translate-y-0.5 ${n ? "bg-accent/[0.06] ring-accent/25" : "ring-black/5"}`}>
                  <span className={`grid size-9 place-items-center rounded-xl ${n ? "bg-accent text-white" : "bg-ground text-muted"}`}>
                    <Icon name={t.icon} size={16} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-xl font-semibold leading-none">{n}</span>
                    <span className="block truncate text-xs text-muted">{t.label}</span>
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
      title: "Indicateurs",
      span: 3 as const,
      node: (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {sectorConfig.kpisEnTete.map((k, i) => {
            const v = (kpis[i].data ?? {}) as { value: number | null; delta: number | null };
            const value = v.value == null ? "—" : k.unite === "eur" ? formatMoney(Number(v.value), "fr", 0) : k.unite === "pourcent" ? formatPercent(Number(v.value)) : formatNumber(Number(v.value));
            const d = v.delta == null ? null : Number(v.delta);
            return <Stat key={k.id} label={k.libelle} value={value} sub={`${d == null ? "" : `${d >= 0 ? "↑" : "↓"} ${k.unite === "nombre" ? formatNumber(Math.abs(d)) : formatPercent(Math.abs(d))} · `}${k.sousTitre}`} icon={["box", "clock", "chart"][i]} />;
          })}
          <Stat label="CA HT sur 30 jours" value={formatMoney(rev30, "fr", 0)} sub="en ligne + commandes pro" icon="chart" />
        </div>
      ),
    },
    {
      id: "revenue",
      title: "Chiffre d'affaires",
      span: 2 as const,
      node: (
        <Card title="Chiffre d'affaires HT · 30 jours">
          <ChartLabels kind="revenue" data={rev} />
        </Card>
      ),
    },
    {
      id: "minimap",
      title: "Mini-map",
      node: (
        <Card title="Qui est où" action={<Link href={`/map/${site}`} className="text-xs font-medium text-accent">Ouvrir la map →</Link>}>
          {plan.data ? <MiniMap layout={plan.data.layout as FloorPlanLayout} site={site} counts={counts} /> : <Empty title="Plan non publié" />}
          <p className="mt-2 text-xs text-muted">{(presence.data ?? []).filter((p) => ["au_poste", "reunion", "pause"].includes(p.status)).length} personnes sur site · cliquez un espace</p>
        </Card>
      ),
    },
    {
      id: "orders",
      title: "Commandes en ligne",
      node: (
        <Card title="Commandes en ligne par jour">
          <ChartLabels kind="orders" data={rev} />
        </Card>
      ),
    },
    {
      id: "agenda",
      title: "Mon agenda",
      node: (
        <Card title="Mon agenda" action={<Link href="/crm/calendar" className="text-xs font-medium text-accent">Calendrier →</Link>}>
          {(calendar.data ?? []).length === 0 ? (
            <Empty icon="calendar" title="Rien de prévu" hint="Votre agenda du jour est libre." />
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
      title: "Alertes budget et délais",
      node: (
        <Card title="Alertes budget & délais">
          {alerts.length === 0 ? (
            <Empty icon="check" title="Aucune alerte" />
          ) : (
            <ul className="space-y-2 text-sm">
              {alerts.slice(0, 6).map((w) => (
                <li key={w.id}>
                  <Link href={`/ops/work-orders/${w.id}`} className="flex items-center justify-between gap-2 hover:text-accent">
                    <span className="truncate">
                      <span className="font-mono text-xs">{w.number}</span> · {w.clients?.name ?? w.title}
                    </span>
                    {w.level >= 50 ? <Badge tone={w.level >= 100 ? "danger" : w.level >= 80 ? "warn" : "info"}>Budget {w.level} %</Badge> : w.status === "attente" ? <Badge tone="warn">En attente</Badge> : <Badge tone="danger">En retard</Badge>}
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
      title: "Fil d'activité",
      span: 2 as const,
      node: (
        <Card title="Fil d'activité en direct">
          <ActivityFeed initial={(activity.data ?? []) as ActivityEvent[]} orgId={ctx.orgId} names={names} />
        </Card>
      ),
    },
  ];

  return (
    <>
      <PageHeader kicker={hello} title={`Bonjour ${ctx.fullName.split(" ")[0]}`} subtitle={`${ctx.role.label} · ${ctx.orgName}`} />
      <WidgetBoard widgets={widgets} storageKey={`dashboard:${ctx.role.key}`} />
    </>
  );
}
