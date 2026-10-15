import { NextResponse, type NextRequest } from "next/server";
import { getCtx } from "@/lib/backoffice/context";
import { computeTotals } from "@/lib/domain/money";
import { renderCommercialPdf } from "@/lib/pdf/commercial";
import { createClient } from "@/lib/supabase/server";

/** PDF du devis, généré à la volée avec les droits (RLS) de l'utilisateur. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { settings } = await getCtx();
  const supabase = await createClient();
  const { data: q } = await supabase.from("quotes").select("number, issued_on, valid_until, discount_pct, notes, clients(name, address, city, email)").eq("id", id).maybeSingle();
  if (!q) return NextResponse.json({ error: "introuvable" }, { status: 404 });
  const { data: lines } = await supabase.from("quote_lines").select("label, quantity, unit_price, vat_rate").eq("quote_id", id).order("position");
  const ls = (lines ?? []).map((l) => ({ label: l.label, quantity: Number(l.quantity), unitPrice: Number(l.unit_price), vatRate: Number(l.vat_rate) }));
  const t = computeTotals(ls, { discountPct: Number(q.discount_pct) });
  const pdf = await renderCommercialPdf({
    kind: "Devis",
    number: q.number,
    issuedOn: q.issued_on ?? new Date().toISOString(),
    secondDate: { label: "Valable jusqu'au", value: q.valid_until ?? new Date().toISOString() },
    client: q.clients as unknown as { name: string },
    lines: ls,
    totals: { ...t, discountPct: Number(q.discount_pct) },
    notes: q.notes,
    legal: (settings.legal ?? {}) as Record<string, string>,
  });
  return new NextResponse(new Uint8Array(pdf), { headers: { "content-type": "application/pdf", "content-disposition": `inline; filename="${q.number}.pdf"` } });
}
