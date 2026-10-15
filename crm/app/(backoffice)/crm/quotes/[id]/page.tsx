import type { Metadata } from "next";
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

export const metadata: Metadata = { title: "Devis" };

export default async function QuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { ctx, allowed } = await requirePerm("commercial");
  if (!allowed) return <Denied what="les devis" />;
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
        kicker={<>Devis · <Badge tone={st[0]}>{st[1]}</Badge></>}
        title={<><span className="font-mono">{q.number}</span> · <Link href={`/crm/clients/${client.id}`} className="hover:text-accent">{client.name}</Link></>}
        subtitle={`Émis le ${q.issued_on ? formatDate(q.issued_on) : "—"} · valable jusqu'au ${q.valid_until ? formatDate(q.valid_until) : "—"}${q.sent_at ? ` · envoyé le ${formatDate(q.sent_at)}` : ""}`}
        actions={<QuoteActions id={id} status={q.status} canEdit={ctx.can("commercial", "update")} canCreate={ctx.can("commercial", "create")} workOrder={wo.data ?? null} clientEmail={client.email} number={q.number} />}
      />
      {wo.data && (
        <Link href={`/ops/work-orders/${wo.data.id}`} className="mb-4 flex items-center justify-between rounded-2xl bg-matcha/15 px-4 py-3 text-sm text-brand ring-1 ring-matcha/30">
          <span>Accepté → commande pro <b className="font-mono">{wo.data.number}</b> créée automatiquement, sans ressaisie.</span>
          <span>Ouvrir →</span>
        </Link>
      )}
      {editable ? (
        <QuoteEditor id={id} clients={clients.data ?? []} catalog={(catalog.data ?? []).map((c) => ({ ...c, unit_price: Number(c.unit_price), unit_cost: Number(c.unit_cost), vat_rate: Number(c.vat_rate) }))} initial={{ client_id: client.id, deal_id: q.deal_id, discount_pct: Number(q.discount_pct), notes: q.notes ?? "", lines: ls }} />
      ) : (
        <Card padded={false}>
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted">
              <tr>
                <th className="px-5 py-2 font-medium">Désignation</th>
                <th className="px-3 py-2 text-right font-medium">Qté</th>
                <th className="px-3 py-2 text-right font-medium">PU HT</th>
                <th className="px-3 py-2 text-right font-medium">TVA</th>
                <th className="px-5 py-2 text-right font-medium">Total HT</th>
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
              <tr><td colSpan={4} className="px-5 py-1 text-right text-muted">Total HT{Number(q.discount_pct) ? ` (remise ${formatPercent(Number(q.discount_pct))})` : ""}</td><td className="px-5 text-right tabular-nums">{formatMoney(t.ht)}</td></tr>
              <tr><td colSpan={4} className="px-5 py-1 text-right text-muted">TVA</td><td className="px-5 text-right tabular-nums">{formatMoney(t.vat)}</td></tr>
              <tr><td colSpan={4} className="px-5 py-2 text-right font-semibold">Total TTC</td><td className="px-5 text-right font-semibold tabular-nums">{formatMoney(t.ttc)}</td></tr>
            </tfoot>
          </table>
        </Card>
      )}
    </>
  );
}
