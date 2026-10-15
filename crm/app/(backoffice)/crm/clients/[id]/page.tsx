import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, ButtonLink, Card, Denied, Dl, PageHeader, Stat, Tabs } from "@/components/ui/kit";
import { sectorConfig } from "@/config/sector.config";
import { nowMs } from "@/lib/clock";
import { requirePerm } from "@/lib/backoffice/context";
import { INVOICE_STATUS, QUOTE_STATUS } from "@/lib/backoffice/labels";
import { stageLabel } from "@/lib/domain/stages";
import { formatDate, formatMoney, formatTime } from "@/lib/format";
import { mapHref } from "@/lib/map/links";
import { createClient } from "@/lib/supabase/server";
import { LogInteraction } from "./client";

export const metadata: Metadata = { title: "Compte" };

export default async function ClientPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string }> }) {
  const { id } = await params;
  const tab = (await searchParams).tab ?? "resume";
  const { ctx, allowed } = await requirePerm("commercial");
  if (!allowed) return <Denied what="les comptes" />;
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
  const now = nowMs();
  const ca = (invoices.data ?? []).filter((i) => i.status !== "cancelled").reduce((s, i) => s + Number(i.total_ttc), 0);
  const due = (invoices.data ?? []).reduce((s, i) => s + Math.max(0, Number(i.total_ttc) - Number(i.paid_amount)), 0);
  const overdue = (invoices.data ?? []).filter((i) => i.status === "overdue");
  const pending = (quotes.data ?? []).filter((q) => ["sent", "opened"].includes(q.status));
  const daysSince = c.last_contact_at ? Math.floor((now - Date.parse(c.last_contact_at)) / 86400_000) : null;
  // Prochaines actions suggérées, chacune en un clic
  const next: { label: string; href: string }[] = [];
  for (const i of overdue) next.push({ label: `Relancer la facture ${i.number} (échue le ${formatDate(i.due_on)})`, href: `/finance/dunning?invoice=${i.id}` });
  for (const q of pending) next.push({ label: `Relancer le devis ${q.number} envoyé le ${q.sent_at ? formatDate(q.sent_at) : "—"}`, href: `/crm/quotes/${q.id}` });
  if (daysSince != null && daysSince > 30) next.push({ label: `Reprendre contact : aucun échange depuis ${daysSince} jours`, href: `?tab=historique` });
  if (!(deals.data ?? []).some((d) => !["gagne", "perdu"].includes(d.stage)) && c.kind === "entreprise") next.push({ label: "Proposer un réassort (devis pré-rempli)", href: `/crm/quotes/new?client=${id}` });
  const owner = c.employees as unknown as { first_name: string; last_name: string } | null;
  const wo1 = (wos.data ?? []).find((w) => !["facturee"].includes(w.stage));
  const timeline = [
    ...(threads.data ?? []).flatMap((t) => (t.messages as { direction: string; from_name: string; body: string; sent_at: string | null }[]).map((m) => ({ at: m.sent_at ?? t.last_message_at ?? "", kind: t.channel, title: `${m.direction === "in" ? "Reçu" : "Envoyé"} · ${t.subject}`, body: `${m.from_name} : ${m.body}` }))),
    ...(quotes.data ?? []).filter((q) => q.sent_at).map((q) => ({ at: q.sent_at!, kind: "devis", title: `Devis ${q.number} envoyé`, body: formatMoney(Number(q.total_ht)) + " HT" })),
    ...(invoices.data ?? []).map((i) => ({ at: `${i.issued_on}T09:00:00Z`, kind: "facture", title: `Facture ${i.number}`, body: `${formatMoney(Number(i.total_ttc))} TTC · ${INVOICE_STATUS[i.status][1]}` })),
    ...(events.data ?? []).map((e) => ({ at: e.starts_at, kind: "rdv", title: `Rendez-vous · ${e.title}`, body: `${formatTime(e.starts_at)}–${formatTime(e.ends_at)}` })),
  ].sort((a, b) => b.at.localeCompare(a.at));

  return (
    <>
      <PageHeader
        kicker={`${c.kind === "entreprise" ? "Compte pro" : "Particulier"}${c.segment ? ` · ${c.segment}` : ""}`}
        title={c.name}
        subtitle={[c.city, owner ? `suivi par ${owner.first_name} ${owner.last_name}` : null].filter(Boolean).join(" · ")}
        actions={
          <>
            {wo1 && <ButtonLink href={mapHref(sectorConfig.lieux[0].id, "clients", id)} icon="map">Voir sa commande sur la map</ButtonLink>}
            {ctx.can("commercial", "create") && (
              <ButtonLink href={`/crm/quotes/new?client=${id}`} variant="accent" icon="file">
                Nouveau devis
              </ButtonLink>
            )}
          </>
        }
      />
      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Facturé TTC" value={formatMoney(ca, "fr", 0)} icon="receipt" />
        <Stat label="Reste dû" value={formatMoney(due, "fr", 0)} tone={overdue.length ? "danger" : undefined} sub={overdue.length ? `${overdue.length} facture(s) échue(s)` : due > 0 ? "non échu" : "à jour"} icon="bank" />
        <Stat label="Devis en attente" value={pending.length} icon="file" />
        <Stat label="Dernier contact" value={daysSince == null ? "—" : daysSince === 0 ? "aujourd'hui" : `il y a ${daysSince} j`} tone={daysSince != null && daysSince > 30 ? "warn" : undefined} icon="mail" />
      </div>
      <Tabs
        current={tab}
        tabs={[
          { id: "resume", label: "Résumé", href: "?tab=resume" },
          { id: "historique", label: "Historique", href: "?tab=historique", count: timeline.length },
          { id: "affaires", label: "Devis & commandes", href: "?tab=affaires", count: (quotes.data ?? []).length + (wos.data ?? []).length },
          { id: "factures", label: "Factures", href: "?tab=factures", count: (invoices.data ?? []).length },
        ]}
      />
      {tab === "resume" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card title="Prochaines actions" className="lg:col-span-2">
            {next.length === 0 ? (
              <p className="text-sm text-muted">Rien à faire : compte à jour.</p>
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
          <Card title="Coordonnées">
            <Dl items={[["E-mail", c.email], ["Téléphone", c.phone], ["Adresse", [c.address, c.city].filter(Boolean).join(", ") || null], ["Canal préféré", c.preferred_channel], ["Langue", c.language?.toUpperCase()], ["Satisfaction", c.satisfaction ? "★".repeat(c.satisfaction) + "☆".repeat(5 - c.satisfaction) : null]]} />
            {c.internal_note && <p className="mt-3 rounded-xl bg-ground p-3 text-sm">{c.internal_note}</p>}
          </Card>
          <Card title="Contacts">
            <ul className="divide-y divide-black/5 text-sm">
              {(contacts.data ?? []).map((p) => (
                <li key={p.id} className="py-2">
                  <span className="font-medium">{p.full_name}</span> {p.is_primary && <Badge tone="brand">principal</Badge>}
                  <span className="block text-xs text-muted">{[p.role, p.email, p.phone].filter(Boolean).join(" · ")}</span>
                </li>
              ))}
              {(contacts.data ?? []).length === 0 && <li className="py-2 text-muted">Aucun contact.</li>}
            </ul>
          </Card>
          <Card title="Opportunités" className="lg:col-span-2" action={<Link href="/crm/pipeline" className="text-xs font-medium text-accent">Pipeline →</Link>}>
            <ul className="divide-y divide-black/5 text-sm">
              {(deals.data ?? []).map((d) => (
                <li key={d.id} className="flex justify-between py-2">
                  <span>{d.title}</span>
                  <span className="text-muted">
                    {formatMoney(Number(d.value), "fr", 0)} · {Math.round(Number(d.probability) * 100)} % · <Badge tone={d.stage === "gagne" ? "ok" : d.stage === "perdu" ? "muted" : d.stage === "chaud" ? "warn" : "info"}>{d.stage}</Badge>
                  </span>
                </li>
              ))}
              {(deals.data ?? []).length === 0 && <li className="py-2 text-muted">Aucune opportunité.</li>}
            </ul>
          </Card>
        </div>
      )}
      {tab === "historique" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card title="Fil des échanges" className="lg:col-span-2">
            <ol className="relative ml-2 border-l border-black/10">
              {timeline.map((t, i) => (
                <li key={i} className="mb-4 ml-4">
                  <span className="absolute -left-[5px] mt-1.5 size-2.5 rounded-full bg-accent" />
                  <p className="text-xs text-muted">{t.at ? `${formatDate(t.at)} · ${formatTime(t.at)}` : ""}</p>
                  <p className="text-sm font-medium">{t.title}</p>
                  <p className="line-clamp-2 text-sm text-muted">{t.body}</p>
                </li>
              ))}
              {timeline.length === 0 && <li className="ml-4 text-sm text-muted">Pas encore d'échange.</li>}
            </ol>
          </Card>
          {ctx.can("communication", "create") && <LogInteraction clientId={id} name={c.name} />}
        </div>
      )}
      {tab === "affaires" && (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card title="Devis">
            <ul className="divide-y divide-black/5 text-sm">
              {(quotes.data ?? []).map((q) => (
                <li key={q.id}>
                  <Link href={`/crm/quotes/${q.id}`} className="flex justify-between py-2 hover:text-accent">
                    <span><span className="font-mono">{q.number}</span> · {q.issued_on ? formatDate(q.issued_on) : ""}</span>
                    <span>{formatMoney(Number(q.total_ht))} HT <Badge tone={QUOTE_STATUS[q.status][0]}>{QUOTE_STATUS[q.status][1]}</Badge></span>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>
          <Card title="Commandes pro">
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
                  <span><span className="font-mono">{i.number}</span> · émise le {formatDate(i.issued_on)} · échéance {formatDate(i.due_on)}</span>
                  <span>{formatMoney(Number(i.total_ttc))} <Badge tone={INVOICE_STATUS[i.status][0]}>{INVOICE_STATUS[i.status][1]}</Badge></span>
                </Link>
              </li>
            ))}
            {(invoices.data ?? []).length === 0 && <li className="px-5 py-3 text-muted">Aucune facture visible avec votre rôle.</li>}
          </ul>
        </Card>
      )}
    </>
  );
}
