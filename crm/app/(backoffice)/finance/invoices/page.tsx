import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Denied, PageHeader, Stat } from "@/components/ui/kit";
import { requirePerm } from "@/lib/backoffice/context";
import { formatMoney } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { InvoicesTable } from "./table";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("finance");
  return { title: t("invoices.title") };
}

export default async function InvoicesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const t = await getTranslations("finance");
  const { allowed } = await requirePerm("finance");
  if (!allowed) return <Denied what={t("deniedInvoices")} />;
  const status = (await searchParams).status;
  const supabase = await createClient();
  await supabase.rpc("refresh_overdue"); // échéances dépassées → « échue » (sans effet si rôle en lecture)
  const { data } = await supabase.from("invoices").select("id, number, kind, status, issued_on, due_on, total_ht, total_ttc, paid_amount, clients(name), work_orders(number)").order("number", { ascending: false });
  const all = (data ?? []).map((i) => ({ id: i.id, number: i.number, kind: i.kind, status: i.status, issued: i.issued_on, due: i.due_on, ht: Number(i.total_ht), ttc: Number(i.total_ttc), paid: Number(i.paid_amount), client: (i.clients as unknown as { name: string } | null)?.name ?? "", wo: (i.work_orders as unknown as { number: string } | null)?.number ?? "" }));
  const open = all.filter((i) => ["sent", "partial", "overdue"].includes(i.status) && i.kind !== "avoir");
  const overdue = all.filter((i) => i.status === "overdue");
  const rows = status ? all.filter((i) => i.status === status) : all;
  return (
    <>
      <PageHeader title={t("invoices.title")} subtitle={t("invoices.subtitle")} />
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Stat label={t("invoices.outstanding")} value={formatMoney(open.reduce((s, i) => s + i.ttc - i.paid, 0), "fr", 0)} sub={t("invoices.openCount", { count: open.length })} icon="bank" href="?status=sent" />
        <Stat label={t("invoices.overdue")} value={formatMoney(overdue.reduce((s, i) => s + i.ttc - i.paid, 0), "fr", 0)} tone={overdue.length ? "danger" : undefined} sub={t("invoices.overdueCount", { count: overdue.length })} icon="bell" href="/finance/dunning" />
        <Stat label={t("invoices.collected")} value={formatMoney(all.reduce((s, i) => s + (i.kind === "avoir" ? 0 : i.paid), 0), "fr", 0)} icon="check" href="/finance/payments" />
      </div>
      <InvoicesTable rows={rows} />
    </>
  );
}
