import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Badge, ButtonLink, Card, Denied, Dl, Empty, PageHeader, Progress, Tabs } from "@/components/ui/kit";
import { sectorConfig } from "@/config/sector.config";
import { requirePerm } from "@/lib/backoffice/context";
import { budgetAlertLevel, computeTotals } from "@/lib/domain/money";
import { STAGES, stageIndex, stageLabel } from "@/lib/domain/stages";
import { formatDate, formatMoney, formatNumber, formatTime } from "@/lib/format";
import { mapHref } from "@/lib/map/links";
import { createClient } from "@/lib/supabase/server";
import { BudgetBadge } from "../view";
import { ChecklistItem, ConsumeForm, StageActions, TimeForm } from "./client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ops.workOrder");
  return { title: t("title") };
}

export default async function WorkOrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const t = await getTranslations("ops.workOrder");
  const { ctx, allowed } = await requirePerm("operations");
  if (!allowed) return <Denied what={t("deniedWhat")} />;
  const { id } = await params;
  const tab = (await searchParams).tab ?? "resume";
  const supabase = await createClient();
  const { data: wo } = await supabase
    .from("work_orders")
    .select("*, clients(id, name, city, email, phone), owner:owner_id(id, first_name, last_name), zones(key, name), quotes(id, number, discount_pct)")
    .eq("id", id)
    .maybeSingle();
  if (!wo) notFound();
  const [stages, checklists, tasks, time, moves, stock, invoices, docs, threads, lines] = await Promise.all([
    supabase.from("work_order_stages").select("stage, entered_at, left_at, actor:actor_id(first_name)").eq("work_order_id", id).order("entered_at"),
    supabase.from("checklists").select("id, title, items").eq("work_order_id", id),
    supabase.from("tasks").select("id, title, status, progress, due_on, assignee:assignee_id(first_name, last_name)").eq("work_order_id", id).order("position"),
    supabase.from("time_entries").select("id, worked_on, hours, billable, note, invoice_id, employee:employee_id(first_name, last_name)").eq("work_order_id", id).order("worked_on", { ascending: false }),
    supabase.from("stock_movements").select("id, quantity, at, reason, stock_items(name, reference), lots(number)").eq("work_order_id", id).order("at", { ascending: false }),
    supabase.from("stock_items").select("id, name, reference, quantity").order("name"),
    supabase.from("invoices").select("id, number, status, total_ttc").eq("work_order_id", id),
    supabase.from("documents").select("id, name, kind, external_url, created_at").eq("entity_id", id),
    supabase.from("threads").select("id, subject, status, last_message_at").eq("work_order_id", id),
    wo.quote_id ? supabase.from("quote_lines").select("label, quantity, unit_price, unit_cost, vat_rate").eq("quote_id", wo.quote_id).order("position") : Promise.resolve({ data: [] }),
  ]);
  const client = wo.clients as { id: string; name: string; city: string; email: string; phone: string } | null;
  const owner = wo.owner as { id: string; first_name: string; last_name: string } | null;
  const used = (time.data ?? []).reduce((s, t) => s + Number(t.hours), 0);
  const level = budgetAlertLevel(used, Number(wo.hours_budget));
  const perPerson = new Map<string, number>();
  for (const te of time.data ?? []) {
    const e = te.employee as unknown as { first_name: string; last_name: string } | null;
    const k = e ? `${e.first_name} ${e.last_name}` : "—";
    perPerson.set(k, (perPerson.get(k) ?? 0) + Number(te.hours));
  }
  const idx = stageIndex(wo.stage);
  const totals = computeTotals((lines.data ?? []).map((l) => ({ quantity: Number(l.quantity), unitPrice: Number(l.unit_price), unitCost: Number(l.unit_cost), vatRate: Number(l.vat_rate) })), { discountPct: Number((wo.quotes as { discount_pct?: number } | null)?.discount_pct ?? 0) });
  const base = `/ops/work-orders/${id}`;
  const site = sectorConfig.lieux[0].id;

  return (
    <>
      <PageHeader
        kicker={`${sectorConfig.objetMetierCentral.nom} · ${stageLabel(wo.stage)}`}
        title={`${wo.number} · ${client?.name ?? ""}`}
        subtitle={wo.title}
        actions={
          <>
            {wo.zone_id && <ButtonLink href={mapHref(site, "work_orders", id)} icon="map">{t("viewOnMap")}</ButtonLink>}
            <StageActions id={id} stage={wo.stage} status={wo.status} invoiced={(invoices.data ?? []).length > 0} canUpdate={ctx.can("operations", "update")} canInvoice={ctx.can("finance", "create")} clientName={client?.name ?? ""} number={wo.number} />
          </>
        }
      />
      {/* Étapes horodatées */}
      <Card className="mb-4">
        <ol className="flex flex-wrap gap-y-3">
          {STAGES.map((s, i) => {
            const st = (stages.data ?? []).filter((x) => x.stage === s.id).at(-1);
            return (
              <li key={s.id} className="flex min-w-28 flex-1 items-start gap-2">
                <span className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full text-[11px] font-bold ${i < idx ? "bg-accent text-white" : i === idx ? "bg-accent text-white ring-4 ring-accent/20" : "bg-black/[0.08] text-muted"}`}>{i < idx ? "✓" : i + 1}</span>
                <span className="leading-tight">
                  <span className={`block text-sm font-semibold ${i > idx ? "text-muted" : ""}`}>{s.libelle}</span>
                  <span className="block text-[11px] text-muted">{st ? `${formatDate(st.entered_at)} · ${formatTime(st.entered_at)}` : "—"}</span>
                </span>
              </li>
            );
          })}
        </ol>
        {wo.blocked_reason && <p className="mt-3 rounded-xl bg-warn/12 px-3 py-2 text-sm text-[#8a5d08]">{t("onHold", { reason: wo.blocked_reason })}</p>}
      </Card>
      <Tabs
        current={tab}
        tabs={[
          { id: "resume", label: t("tabs.resume"), href: base },
          { id: "heures", label: t("tabs.heures"), href: `${base}?tab=heures`, count: (time.data ?? []).length },
          { id: "stock", label: t("tabs.stock"), href: `${base}?tab=stock`, count: (moves.data ?? []).length },
          { id: "devis", label: t("tabs.devis"), href: `${base}?tab=devis` },
          { id: "documents", label: t("tabs.documents"), href: `${base}?tab=documents`, count: (docs.data ?? []).length + (threads.data ?? []).length },
        ]}
      />
      {tab === "resume" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card title={t("order")} className="lg:col-span-2">
            <Dl
              items={[
                [t("account"), client ? <Link href={`/crm/clients/${client.id}`} className="text-accent hover:underline">{client.name}</Link> : "—"],
                [t("parcel"), wo.physical_object ?? "—"],
                [t("location"), (wo.zones as { name: string } | null)?.name ?? t("offSite")],
                [t("owner"), owner ? <Link href={`/hr/employees/${owner.id}`} className="hover:text-accent">{`${owner.first_name} ${owner.last_name}`}</Link> : "—"],
                [t("receivedAt"), wo.received_at ? `${formatDate(wo.received_at)} · ${formatTime(wo.received_at)}` : "—"],
                [t("due"), wo.due_at ? `${formatDate(wo.due_at)} · ${formatTime(wo.due_at)}` : "—"],
                [t("amount"), t("amountValue", { ht: formatMoney(Number(wo.amount_ht)), ttc: formatMoney(Number(wo.amount_ttc)) })],
                [t("progress"), <span key="p" className="flex items-center gap-2"><Progress value={Number(wo.progress)} tone="accent" className="w-40" />{Math.round(Number(wo.progress) * 100)} %</span>],
              ]}
            />
          </Card>
          <Card title={t("hoursBudget")}>
            <div className="mb-2 flex items-center justify-between">
              <BudgetBadge level={level} used={used} budget={Number(wo.hours_budget)} />
              <span className="text-xs text-muted">{t("alerts")}</span>
            </div>
            <Progress value={Number(wo.hours_budget) ? used / Number(wo.hours_budget) : 0} tone={level >= 100 ? "danger" : level >= 80 ? "warn" : "brand"} />
            <ul className="mt-4 space-y-2 text-sm">
              {[...perPerson].map(([who, h]) => (
                <li key={who}>
                  <div className="flex justify-between">
                    <span>{who}</span>
                    <span className="tabular-nums text-muted">{formatNumber(h, "fr", 2)} h</span>
                  </div>
                  <Progress value={Number(wo.hours_budget) ? h / Number(wo.hours_budget) : 0} />
                </li>
              ))}
              {perPerson.size === 0 && <li className="text-muted">{t("noHours")}</li>}
            </ul>
          </Card>
          <Card title={t("checklist")} className="lg:col-span-2">
            {(checklists.data ?? []).map((c) => (
              <div key={c.id}>
                {(c.items as { label: string; done: boolean }[]).map((it, i) => (
                  <ChecklistItem key={i} checklistId={c.id} index={i} label={it.label} done={it.done} disabled={!ctx.can("operations", "update")} />
                ))}
              </div>
            ))}
            {(checklists.data ?? []).length === 0 && <Empty title={t("noChecklist")} />}
          </Card>
          <Card title={t("tasks")}>
            <ul className="space-y-2 text-sm">
              {(tasks.data ?? []).map((task) => (
                <li key={task.id} className="flex items-center justify-between gap-2">
                  <span className={task.status === "done" ? "text-muted line-through" : ""}>{task.title}</span>
                  <Badge tone={task.status === "done" ? "ok" : task.status === "doing" ? "info" : "muted"}>{task.status === "done" ? t("task.done") : task.status === "doing" ? t("task.doing") : t("task.todo")}</Badge>
                </li>
              ))}
              {(tasks.data ?? []).length === 0 && <li className="text-muted">{t("noTasks")}</li>}
            </ul>
          </Card>
        </div>
      )}
      {tab === "heures" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card title={t("hoursLogged")} className="lg:col-span-2" padded={false}>
            <table className="w-full text-sm">
              <thead className="bg-black/[0.02] text-left text-xs text-muted">
                <tr>
                  <th className="px-5 py-2 font-medium">{t("col.date")}</th>
                  <th className="px-3 py-2 font-medium">{t("col.employee")}</th>
                  <th className="px-3 py-2 font-medium">{t("col.note")}</th>
                  <th className="px-3 py-2 text-right font-medium">{t("col.hours")}</th>
                  <th className="px-5 py-2 font-medium">{t("col.billing")}</th>
                </tr>
              </thead>
              <tbody>
                {(time.data ?? []).map((te) => {
                  const e = te.employee as unknown as { first_name: string; last_name: string } | null;
                  return (
                    <tr key={te.id} className="border-t border-black/5">
                      <td className="px-5 py-2">{formatDate(te.worked_on)}</td>
                      <td className="px-3 py-2">{e ? `${e.first_name} ${e.last_name}` : "—"}</td>
                      <td className="px-3 py-2 text-muted">{te.note}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatNumber(Number(te.hours), "fr", 2)}</td>
                      <td className="px-5 py-2">{te.invoice_id ? <Badge tone="ok">{t("invoiced")}</Badge> : te.billable ? <Badge tone="info">{t("billable")}</Badge> : <Badge tone="muted">{t("internal")}</Badge>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {(time.data ?? []).length === 0 && <Empty title={t("emptyHours")} icon="timer" />}
          </Card>
          <Card title={t("addHours")}>
            <TimeForm workOrderId={id} />
          </Card>
        </div>
      )}
      {tab === "stock" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card title={t("stockOut")} className="lg:col-span-2">
            <ul className="divide-y divide-black/5 text-sm">
              {(moves.data ?? []).map((m) => (
                <li key={m.id} className="flex justify-between gap-3 py-2">
                  <span>
                    {(m.stock_items as unknown as { name: string } | null)?.name} <span className="text-xs text-muted">{(m.lots as unknown as { number: string } | null)?.number ? t("lotRef", { number: (m.lots as unknown as { number: string }).number }) : ""}</span>
                  </span>
                  <span className="tabular-nums">−{formatNumber(Number(m.quantity))}</span>
                </li>
              ))}
            </ul>
            {(moves.data ?? []).length === 0 && <Empty title={t("emptyStock")} hint={t("emptyStockHint")} />}
          </Card>
          <Card title={t("consume")}>
            <ConsumeForm workOrderId={id} items={(stock.data ?? []).map((s) => ({ id: s.id, label: `${s.name} (${formatNumber(Number(s.quantity))})` }))} />
          </Card>
        </div>
      )}
      {tab === "devis" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card title={wo.quote_id ? t("quote", { number: (wo.quotes as { number: string } | null)?.number ?? "" }) : t("noQuote")} className="lg:col-span-2" action={wo.quote_id ? <Link href={`/crm/quotes/${wo.quote_id}`} className="text-xs font-medium text-accent">{t("openQuote")}</Link> : null}>
            {(lines.data ?? []).length > 0 ? (
              <>
                <table className="w-full text-sm">
                  <tbody>
                    {(lines.data ?? []).map((l, i) => (
                      <tr key={i} className="border-b border-black/5">
                        <td className="py-1.5">{l.label}</td>
                        <td className="text-right tabular-nums">{formatNumber(Number(l.quantity))} × {formatMoney(Number(l.unit_price))}</td>
                        <td className="w-28 text-right tabular-nums">{formatMoney(Number(l.quantity) * Number(l.unit_price))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="ml-auto mt-3 w-64 text-sm">
                  <Dl items={[[t("totalHt"), formatMoney(totals.ht)], ...totals.vatByRate.map((v) => [t("vat", { rate: formatNumber(v.rate * 100, "fr", 1) }), formatMoney(v.vat)] as [string, string]), [t("totalTtc"), formatMoney(totals.ttc)], [t("margin"), `${formatMoney(totals.margin)} · ${formatNumber((totals.marginRate ?? 0) * 100, "fr", 1)} %`]]} />
                </div>
              </>
            ) : (
              <p className="text-sm text-muted">{t("flatAmount", { amount: formatMoney(Number(wo.amount_ht)) })}</p>
            )}
          </Card>
          <Card title={t("invoices")}>
            {(invoices.data ?? []).map((i) => (
              <Link key={i.id} href={`/finance/invoices/${i.id}`} className="flex justify-between py-1.5 text-sm hover:text-accent">
                <span className="font-mono">{i.number}</span>
                <span>{formatMoney(Number(i.total_ttc))}</span>
              </Link>
            ))}
            {(invoices.data ?? []).length === 0 && <p className="text-sm text-muted">{t("notInvoiced")}</p>}
          </Card>
        </div>
      )}
      {tab === "documents" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title={t("docs")}>
            {(docs.data ?? []).map((d) => (
              <p key={d.id} className="py-1 text-sm">
                {d.name} <span className="text-xs text-muted">· {d.kind}</span>
              </p>
            ))}
            {(docs.data ?? []).length === 0 && <Empty title={t("noDocs")} hint={t("noDocsHint")} icon="file" />}
          </Card>
          <Card title={t("threads")}>
            {(threads.data ?? []).map((th) => (
              <Link key={th.id} href={`/comms/inbox?thread=${th.id}`} className="flex justify-between py-1.5 text-sm hover:text-accent">
                <span>{th.subject}</span>
                <Badge tone={th.status === "awaiting_reply" ? "warn" : "muted"}>{th.status === "awaiting_reply" ? t("awaitingReply") : t("followUp")}</Badge>
              </Link>
            ))}
            {(threads.data ?? []).length === 0 && <Empty title={t("noThreads")} icon="mail" />}
          </Card>
        </div>
      )}
    </>
  );
}
