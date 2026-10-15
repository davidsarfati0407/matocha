import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, ButtonLink, Card, Denied, Dl, PageHeader, Stat, Tabs } from "@/components/ui/kit";
import { sectorConfig } from "@/config/sector.config";
import { nowMs } from "@/lib/clock";
import { requirePerm } from "@/lib/backoffice/context";
import { DEAL_STAGES, INVOICE_STATUS, QUOTE_STATUS } from "@/lib/backoffice/labels";
import { stageLabel } from "@/lib/domain/stages";
import { formatDate, formatMoney, formatTime } from "@/lib/format";
import { mapHref } from "@/lib/map/links";
import { createClient } from "@/lib/supabase/server";
import { FolderButton, LogInteraction } from "./client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("crm");
  return { title: t("clients.single") };
}

export default async function ClientPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { id } = await params;
  const tab = (await searchParams).tab ?? "resume";
  const [tc, tAll] = await Promise.all([getTranslations("crm"), getTranslations()]);
  const { ctx, allowed } = await requirePerm("commercial");
  if (!allowed) return <Denied what={tc("deniedClients")} />;
  const supabase = await createClient();
  const { data: c } = await supabase.from("clients").select("*, employees:owner_id(first_name, last_name)").eq("id", id).maybeSingle();
  if (!c) notFound();
  const [contacts, deals, quotes, wos, invoices, threads, events] = await Promise.all([
    supabase.from("contacts").select("id, full_name, role, email, phone, is_primary").eq("client_id", id).order("is_primary", { ascending: false }),
    supabase.from("deals").select("id, title, stage, value, probability, expected_close_on").eq("client_id", id).order("created_at", { ascending: false }),
    supabase.from("quotes").select("id, number, status, total_ht, issued_on, sent_at").eq("client_id", id).order("issued_on", { ascending: false }),
    supabase.from("work_orders").select("id, number, title, stage, amount_ht, due_at").eq("client_id", id).order("number", { ascending: false }),
    supabase.from("invoices").select("id, number, status, total_ttc, paid_amount, issued_on, due_on").eq("client_id", id).order("issued_on", { ascending: false }),
    supabase.from("threads").select("id, channel, subject, status, last_message_at, messages(direction, from_name, body, sent_at)").eq("client_id", id).order("last_message_at", { ascending: false }).limit(20),
    supabase.from("calendar_events").select("id, title, starts_at, ends_at").eq("client_id", id).order("starts_at", { ascending: false }).limit(10),
  ]);
  const { data: folder } = await supabase.from("documents").select("external_url").eq("entity_type", "clients").eq("entity_id", id).eq("kind", "dossier").limit(1).maybeSingle();
  const now = nowMs();
  const ca = (invoices.data ?? []).filter((i) => i.status !== "cancelled").reduce((s, i) => s + Number(i.total_ttc), 0);
  const due = (invoices.data ?? []).reduce((s, i) => s + Math.max(0, Number(i.total_ttc) - Number(i.paid_amount)), 0);
  const overdue = (invoices.data ?? []).filter((i) => i.status === "overdue");
  const pending = (quotes.data ?? []).filter((q) => ["sent", "opened"].includes(q.status));
  const daysSince = c.last_contact_at ? Math.floor((now - Date.parse(c.last_contact_at)) / 86400_000) : null;
  // Prochaines actions suggérées, chacune en un clic
  const next: { label: string; href: string }[] = [];
  for (const i of overdue) next.push({ label: tc("clients.next.dunInvoice", { number: i.number, date: formatDate(i.due_on) }), href: `/finance/dunning?invoice=${i.id}` });
  for (const q of pending) next.push({ label: tc("clients.next.followQuote", { number: q.number, date: q.sent_at ? formatDate(q.sent_at) : "—" }), href: `/crm/quotes/${q.id}` });
  if (daysSince != null && daysSince > 30) next.push({ label: tc("clients.next.reconnect", { days: daysSince }), href: `?tab=historique` });
  if (!(deals.data ?? []).some((d) => !["gagne", "perdu"].includes(d.stage)) && c.kind === "entreprise") next.push({ label: tc("clients.next.restock"), href: `/crm/quotes/new?client=${id}` });
  const owner = c.employees as unknown as { first_name: string; last_name: string } | null;
  const wo1 = (wos.data ?? []).find((w) => !["facturee"].includes(w.stage));
  const timeline = [
    ...(threads.data ?? []).flatMap((t) => (t.messages as { direction: string; from_name: string; body: string; sent_at: string | null }[]).map((m) => ({ at: m.sent_at ?? t.last_message_at ?? "", kind: t.channel, title: tc("clients.timeline.message", { dir: m.direction === "in" ? "in" : "out", subject: t.subject }), body: tc("clients.timeline.messageBody", { from: m.from_name, body: m.body }) }))),
    ...(quotes.data ?? []).filter((q) => q.sent_at).map((q) => ({ at: q.sent_at!, kind: "devis", title: tc("clients.timeline.quoteSent", { number: q.number }), body: tc("amountHt", { amount: formatMoney(Number(q.total_ht)) }) })),
    ...(invoices.data ?? []).map((i) => ({ at: `${i.issued_on}T09:00:00Z`, kind: "facture", title: tc("clients.timeline.invoice", { number: i.number }), body: tc("clients.timeline.invoiceBody", { amount: formatMoney(Number(i.total_ttc)), status: tAll(INVOICE_STATUS[i.status][1] as never) }) })),
    ...(events.data ?? []).map((e) => ({ at: e.starts_at, kind: "rdv", title: tc("clients.timeline.event", { title: e.title }), body: `${formatTime(e.starts_at)}–${formatTime(e.ends_at)}` })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <>
      <PageHeader
        kicker={`${c.kind === "entreprise" ? tc("clients.proAccount") : tc("clients.individual")}${c.segment ? ` · ${c.segment}` : ""}`}
        title={c.name}
        subtitle={[c.city, owner ? tc("clients.followedBy", { name: `${owner.first_name} ${owner.last_name}` }) : null].filter(Boolean).join(" · ")}
        actions={
          <>
            {wo1 && <ButtonLink href={mapHref(sectorConfig.lieux[0].id, "clients", id)} icon="map">{tc("clients.seeOnMap")}</ButtonLink>}
            {ctx.can("commercial", "create") && (
              <ButtonLink href={`/crm/quotes/new?client=${id}`} variant="accent" icon="file">
                {tc("quotes.newTitle")}
              </ButtonLink>
            )}
          </>
        }
      />
      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={tc("clients.stats.invoiced")} value={formatMoney(ca, "fr", 0)} icon="receipt" />
        <Stat label={tc("clients.table.due")} value={formatMoney(due, "fr", 0)} tone={overdue.length ? "danger" : undefined} sub={overdue.length ? tc("clients.stats.overdueCount", { count: overdue.length }) : due > 0 ? tc("clients.stats.notDue") : tc("clients.stats.upToDate")} icon="bank" />
        <Stat label={tc("clients.stats.pendingQuotes")} value={pending.length} icon="file" />
        <Stat label={tc("clients.table.lastContact")} value={daysSince == null ? "—" : daysSince === 0 ? tc("clients.stats.today") : tc("clients.stats.daysAgo", { days: daysSince })} tone={daysSince != null && daysSince > 30 ? "warn" : undefined} icon="mail" />
      </div>
      <Tabs
        current={tab}
        tabs={[
          { id: "resume", label: tc("clients.tabs.summary"), href: "?tab=resume" },
          { id: "historique", label: tc("clients.tabs.history"), href: "?tab=historique", count: timeline.length },
          { id: "affaires", label: tc("clients.tabs.deals"), href: "?tab=affaires", count: (quotes.data ?? []).length + (wos.data ?? []).length },
          { id: "factures", label: tc("clients.tabs.invoices"), href: "?tab=factures", count: (invoices.data ?? []).length },
        ]}
      />
      {tab === "resume" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card title={tc("clients.nextActions")} className="lg:col-span-2">
            {next.length === 0 ? (
              <p className="text-sm text-muted">{tc("clients.nothingToDo")}</p>
            ) : (
              <ul className="space-y-2">
                {next.map((n) => (
                  <li key={n.label}>
                    <Link href={n.href} className="flex items-center justify-between rounded-xl bg-accent/[0.06] px-3 py-2 text-sm ring-1 ring-accent/20 hover:bg-accent/10">
                      {n.label} <span className="text-accent">→</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Card>
          <Card title={tc("clients.details")} action={<FolderButton clientId={id} url={folder?.external_url ?? null} />}>
            <Dl items={[[tc("clients.form.email"), c.email], [tc("clients.form.phone"), c.phone], [tc("clients.address"), [c.address, c.city].filter(Boolean).join(", ") || null], [tc("clients.preferredChannel"), c.preferred_channel], [tc("clients.language"), c.language?.toUpperCase()], [tc("clients.table.satisfaction"), c.satisfaction ? "★".repeat(c.satisfaction) + "☆".repeat(5 - c.satisfaction) : null]]} />
            {c.internal_note && <p className="mt-3 rounded-xl bg-ground p-3 text-sm">{c.internal_note}</p>}
          </Card>
          <Card title={tc("clients.contacts")}>
            <ul className="divide-y divide-black/5 text-sm">
              {(contacts.data ?? []).map((p) => (
                <li key={p.id} className="py-2">
                  <span className="font-medium">{p.full_name}</span> {p.is_primary && <Badge tone="brand">{tc("clients.primary")}</Badge>}
                  <span className="block text-xs text-muted">{[p.role, p.email, p.phone].filter(Boolean).join(" · ")}</span>
                </li>
              ))}
              {(contacts.data ?? []).length === 0 && <li className="py-2 text-muted">{tc("clients.noContact")}</li>}
            </ul>
          </Card>
          <Card title={tc("clients.deals")} className="lg:col-span-2" action={<Link href="/crm/pipeline" className="text-xs font-medium text-accent">{tc("clients.pipelineLink")}</Link>}>
            <ul className="divide-y divide-black/5 text-sm">
              {(deals.data ?? []).map((d) => (
                <li key={d.id} className="flex justify-between py-2">
                  <span>{d.title}</span>
                  <span className="text-muted">
                    {formatMoney(Number(d.value), "fr", 0)} · {Math.round(Number(d.probability) * 100)} % · <Badge tone={d.stage === "gagne" ? "ok" : d.stage === "perdu" ? "muted" : d.stage === "chaud" ? "warn" : "info"}>{(() => { const s = DEAL_STAGES.find((x) => x.id === d.stage); return s ? tAll(s.label as never) : d.stage; })()}</Badge>
                  </span>
                </li>
              ))}
              {(deals.data ?? []).length === 0 && <li className="py-2 text-muted">{tc("clients.noDeal")}</li>}
            </ul>
          </Card>
        </div>
      )}
      {tab === "historique" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card title={tc("clients.timelineTitle")} className="lg:col-span-2">
            <ol className="relative ml-2 border-l border-black/10">
              {timeline.map((t, i) => (
                <li key={i} className="mb-4 ml-4">
                  <span className="absolute -left-[5px] mt-1.5 size-2.5 rounded-full bg-accent" />
                  <p className="text-xs text-muted">{t.at ? `${formatDate(t.at)} · ${formatTime(t.at)}` : ""}</p>
                  <p className="text-sm font-medium">{t.title}</p>
                  <p className="line-clamp-2 text-sm text-muted">{t.body}</p>
                </li>
              ))}
              {timeline.length === 0 && <li className="ml-4 text-sm text-muted">{tc("clients.noExchange")}</li>}
            </ol>
          </Card>
          {ctx.can("communication", "create") && <LogInteraction clientId={id} name={c.name} />}
        </div>
      )}
      {tab === "affaires" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title={tc("quotes.title")}>
            <ul className="divide-y divide-black/5 text-sm">
              {(quotes.data ?? []).map((q) => (
                <li key={q.id}>
                  <Link href={`/crm/quotes/${q.id}`} className="flex justify-between py-2 hover:text-accent">
                    <span><span className="font-mono">{q.number}</span> · {q.issued_on ? formatDate(q.issued_on) : ""}</span>
                    <span>{tc("amountHt", { amount: formatMoney(Number(q.total_ht)) })} <Badge tone={QUOTE_STATUS[q.status][0]}>{tAll(QUOTE_STATUS[q.status][1] as never)}</Badge></span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
          <Card title={tc("clients.workOrders")}>
            <ul className="divide-y divide-black/5 text-sm">
              {(wos.data ?? []).map((w) => (
                <li key={w.id}>
                  <Link href={`/ops/work-orders/${w.id}`} className="flex justify-between py-2 hover:text-accent">
                    <span><span className="font-mono">{w.number}</span> · {w.title}</span>
                    <Badge tone={w.stage === "facturee" ? "ok" : "info"}>{stageLabel(w.stage)}</Badge>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}
      {tab === "factures" && (
        <Card padded={false}>
          <ul className="divide-y divide-black/5 text-sm">
            {(invoices.data ?? []).map((i) => (
              <li key={i.id}>
                <Link href={`/finance/invoices/${i.id}`} className="flex justify-between px-5 py-2.5 hover:text-accent">
                  <span><span className="font-mono">{i.number}</span> · {tc("clients.invoiceDates", { issued: formatDate(i.issued_on), due: formatDate(i.due_on) })}</span>
                  <span>{formatMoney(Number(i.total_ttc))} <Badge tone={INVOICE_STATUS[i.status][0]}>{tAll(INVOICE_STATUS[i.status][1] as never)}</Badge></span>
                </Link>
              </li>
            ))}
            {(invoices.data ?? []).length === 0 && <li className="px-5 py-3 text-muted">{tc("clients.noInvoice")}</li>}
          </ul>
        </Card>
      )}
    </>
  );
}
