import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
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

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("finance");
  return { title: t("invoices.single") };
}

export default async function InvoicePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [tf, tAll] = await Promise.all([getTranslations("finance"), getTranslations()]);
  const { ctx, allowed } = await requirePerm("finance");
  if (!allowed) return <Denied what={tf("deniedInvoices")} />;
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
        kicker={<>{inv.kind === "avoir" ? tf("invoices.creditNote") : tf("invoices.single")} · <Badge tone={st[0]}>{tAll(st[1] as never)}</Badge></>}
        title={<><span className="font-mono">{inv.number}</span> · <Link href={`/crm/clients/${client.id}`} className="hover:text-accent">{client.name}</Link></>}
        subtitle={`${tf("invoices.issuedDue", { issued: formatDate(inv.issued_on), due: formatDate(inv.due_on) })}${inv.notes ? ` · ${inv.notes}` : ""}`}
        actions={<InvoiceActions id={id} status={inv.status} kind={inv.kind} canEdit={ctx.can("finance", "update")} canCreate={ctx.can("finance", "create")} paid={paid} />}
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card padded={false} className="lg:col-span-2">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted">
              <tr>
                <th className="px-5 py-3 font-medium">{tf("lines.designation")}</th>
                <th className="px-3 text-right font-medium">{tf("lines.qty")}</th>
                <th className="px-3 text-right font-medium">{tf("lines.unitPrice")}</th>
                <th className="px-3 text-right font-medium">{tf("lines.vat")}</th>
                <th className="px-5 text-right font-medium">{tf("lines.totalHt")}</th>
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
              <tr><td colSpan={4} className="px-5 pt-2 text-right text-muted">{tf("lines.totalHt")}</td><td className="px-5 pt-2 text-right tabular-nums">{formatMoney(Number(inv.total_ht))}</td></tr>
              {t.vatByRate.map((v) => <tr key={v.rate}><td colSpan={4} className="px-5 text-right text-muted">{tf("lines.vatOn", { rate: formatPercent(v.rate), base: formatMoney(v.base) })}</td><td className="px-5 text-right tabular-nums">{formatMoney(v.vat)}</td></tr>)}
              <tr><td colSpan={4} className="px-5 py-2 text-right font-semibold">{tf("lines.totalTtc")}</td><td className="px-5 py-2 text-right font-semibold tabular-nums">{formatMoney(ttc)}</td></tr>
            </tfoot>
          </table>
        </Card>
        <div className="flex flex-col gap-4">
          <Card title={tf("invoices.settlement")}>
            <p className="flex justify-between text-sm"><span>{tf("invoices.paid")}</span><span className="tabular-nums">{formatMoney(paid)} / {formatMoney(ttc)}</span></p>
            <Progress value={ttc ? paid / ttc : 0} tone={paid >= ttc ? "ok" : inv.status === "overdue" ? "danger" : "brand"} className="mt-2" />
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
          <Card title={tf("invoices.links")}>
            <Dl items={[[tf("invoices.workOrder"), wo ? <Link className="text-accent" href={`/ops/work-orders/${wo.id}`}>{wo.number}</Link> : null], [tf("invoices.quote"), quote ? <Link className="text-accent" href={`/crm/quotes/${quote.id}`}>{quote.number}</Link> : null], [tf("invoices.dunning"), (dun.data ?? []).filter((d) => d.sent_at).map((d) => tf("dunning.step", { level: d.level, date: formatDate(d.sent_at!) })).join(" · ") || tf("invoices.none")]]} />
          </Card>
          <Card title={tf("invoices.facturx")}>
            {fx.length === 0 ? <p className="text-sm text-brand">{tf("invoices.facturxOk")}</p> : <ul className="text-sm text-[#b3402a]">{fx.map((e) => <li key={e}>{tf(`invoices.facturxCheck.${e}`)}</li>)}</ul>}
            <p className="mt-2 text-xs text-muted">{tf("invoices.facturxNote")}</p>
          </Card>
        </div>
      </div>
    </>
  );
}
