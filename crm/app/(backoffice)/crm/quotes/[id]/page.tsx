import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, Denied, PageHeader } from "@/components/ui/kit";
import { requirePerm } from "@/lib/backoffice/context";
import { QUOTE_STATUS } from "@/lib/backoffice/labels";
import { computeTotals } from "@/lib/domain/money";
import { formatDate, formatMoney, formatPercent } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { QuoteEditor } from "../editor";
import { QuoteActions } from "./client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("crm");
  return { title: t("quotes.title") };
}

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [tc, tAll] = await Promise.all([getTranslations("crm"), getTranslations()]);
  const { ctx, allowed } = await requirePerm("commercial");
  if (!allowed) return <Denied what={tc("deniedQuotes")} />;
  const supabase = await createClient();
  const { data: q } = await supabase.from("quotes").select("*, clients(id, name, email)").eq("id", id).maybeSingle();
  if (!q) notFound();
  const [lines, wo, clients, catalog] = await Promise.all([
    supabase.from("quote_lines").select("catalog_item_id, label, quantity, unit_price, unit_cost, vat_rate").eq("quote_id", id).order("position"),
    supabase.from("work_orders").select("id, number, stage").eq("quote_id", id).maybeSingle(),
    supabase.from("clients").select("id, name").eq("kind", "entreprise").order("name"),
    supabase.from("catalog_items").select("id, sku, name, unit, unit_price, unit_cost, vat_rate").eq("active", true).order("unit_price", { ascending: false }),
  ]);
  const ls = (lines.data ?? []).map((l) => ({ ...l, quantity: Number(l.quantity), unit_price: Number(l.unit_price), unit_cost: Number(l.unit_cost), vat_rate: Number(l.vat_rate) }));
  const client = q.clients as unknown as { id: string; name: string; email: string | null };
  const editable = ["draft", "sent", "opened"].includes(q.status) && ctx.can("commercial", "update");
  const t = computeTotals(ls.map((l) => ({ quantity: l.quantity, unitPrice: l.unit_price, unitCost: l.unit_cost, vatRate: l.vat_rate })), { discountPct: Number(q.discount_pct) });
  const st = QUOTE_STATUS[q.status];
  return (
    <>
      <PageHeader
        kicker={<>{tc("quotes.title")} · <Badge tone={st[0]}>{tAll(st[1] as never)}</Badge></>}
        title={<><span className="font-mono">{q.number}</span> · <Link href={`/crm/clients/${client.id}`} className="hover:text-accent">{client.name}</Link></>}
        subtitle={`${tc("quotes.issuedValid", { issued: q.issued_on ? formatDate(q.issued_on) : "—", valid: q.valid_until ? formatDate(q.valid_until) : "—" })}${q.sent_at ? ` · ${tc("quotes.sentOn", { date: formatDate(q.sent_at) })}` : ""}`}
        actions={<QuoteActions id={id} status={q.status} canEdit={ctx.can("commercial", "update")} canCreate={ctx.can("commercial", "create")} workOrder={wo.data ?? null} clientEmail={client.email} number={q.number} />}
      />
      {wo.data && (
        <Link href={`/ops/work-orders/${wo.data.id}`} className="mb-4 flex items-center justify-between rounded-2xl bg-matcha/15 px-4 py-3 text-sm text-brand ring-1 ring-matcha/30">
          <span>{tc.rich("quotes.acceptedBanner", { number: wo.data.number, b: (c) => <b className="font-mono">{c}</b> })}</span>
          <span>{tc("open")}</span>
        </Link>
      )}
      {editable ? (
        <QuoteEditor id={id} clients={clients.data ?? []} catalog={(catalog.data ?? []).map((c) => ({ ...c, unit_price: Number(c.unit_price), unit_cost: Number(c.unit_cost), vat_rate: Number(c.vat_rate) }))} initial={{ client_id: client.id, deal_id: q.deal_id, discount_pct: Number(q.discount_pct), notes: q.notes ?? "", lines: ls }} />
      ) : (
        <Card padded={false}>
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted">
              <tr>
                <th className="px-5 py-2 font-medium">{tc("lines.designation")}</th>
                <th className="px-3 py-2 text-right font-medium">{tc("lines.qty")}</th>
                <th className="px-3 py-2 text-right font-medium">{tc("lines.unitPrice")}</th>
                <th className="px-3 py-2 text-right font-medium">{tc("lines.vat")}</th>
                <th className="px-5 py-2 text-right font-medium">{tc("lines.totalHt")}</th>
              </tr>
            </thead>
            <tbody>
              {ls.map((l, i) => (
                <tr key={i} className="border-t border-black/5">
                  <td className="px-5 py-2">{l.label}</td>
                  <td className="px-3 text-right tabular-nums">{l.quantity}</td>
                  <td className="px-3 text-right tabular-nums">{formatMoney(l.unit_price)}</td>
                  <td className="px-3 text-right tabular-nums">{formatPercent(l.vat_rate)}</td>
                  <td className="px-5 text-right tabular-nums">{formatMoney(l.quantity * l.unit_price)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-black/10">
              <tr><td colSpan={4} className="px-5 py-1 text-right text-muted">{Number(q.discount_pct) ? tc("lines.totalHtDiscount", { pct: formatPercent(Number(q.discount_pct)) }) : tc("lines.totalHt")}</td><td className="px-5 text-right tabular-nums">{formatMoney(t.ht)}</td></tr>
              <tr><td colSpan={4} className="px-5 py-1 text-right text-muted">{tc("lines.vat")}</td><td className="px-5 text-right tabular-nums">{formatMoney(t.vat)}</td></tr>
              <tr><td colSpan={4} className="px-5 py-2 text-right font-semibold">{tc("lines.totalTtc")}</td><td className="px-5 text-right font-semibold tabular-nums">{formatMoney(t.ttc)}</td></tr>
            </tfoot>
          </table>
        </Card>
      )}
    </>
  );
}
