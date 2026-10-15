import { NextResponse, type NextRequest } from "next/server";
import { getCtx } from "@/lib/backoffice/context";
import { computeTotals } from "@/lib/domain/money";
import { renderCommercialPdf } from "@/lib/pdf/commercial";
import { createClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { settings } = await getCtx();
  const supabase = await createClient();
  const { data: i } = await supabase.from("invoices").select("number, kind, issued_on, due_on, paid_amount, notes, clients(name, address, city, email), work_orders(number)").eq("id", id).maybeSingle();
  if (!i) return NextResponse.json({ error: "introuvable" }, { status: 404 });
  const { data: lines } = await supabase.from("invoice_lines").select("label, quantity, unit_price, vat_rate").eq("invoice_id", id).order("position");
  const ls = (lines ?? []).map((l) => ({ label: l.label, quantity: Number(l.quantity), unitPrice: Number(l.unit_price), vatRate: Number(l.vat_rate) }));
  const pdf = await renderCommercialPdf({
    kind: i.kind === "avoir" ? "Avoir" : "Facture",
    number: i.number,
    issuedOn: i.issued_on,
    secondDate: { label: "Échéance", value: i.due_on },
    client: i.clients as unknown as { name: string },
    lines: ls,
    totals: computeTotals(ls),
    paid: Number(i.paid_amount),
    notes: i.notes,
    legal: (settings.legal ?? {}) as Record<string, string>,
    reference: (i.work_orders as unknown as { number: string } | null)?.number,
  });
  return new NextResponse(new Uint8Array(pdf), { headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="${i.number}.pdf"` } });
}
