import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { Logo } from "@/components/ui/Logo";
import { sectorConfig } from "@/config/sector.config";
import { LOCALES } from "@/i18n/request";
import { formatMoney, formatNumber, formatPercent, formatTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { LocaleSwitch, RevealSalary } from "./client";

export const metadata: Metadata = { title: "Page technique" };

type Kpi = { value: number | null; delta: number | null; target?: number | null };

const STATUS_STYLE: Record<string, string> = {
  au_poste: "bg-ok/12 text-ok",
  reunion: "bg-[#3D5A80]/12 text-[#3D5A80]",
  pause: "bg-warn/15 text-warn",
  teletravail: "bg-matcha/20 text-brand",
  deplacement: "bg-black/5 text-muted",
  absent: "bg-black/5 text-muted",
  pas_badge: "bg-accent/12 text-accent",
  parti: "bg-black/5 text-muted",
};

export default async function TechPage() {
  const t = await getTranslations("tech");
  const tp = await getTranslations("presence");
  const tc = await getTranslations("common");
  const locale = await getLocale();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, employee_id, role_id, roles(key, label, sees_salaries, edits_plan)")
    .eq("user_id", user!.id)
    .single();
  const role = profile?.roles as unknown as { key: string; label: string; sees_salaries: boolean; edits_plan: boolean } | null;

  const [perms, ordersKpi, onTimeKpi, revenueKpi, counts, employees, presence, workOrders, stock, activity] = await Promise.all([
    supabase.from("permissions").select("module, action").eq("role_id", profile?.role_id ?? ""),
    supabase.rpc("kpi_orders_today"),
    supabase.rpc("kpi_shipped_on_time"),
    supabase.rpc("kpi_revenue_today"),
    supabase.rpc("tech_table_counts"),
    supabase.from("employees").select("id, first_name, last_name, job_title").order("last_name"),
    supabase.from("presence_status").select("employee_id, status, since, first_in, current_event, leave_type"),
    supabase.from("work_orders").select("number, title, stage, status, clients(name)").order("number"),
    supabase.from("stock_items").select("reference, name, quantity, min_quantity, location"),
    supabase.from("activity_events").select("type, at, payload").order("at", { ascending: false }).limit(8),
  ]);

  // Salaires : on ne demande rien si le rôle n'y a pas droit ; la RLS bloquerait de toute façon.
  const canSeeSalaries = Boolean(role?.sees_salaries);

  const presenceBy = new Map((presence.data ?? []).map((p) => [p.employee_id, p]));
  const people = (employees.data ?? []).map((e) => ({ ...e, p: presenceBy.get(e.id) }));
  const statusCounts = people.reduce<Record<string, number>>((acc, e) => {
    const s = e.p?.status ?? "absent";
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});
  const stages = sectorConfig.objetMetierCentral.etapes;
  const lowStock = (stock.data ?? []).filter((s) => Number(s.quantity) < Number(s.min_quantity));
  const matrix = new Map<string, Set<string>>();
  for (const p of perms.data ?? []) matrix.set(p.module, (matrix.get(p.module) ?? new Set()).add(p.action));
  const modules = ["pilotage", "communication", "commercial", "operations", "rh", "salaires", "finance", "ressources", "ia", "organisation", "plan"];
  const actions = ["read", "create", "update", "delete", "export"];

  const kpis: { label: string; k: Kpi; fmt: (v: number) => string; deltaFmt: (v: number) => string }[] = [
    { label: t("ordersToday"), k: ordersKpi.data as Kpi, fmt: (v) => formatNumber(v, locale), deltaFmt: (v) => `${v >= 0 ? "+" : ""}${formatNumber(v, locale)}` },
    { label: t("onTime"), k: onTimeKpi.data as Kpi, fmt: (v) => formatPercent(v, locale), deltaFmt: (v) => `${v >= 0 ? "+" : ""}${formatPercent(v, locale)}` },
    { label: t("revenueToday"), k: revenueKpi.data as Kpi, fmt: (v) => formatMoney(v, locale, 0), deltaFmt: (v) => `${v >= 0 ? "+" : ""}${formatPercent(v, locale)}` },
  ];

  return (
    <main className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6">
      <header className="card flex flex-wrap items-center gap-4 px-5 py-4">
        <Logo />
        <div className="min-w-0">
          <h1 className="text-lg font-semibold tracking-tight">{t("title")}</h1>
          <p className="text-sm text-muted">{t("intro")}</p>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <span className="rounded-full bg-accent/12 px-3 py-1 text-xs font-medium text-accent">{tc("demoBadge")} · {sectorConfig.entreprise.statutDemo}</span>
          <LocaleSwitch locales={[...LOCALES]} />
          <form action="/auth/signout" method="post">
            <button className="rounded-full border border-black/10 px-3 py-1.5 text-sm hover:border-brand/40">{tc("signOut")}</button>
          </form>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="card p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand">{t("session")}</h2>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-sm">
            <dt className="text-muted">{t("user")}</dt>
            <dd className="truncate font-medium">{profile?.full_name} · <span className="font-mono text-xs">{user?.email}</span></dd>
            <dt className="text-muted">{t("role")}</dt>
            <dd className="font-medium">{role?.label}</dd>
            <dt className="text-muted">{t("employee")}</dt>
            <dd>{profile?.employee_id ? <code className="text-xs">{profile.employee_id.slice(0, 8)}…</code> : "—"}</dd>
            <dt className="text-muted">{t("salaryAccess")}</dt>
            <dd className={canSeeSalaries ? "font-medium text-ok" : "text-muted"}>{canSeeSalaries ? tc("yes") : tc("no")}</dd>
          </dl>
        </div>
        <div className="card p-5 md:col-span-2">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand">{t("kpis")}</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {kpis.map(({ label, k, fmt, deltaFmt }) => (
              <div key={label} className="rounded-xl bg-ground/60 p-4">
                <p className="text-sm text-muted">{label}</p>
                <p className="text-2xl font-semibold tracking-tight">{k?.value == null ? "—" : fmt(Number(k.value))}</p>
                <p className="text-xs text-muted">
                  {k?.delta != null && <span className={Number(k.delta) >= 0 ? "text-ok" : "text-accent"}>{deltaFmt(Number(k.delta))} </span>}
                  {k?.target ? t("target", { value: formatMoney(Number(k.target), locale, 0) }) : t("vsYesterday")}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <div className="mb-3 flex flex-wrap items-baseline gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-brand">{t("presence")}</h2>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(statusCounts).map(([s, n]) => (
                <span key={s} className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[s]}`}>
                  {tp(s)} · {n}
                </span>
              ))}
            </div>
          </div>
          <ul className="grid gap-x-6 sm:grid-cols-2">
            {people.map((e) => (
              <li key={e.id} className="flex items-center gap-3 border-b border-black/5 py-2 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-medium">{e.first_name} {e.last_name}</span>
                  <span className="block truncate text-xs text-muted">{e.job_title}{e.p?.current_event ? ` · ${e.p.current_event}` : e.p?.leave_type ? ` · ${e.p.leave_type}` : ""}</span>
                </span>
                {e.p?.first_in && <span className="font-mono text-xs text-muted">{formatTime(e.p.first_in, locale)}</span>}
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[e.p?.status ?? "absent"]}`}>{tp(e.p?.status ?? "absent")}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-4">
          <div className="card p-5">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand">{t("workOrders")}</h2>
            <ol className="flex flex-col gap-2">
              {stages.map((s) => {
                const items = (workOrders.data ?? []).filter((w) => w.stage === s.id);
                return (
                  <li key={s.id} className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{s.libelle}</span>
                      <span className="text-xs text-muted">{items.length}</span>
                    </div>
                    {items.map((w) => (
                      <p key={w.number} className="truncate pl-3 text-xs text-muted">
                        <span className="font-mono">{w.number}</span> · {(w.clients as unknown as { name: string } | null)?.name ?? "—"}
                        {w.status === "attente" && <span className="ml-1 text-warn">● attente</span>}
                      </p>
                    ))}
                  </li>
                );
              })}
            </ol>
          </div>
          <div className="card p-5">
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand">{t("lowStock")}</h2>
            <ul className="flex flex-col gap-1.5 text-sm">
              {lowStock.map((s) => (
                <li key={s.reference} className="flex justify-between gap-2">
                  <span className="truncate">{s.name} <span className="text-xs text-muted">{s.location}</span></span>
                  <span className="font-mono text-xs text-accent">{formatNumber(Number(s.quantity), locale)} / {formatNumber(Number(s.min_quantity), locale)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand">{t("salaries")}</h2>
          {canSeeSalaries ? (
            <ul className="flex flex-col gap-2 text-sm">
              {people.slice(0, 6).map((e) => (
                <li key={e.id} className="flex items-center justify-between gap-2">
                  <span className="truncate">{e.first_name} {e.last_name}</span>
                  <RevealSalary employeeId={e.id} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">{t("salaryHidden")}</p>
          )}
        </div>
        <div className="card p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand">{t("permissions")}</h2>
          <table className="w-full text-xs">
            <thead>
              <tr className="text-muted">
                <th className="py-1 text-left font-medium" />
                {actions.map((a) => (
                  <th key={a} className="py-1 font-medium">{a.slice(0, 3)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {modules.map((m) => (
                <tr key={m} className="border-t border-black/5">
                  <td className="py-1">{m}</td>
                  {actions.map((a) => (
                    <td key={a} className="text-center" aria-label={`${m} ${a}`}>
                      {matrix.get(m)?.has(a) ? <span className="text-ok">●</span> : <span className="text-black/15">·</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand">{t("tables")}</h2>
          <ul className="grid max-h-80 grid-cols-2 gap-x-4 overflow-auto text-xs">
            {(counts.data ?? []).map((c: { table_name: string; visible: number }) => (
              <li key={c.table_name} className="flex justify-between border-b border-black/5 py-1">
                <span className="truncate">{c.table_name}</span>
                <span className={`font-mono ${c.visible === 0 ? "text-black/25" : ""}`}>{formatNumber(c.visible, locale)}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="card p-5 lg:col-span-2">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand">{t("activity")}</h2>
          <ul className="flex flex-col gap-1.5 text-sm">
            {(activity.data ?? []).map((a, i) => (
              <li key={i} className="flex gap-3">
                <span className="font-mono text-xs text-muted">{formatTime(a.at, locale)}</span>
                <span className="font-medium">{a.type}</span>
                <span className="truncate text-xs text-muted">{JSON.stringify(a.payload)}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-5">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-brand">{t("integrations")}</h2>
          <ul className="flex flex-col gap-2 text-sm">
            {sectorConfig.integrations.map((i) => (
              <li key={i.id} className="flex items-center justify-between gap-2">
                <span className="truncate">{i.nom}</span>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${i.mode === "simule" ? "bg-warn/15 text-warn" : "bg-ok/12 text-ok"}`}>
                  {i.mode === "simule" ? tc("simulated") : tc("connected")}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-muted">
            {t("config")} : {sectorConfig.lieux[0].zones.length} espaces · {sectorConfig.postes.length} postes · {stages.length} étapes. {t("mapComing")}
          </p>
        </div>
      </section>
    </main>
  );
}
