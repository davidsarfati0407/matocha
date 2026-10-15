import { NextResponse, type NextRequest } from "next/server";
import { getTranslations } from "next-intl/server";
import { getCtx } from "@/lib/backoffice/context";
import { invoiceEntries, paymentEntries } from "@/lib/domain/accounting";
import { toCsv } from "@/lib/domain/csv";
import { computeTotals } from "@/lib/domain/money";
import { createClient } from "@/lib/supabase/server";

/** Export comptable du mois (journaux VT et BQ) au format CSV pour l'expert-comptable. */
export async function GET(req: NextRequest) {
  const ctx = await getCtx();
  if (!ctx.can("finance", "export")) return NextResponse.json({ error: (await getTranslations("finance"))("exportForbidden") }, { status: 403 });
  const month = /^\d{4}-\d{2}$/.test(req.nextUrl.searchParams.get("month") ?? "") ? req.nextUrl.searchParams.get("month")! : new Date().toISOString().slice(0, 7);
  const from = `${month}-01`;
  const to = new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 1)).toISOString().slice(0, 10);
  const supabase = await createClient();
  const [inv, pay] = await Promise.all([
    supabase.from("invoices").select("number, kind, issued_on, total_ttc, status, clients(name), invoice_lines(quantity, unit_price, vat_rate)").gte("issued_on", from).lt("issued_on", to).neq("status", "draft").order("issued_on"),
    supabase.from("payments").select("amount, received_on, invoices(number, clients(name))").gte("received_on", from).lt("received_on", to).order("received_on"),
  ]);
  const lines = [
    ...(inv.data ?? []).flatMap((i) => {
      const t = computeTotals((i.invoice_lines as { quantity: number; unit_price: number; vat_rate: number }[]).map((l) => ({ quantity: Number(l.quantity), unitPrice: Number(l.unit_price), vatRate: Number(l.vat_rate) })));
      return invoiceEntries({ number: i.number, kind: i.kind, issuedOn: i.issued_on, client: (i.clients as unknown as { name: string }).name, ttc: Number(i.total_ttc), vatByRate: t.vatByRate });
    }),
    ...(pay.data ?? []).flatMap((p) => {
      const inv = p.invoices as unknown as { number: string; clients: { name: string } } | null;
      return paymentEntries({ invoiceNumber: inv?.number ?? "?", client: inv?.clients?.name ?? "", receivedOn: p.received_on, amount: Number(p.amount) });
    }),
  ];
  // En-têtes du fichier pour l'expert-comptable : langue de l'entreprise
  const csv = toCsv(lines, [
    { header: "Journal", value: (l) => l.journal },
    { header: "Date", value: (l) => l.date.split("-").reverse().join("/") },
    { header: "Pièce", value: (l) => l.piece },
    { header: "Compte", value: (l) => l.account },
    { header: "Libellé", value: (l) => l.label },
    { header: "Débit", value: (l) => (l.debit ? l.debit.toFixed(2) : "").replace(".", ",") },
    { header: "Crédit", value: (l) => (l.credit ? l.credit.toFixed(2) : "").replace(".", ",") },
  ]);
  return new NextResponse(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="ecritures-${month}.csv"` } });
}
