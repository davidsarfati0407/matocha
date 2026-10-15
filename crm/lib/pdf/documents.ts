import "server-only";
/** Génération des PDF de devis et de facture (une seule source pour l'aperçu, le téléchargement et l'e-mail). */
import { getCtx } from "@/lib/backoffice/context";
import { computeTotals } from "@/lib/domain/money";
import { createClient } from "@/lib/supabase/server";
import { sectorConfig } from "@/config/sector.config";
import { buildFacturX } from "@/lib/domain/facturx";
import { renderCommercialPdf } from "./commercial";
import { toFacturX } from "./facturx";

export async function quotePdf(id: string): Promise<{ number: string; pdf: Buffer } | null> {
  const { settings } = await getCtx();
  const supabase = await createClient();
  const { data: q } = await supabase.from("quotes").select("number, issued_on, valid_until, discount_pct, notes, clients(name, address, city, email)").eq("id", id).maybeSingle();
  if (!q) return null;
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
  return { number: q.number, pdf };
}

/** XML Factur-X (CII BASIC WL) de la facture, à partir des mêmes données que le PDF. */
export async function invoiceXml(id: string): Promise<{ number: string; xml: string } | null> {
  const { settings, orgName } = await getCtx();
  const legal = (settings.legal ?? {}) as Record<string, string>;
  const supabase = await createClient();
  const { data: i } = await supabase.from("invoices").select("number, kind, issued_on, due_on, total_ht, total_vat, total_ttc, paid_amount, clients(name, city)").eq("id", id).maybeSingle();
  if (!i) return null;
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
  return { number: i.number, xml };
}

/** PDF de la facture : PDF/A-3 Factur-X (XML CII embarqué). */
export async function invoicePdf(id: string): Promise<{ number: string; pdf: Buffer } | null> {
  const { settings, orgName } = await getCtx();
  const supabase = await createClient();
  const { data: i } = await supabase.from("invoices").select("number, kind, issued_on, due_on, paid_amount, notes, clients(name, address, city, email), work_orders(number)").eq("id", id).maybeSingle();
  if (!i) return null;
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
  const x = await invoiceXml(id);
  const hybrid = x ? await toFacturX(pdf, x.xml, { number: i.number, author: orgName }) : pdf;
  return { number: i.number, pdf: Buffer.from(hybrid) };
}
