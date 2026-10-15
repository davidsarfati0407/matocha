import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
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

export const metadata: Metadata = { title: "Commande pro" };

export default async function WorkOrderPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { ctx, allowed } = await requirePerm("operations");
  if (!allowed) return <Denied what="les opérations" />;
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
  for (const t of time.data ?? []) {
    const e = t.employee as unknown as { first_name: string; last_name: string } | null;
    const k = e ? `${e.first_name} ${e.last_name}` : "—";
    perPerson.set(k, (perPerson.get(k) ?? 0) + Number(t.hours));
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
            {wo.zone_id && <ButtonLink href={mapHref(site, "work_orders", id)} icon="map">Voir sur la map</ButtonLink>}
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
        {wo.blocked_reason && <p className="mt-3 rounded-xl bg-warn/12 px-3 py-2 text-sm text-[#8a5d08]">En attente : {wo.blocked_reason}</p>}
      </Card>
      <Tabs
        current={tab}
        tabs={[
          { id: "resume", label: "Résumé", href: base },
          { id: "heures", label: "Heures", href: `${base}?tab=heures`, count: (time.data ?? []).length },
          { id: "stock", label: "Stock consommé", href: `${base}?tab=stock`, count: (moves.data ?? []).length },
          { id: "devis", label: "Devis & factures", href: `${base}?tab=devis` },
          { id: "documents", label: "Documents & échanges", href: `${base}?tab=documents`, count: (docs.data ?? []).length + (threads.data ?? []).length },
        ]}
      />
      {tab === "resume" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card title="Commande" className="lg:col-span-2">
            <Dl
              items={[
                ["Compte", client ? <Link href={`/crm/clients/${client.id}`} className="text-accent hover:underline">{client.name}</Link> : "—"],
                ["Colis", wo.physical_object ?? "—"],
                ["Emplacement", (wo.zones as { name: string } | null)?.name ?? "Hors site / en transit"],
                ["Responsable", owner ? <Link href={`/hr/employees/${owner.id}`} className="hover:text-accent">{`${owner.first_name} ${owner.last_name}`}</Link> : "—"],
                ["Reçue le", wo.received_at ? `${formatDate(wo.received_at)} · ${formatTime(wo.received_at)}` : "—"],
                ["Échéance", wo.due_at ? `${formatDate(wo.due_at)} · ${formatTime(wo.due_at)}` : "—"],
                ["Montant", `${formatMoney(Number(wo.amount_ht))} HT · ${formatMoney(Number(wo.amount_ttc))} TTC`],
                ["Avancement", <span key="p" className="flex items-center gap-2"><Progress value={Number(wo.progress)} tone="accent" className="w-40" />{Math.round(Number(wo.progress) * 100)} %</span>],
              ]}
            />
          </Card>
          <Card title="Budget d'heures">
            <div className="mb-2 flex items-center justify-between">
              <BudgetBadge level={level} used={used} budget={Number(wo.hours_budget)} />
              <span className="text-xs text-muted">alertes à 50, 80 et 100 %</span>
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
              {perPerson.size === 0 && <li className="text-muted">Aucune heure saisie.</li>}
            </ul>
          </Card>
          <Card title="Check-list" className="lg:col-span-2">
            {(checklists.data ?? []).map((c) => (
              <div key={c.id}>
                {(c.items as { label: string; done: boolean }[]).map((it, i) => (
                  <ChecklistItem key={i} checklistId={c.id} index={i} label={it.label} done={it.done} disabled={!ctx.can("operations", "update")} />
                ))}
              </div>
            ))}
            {(checklists.data ?? []).length === 0 && <Empty title="Pas de check-list" />}
          </Card>
          <Card title="Tâches">
            <ul className="space-y-2 text-sm">
              {(tasks.data ?? []).map((t) => (
                <li key={t.id} className="flex items-center justify-between gap-2">
                  <span className={t.status === "done" ? "text-muted line-through" : ""}>{t.title}</span>
                  <Badge tone={t.status === "done" ? "ok" : t.status === "doing" ? "info" : "muted"}>{t.status === "done" ? "Faite" : t.status === "doing" ? "En cours" : "À faire"}</Badge>
                </li>
              ))}
              {(tasks.data ?? []).length === 0 && <li className="text-muted">Aucune tâche.</li>}
            </ul>
          </Card>
        </div>
      )}
      {tab === "heures" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card title="Heures saisies" className="lg:col-span-2" padded={false}>
            <table className="w-full text-sm">
              <thead className="bg-black/[0.02] text-left text-xs text-muted">
                <tr>
                  <th className="px-5 py-2 font-medium">Date</th>
                  <th className="px-3 py-2 font-medium">Collaborateur</th>
                  <th className="px-3 py-2 font-medium">Note</th>
                  <th className="px-3 py-2 text-right font-medium">Heures</th>
                  <th className="px-5 py-2 font-medium">Facturation</th>
                </tr>
              </thead>
              <tbody>
                {(time.data ?? []).map((t) => {
                  const e = t.employee as unknown as { first_name: string; last_name: string } | null;
                  return (
                    <tr key={t.id} className="border-t border-black/5">
                      <td className="px-5 py-2">{formatDate(t.worked_on)}</td>
                      <td className="px-3 py-2">{e ? `${e.first_name} ${e.last_name}` : "—"}</td>
                      <td className="px-3 py-2 text-muted">{t.note}</td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatNumber(Number(t.hours), "fr", 2)}</td>
                      <td className="px-5 py-2">{t.invoice_id ? <Badge tone="ok">Facturée</Badge> : t.billable ? <Badge tone="info">Facturable</Badge> : <Badge tone="muted">Interne</Badge>}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {(time.data ?? []).length === 0 && <Empty title="Aucune heure" icon="timer" />}
          </Card>
          <Card title="Ajouter des heures">
            <TimeForm workOrderId={id} />
          </Card>
        </div>
      )}
      {tab === "stock" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card title="Sorties de stock (traçabilité des lots)" className="lg:col-span-2">
            <ul className="divide-y divide-black/5 text-sm">
              {(moves.data ?? []).map((m) => (
                <li key={m.id} className="flex justify-between gap-3 py-2">
                  <span>
                    {(m.stock_items as unknown as { name: string } | null)?.name} <span className="text-xs text-muted">{(m.lots as unknown as { number: string } | null)?.number ? `· lot ${(m.lots as unknown as { number: string }).number}` : ""}</span>
                  </span>
                  <span className="tabular-nums">−{formatNumber(Number(m.quantity))}</span>
                </li>
              ))}
            </ul>
            {(moves.data ?? []).length === 0 && <Empty title="Aucune sortie rattachée" hint="Les sorties choisissent automatiquement le lot à la DDM la plus proche (FEFO)." />}
          </Card>
          <Card title="Consommer du stock">
            <ConsumeForm workOrderId={id} items={(stock.data ?? []).map((s) => ({ id: s.id, label: `${s.name} (${formatNumber(Number(s.quantity))})` }))} />
          </Card>
        </div>
      )}
      {tab === "devis" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card title={wo.quote_id ? `Devis ${(wo.quotes as { number: string } | null)?.number}` : "Sans devis"} className="lg:col-span-2" action={wo.quote_id ? <Link href={`/crm/quotes/${wo.quote_id}`} className="text-xs font-medium text-accent">Ouvrir le devis →</Link> : null}>
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
                  <Dl items={[["Total HT", formatMoney(totals.ht)], ...totals.vatByRate.map((v) => [`TVA ${formatNumber(v.rate * 100, "fr", 1)} %`, formatMoney(v.vat)] as [string, string]), ["Total TTC", formatMoney(totals.ttc)], ["Marge", `${formatMoney(totals.margin)} · ${formatNumber((totals.marginRate ?? 0) * 100, "fr", 1)} %`]]} />
                </div>
              </>
            ) : (
              <p className="text-sm text-muted">Montant forfaitaire : {formatMoney(Number(wo.amount_ht))} HT.</p>
            )}
          </Card>
          <Card title="Factures">
            {(invoices.data ?? []).map((i) => (
              <Link key={i.id} href={`/finance/invoices/${i.id}`} className="flex justify-between py-1.5 text-sm hover:text-accent">
                <span className="font-mono">{i.number}</span>
                <span>{formatMoney(Number(i.total_ttc))}</span>
              </Link>
            ))}
            {(invoices.data ?? []).length === 0 && <p className="text-sm text-muted">Pas encore facturée. Le bouton « Facturer » apparaît quand la commande est livrée.</p>}
          </Card>
        </div>
      )}
      {tab === "documents" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Documents et photos">
            {(docs.data ?? []).map((d) => (
              <p key={d.id} className="py-1 text-sm">
                {d.name} <span className="text-xs text-muted">· {d.kind}</span>
              </p>
            ))}
            {(docs.data ?? []).length === 0 && <Empty title="Aucun document" hint="Dépôt de fichiers et photos avant/après : Supabase Storage (non disponible dans la stack locale sans Docker)." icon="file" />}
          </Card>
          <Card title="Échanges">
            {(threads.data ?? []).map((t) => (
              <Link key={t.id} href={`/comms/inbox?thread=${t.id}`} className="flex justify-between py-1.5 text-sm hover:text-accent">
                <span>{t.subject}</span>
                <Badge tone={t.status === "awaiting_reply" ? "warn" : "muted"}>{t.status === "awaiting_reply" ? "À répondre" : "Suivi"}</Badge>
              </Link>
            ))}
            {(threads.data ?? []).length === 0 && <Empty title="Aucun échange" icon="mail" />}
          </Card>
        </div>
      )}
    </>
  );
}
