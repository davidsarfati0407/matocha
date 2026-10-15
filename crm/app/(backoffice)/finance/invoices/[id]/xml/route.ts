import { NextResponse, type NextRequest } from "next/server";
import { sectorConfig } from "@/config/sector.config";
import { getCtx } from "@/lib/backoffice/context";
import { buildFacturX } from "@/lib/domain/facturx";
import { computeTotals } from "@/lib/domain/money";
import { createClient } from "@/lib/supabase/server";

/** XML Factur-X (CII, profil BASIC WL) de la facture. */
export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { settings, orgName } = await getCtx();
  const legal = (settings.legal ?? {}) as Record<string, string>;
  const supabase = await createClient();
  const { data: i } = await supabase.from("invoices").select("number, kind, issued_on, due_on, total_ht, total_vat, total_ttc, paid_amount, clients(name, city)").eq("id", id).maybeSingle();
  if (!i) return NextResponse.json({ error: "introuvable" }, { status: 404 });
  const { data: lines } = await supabase.from("invoice_lines").select("quantity, unit_price, vat_rate").eq("invoice_id", id);
  const t = computeTotals((lines ?? []).map((l) => ({ quantity: Number(l.quantity), unitPrice: Number(l.unit_price), vatRate: Number(l.vat_rate) })));
  const client = i.clients as unknown as { name: string; city: string | null };
  const xml = buildFacturX({
    number: i.number,
    kind: i.kind === "avoir" ? "avoir" : "facture",
    issuedOn: i.issued_on,
    dueOn: i.due_on,
    currency: sectorConfig.entreprise.devise,
    seller: { name: orgName, vatNumber: legal.vat_number ?? "", address: legal.address ?? "", country: sectorConfig.entreprise.pays },
    buyer: { name: client.name, city: client.city, country: sectorConfig.entreprise.pays },
    vatByRate: t.vatByRate,
    ht: Number(i.total_ht),
    vat: Number(i.total_vat),
    ttc: Number(i.total_ttc),
    paid: Number(i.paid_amount),
  });
  return new NextResponse(xml, { headers: { "content-type": "application/xml; charset=utf-8", "content-disposition": `attachment; filename="${i.number}-factur-x.xml"` } });
}
