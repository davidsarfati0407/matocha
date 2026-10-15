import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge, Card, Denied, Dl, PageHeader, Progress } from "@/components/ui/kit";
import { requirePerm } from "@/lib/backoffice/context";
import { INVOICE_STATUS } from "@/lib/backoffice/labels";
import { computeTotals } from "@/lib/domain/money";
import { checkFacturX } from "@/lib/domain/facturx";
import { formatDate, formatMoney, formatPercent } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { InvoiceActions, PaymentForm, UndoPayment } from "./client";

export const metadata: Metadata = { title: "Facture" };

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { ctx, allowed } = await requirePerm("finance");
  if (!allowed) return <Denied what="les factures" />;
  const supabase = await createClient();
  const { data: inv } = await supabase.from("invoices").select("*, clients(id, name, email), work_orders(id, number), quotes(id, number)").eq("id", id).maybeSingle();
  if (!inv) notFound();
  const [lines, pays, dun] = await Promise.all([
    supabase.from("invoice_lines").select("label, quantity, unit_price, vat_rate").eq("invoice_id", id).order("position"),
    supabase.from("payments").select("id, amount, received_on, method, reference").eq("invoice_id", id).order("received_on"),
    supabase.from("dunning_steps").select("level, sent_at, due_at").eq("invoice_id", id).order("level"),
  ]);
  const ls = (lines.data ?? []).map((l) => ({ label: l.label, quantity: Number(l.quantity), unitPrice: Number(l.unit_price), vatRate: Number(l.vat_rate) }));
  const t = computeTotals(ls);
  const ttc = Number(inv.total_ttc);
  const paid = Number(inv.paid_amount);
  const fx = checkFacturX({ vatByRate: t.vatByRate, ht: Number(inv.total_ht), vat: Number(inv.total_vat), ttc });
  const client = inv.clients as unknown as { id: string; name: string; email: string | null };
  const wo = inv.work_orders as unknown as { id: string; number: string } | null;
  const quote = inv.quotes as unknown as { id: string; number: string } | null;
  const st = INVOICE_STATUS[inv.status];
  const canPay = ctx.can("finance", "create") && ["sent", "partial", "overdue"].includes(inv.status) && inv.kind !== "avoir";
  return (
    <>
      <PageHeader
        kicker={<>{inv.kind === "avoir" ? "Avoir" : "Facture"} · <Badge tone={st[0]}>{st[1]}</Badge></>}
        title={<><span className="font-mono">{inv.number}</span> · <Link href={`/crm/clients/${client.id}`} className="hover:text-accent">{client.name}</Link></>}
        subtitle={`Émise le ${formatDate(inv.issued_on)} · échéance ${formatDate(inv.due_on)}${inv.notes ? ` · ${inv.notes}` : ""}`}
        actions={<InvoiceActions id={id} status={inv.status} kind={inv.kind} canEdit={ctx.can("finance", "update")} canCreate={ctx.can("finance", "create")} paid={paid} />}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card padded={false} className="lg:col-span-2">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">Désignation</th>
                <th className="px-3 text-right font-medium">Qté</th>
                <th className="px-3 text-right font-medium">PU HT</th>
                <th className="px-3 text-right font-medium">TVA</th>
                <th className="px-5 text-right font-medium">Total HT</th>
              </tr>
            </thead>
            <tbody>
              {ls.map((l, i) => (
                <tr key={i} className="border-t border-black/5">
                  <td className="px-5 py-2">{l.label}</td>
                  <td className="px-3 text-right tabular-nums">{l.quantity}</td>
                  <td className="px-3 text-right tabular-nums">{formatMoney(l.unitPrice)}</td>
                  <td className="px-3 text-right tabular-nums">{formatPercent(l.vatRate)}</td>
                  <td className="px-5 text-right tabular-nums">{formatMoney(l.quantity * l.unitPrice)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t border-black/10 text-sm">
              <tr><td colSpan={4} className="px-5 pt-2 text-right text-muted">Total HT</td><td className="px-5 pt-2 text-right tabular-nums">{formatMoney(Number(inv.total_ht))}</td></tr>
              {t.vatByRate.map((v) => <tr key={v.rate}><td colSpan={4} className="px-5 text-right text-muted">TVA {formatPercent(v.rate)} sur {formatMoney(v.base)}</td><td className="px-5 text-right tabular-nums">{formatMoney(v.vat)}</td></tr>)}
              <tr><td colSpan={4} className="px-5 py-2 text-right font-semibold">Total TTC</td><td className="px-5 py-2 text-right font-semibold tabular-nums">{formatMoney(ttc)}</td></tr>
            </tfoot>
          </table>
        </Card>
        <div className="flex flex-col gap-4">
          <Card title="Règlement">
            <p className="flex justify-between text-sm"><span>Réglé</span><span className="tabular-nums">{formatMoney(paid)} / {formatMoney(ttc)}</span></p>
            <Progress value={ttc ? (paid / ttc) * 100 : 0} tone={paid >= ttc ? "ok" : inv.status === "overdue" ? "danger" : "brand"} className="mt-2" />
            <ul className="mt-3 divide-y divide-black/5 text-sm">
              {(pays.data ?? []).map((p) => (
                <li key={p.id} className="flex items-center justify-between py-1.5">
                  <span>{formatDate(p.received_on)} · {p.method}{p.reference ? <span className="text-muted"> · {p.reference}</span> : null}</span>
                  <span className="flex items-center gap-2 tabular-nums">{formatMoney(Number(p.amount))}{ctx.can("finance", "delete") && <UndoPayment id={p.id} />}</span>
                </li>
              ))}
            </ul>
            {canPay && <PaymentForm invoiceId={id} remaining={Math.round((ttc - paid) * 100) / 100} />}
          </Card>
          <Card title="Lien avec les opérations">
            <Dl items={[["Commande", wo ? <Link className="text-accent" href={`/ops/work-orders/${wo.id}`}>{wo.number}</Link> : null], ["Devis", quote ? <Link className="text-accent" href={`/crm/quotes/${quote.id}`}>{quote.number}</Link> : null], ["Relances", (dun.data ?? []).filter((d) => d.sent_at).map((d) => `N${d.level} le ${formatDate(d.sent_at!)}`).join(" · ") || "aucune"]]} />
          </Card>
          <Card title="Factur-X">
            {fx.length === 0 ? <p className="text-sm text-brand">Totaux cohérents : XML CII (profil BASIC WL) prêt.</p> : <ul className="text-sm text-[#b3402a]">{fx.map((e) => <li key={e}>{e}</li>)}</ul>}
            <p className="mt-2 text-xs text-muted">Honnêtement : le XML est exporté à part ; son embarquement dans un PDF/A-3 conforme est prévu en phase 4.</p>
          </Card>
        </div>
      </div>
    </>
  );
}
