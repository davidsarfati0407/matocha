import { getTranslations } from "next-intl/server";
import { Card, PageHeader } from "@/components/ui/kit";
import { createClient } from "@/lib/supabase/server";
import { DocumentsTable } from "./table";

export async function generateMetadata() {
  const t = await getTranslations("comms");
  return { title: t("documents.title") };
}

/** Documents rattachés aux fiches. Les PDF de devis et factures sont générés à la volée. */
export default async function DocumentsPage() {
  const t = await getTranslations("comms.documents");
  const supabase = await createClient();
  const [docs, quotes, invoices] = await Promise.all([
    supabase.from("documents").select("id, entity_type, entity_id, name, kind, version, created_at").order("created_at", { ascending: false }),
    supabase.from("quotes").select("id, number, issued_on, clients(name)").order("number", { ascending: false }).limit(20),
    supabase.from("invoices").select("id, number, issued_on, clients(name)").order("number", { ascending: false }).limit(30),
  ]);
  const HREF: Record<string, string> = { lots: "/resources/lots/", quotes: "/crm/quotes/", clients: "/crm/clients/", employees: "/hr/employees/", work_orders: "/ops/work-orders/", invoices: "/finance/invoices/" };
  const rows = [
    ...(quotes.data ?? []).map((q) => ({ id: `q-${q.id}`, name: t("quoteFile", { number: q.number }), kind: t("kindQuote"), owner: (q.clients as unknown as { name: string })?.name ?? "", date: q.issued_on ?? "", open: `/crm/quotes/${q.id}/pdf`, link: `/crm/quotes/${q.id}`, stored: false })),
    ...(invoices.data ?? []).map((i) => ({ id: `i-${i.id}`, name: t("invoiceFile", { number: i.number }), kind: t("kindInvoice"), owner: (i.clients as unknown as { name: string })?.name ?? "", date: i.issued_on ?? "", open: `/finance/invoices/${i.id}/pdf`, link: `/finance/invoices/${i.id}`, stored: false })),
    ...(docs.data ?? []).map((d) => ({ id: d.id, name: d.name, kind: d.kind ?? "", owner: d.entity_type, date: d.created_at.slice(0, 10), open: null, link: HREF[d.entity_type] ? `${HREF[d.entity_type]}${d.entity_id}` : null, stored: true })),
  ];
  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <Card className="mb-4"><p className="text-sm text-muted">{t.rich("storageHint", { b: (c) => <b>{c}</b> })}</p></Card>
      <DocumentsTable rows={rows} />
    </>
  );
}
