import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Denied, PageHeader } from "@/components/ui/kit";
import { requirePerm } from "@/lib/backoffice/context";
import { formatDate } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { QuoteEditor, type Line } from "../editor";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("crm");
  return { title: t("quotes.newTitle") };
}

export default async function NewQuotePage({ searchParams }: { searchParams: Promise<{ client?: string; deal?: string }> }) {
  const t = await getTranslations("crm");
  const { allowed } = await requirePerm("commercial", "create");
  if (!allowed) return <Denied what={t("deniedQuoteCreate")} />;
  const sp = await searchParams;
  const supabase = await createClient();
  const [clients, catalog] = await Promise.all([supabase.from("clients").select("id, name").eq("kind", "entreprise").order("name"), supabase.from("catalog_items").select("id, sku, name, unit, unit_price, unit_cost, vat_rate").eq("active", true).order("unit_price", { ascending: false })]);
  const clientId = sp.client ?? clients.data?.[0]?.id ?? "";
  // Pré-remplissage : la dernière commande acceptée du compte (réassort en un clic)
  let lines: Line[] = [];
  let hint: string | undefined;
  const { data: last } = await supabase.from("quotes").select("id, number, accepted_at, discount_pct").eq("client_id", clientId).eq("status", "accepted").order("accepted_at", { ascending: false }).limit(1).maybeSingle();
  if (last) {
    const { data: ql } = await supabase.from("quote_lines").select("catalog_item_id, label, quantity, unit_price, unit_cost, vat_rate").eq("quote_id", last.id).order("position");
    lines = (ql ?? []).map((l) => ({ ...l, quantity: Number(l.quantity), unit_price: Number(l.unit_price), unit_cost: Number(l.unit_cost), vat_rate: Number(l.vat_rate) }));
    hint = last.accepted_at ? t("quotes.prefilledDated", { number: last.number, date: formatDate(last.accepted_at) }) : t("quotes.prefilled", { number: last.number });
  } else if (catalog.data?.[0]) {
    const c = catalog.data[0];
    lines = [{ catalog_item_id: c.id, label: c.name, quantity: 1, unit_price: Number(c.unit_price), unit_cost: Number(c.unit_cost), vat_rate: Number(c.vat_rate) }];
  }
  const { data: deal } = sp.deal ? await supabase.from("deals").select("title").eq("id", sp.deal).maybeSingle() : { data: null };
  return (
    <>
      <PageHeader kicker={t("kicker")} title={t("quotes.newTitle")} subtitle={deal ? t("quotes.forDeal", { title: deal.title }) : t("quotes.newSubtitle")} />
      <QuoteEditor
        clients={clients.data ?? []}
        catalog={(catalog.data ?? []).map((c) => ({ ...c, unit_price: Number(c.unit_price), unit_cost: Number(c.unit_cost), vat_rate: Number(c.vat_rate) }))}
        initial={{ client_id: clientId, deal_id: sp.deal ?? null, discount_pct: last ? Number(last.discount_pct) : 0, notes: "Livraison sous 48 h ouvrées. Paiement à 30 jours." /* conditions imprimées sur le devis : langue de l'entreprise */, lines, hint }}
      />
    </>
  );
}
