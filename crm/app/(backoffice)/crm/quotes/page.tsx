import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ButtonLink, Denied, PageHeader, Stat } from "@/components/ui/kit";
import { requirePerm } from "@/lib/backoffice/context";
import { formatMoney, formatPercent } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { QuotesTable } from "./table";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("crm");
  return { title: t("quotes.title") };
}

export default async function QuotesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const t = await getTranslations("crm");
  const { ctx, allowed } = await requirePerm("commercial");
  if (!allowed) return <Denied what={t("deniedQuotes")} />;
  const status = (await searchParams).status;
  const supabase = await createClient();
  const { data } = await supabase.from("quotes").select("id, number, status, total_ht, total_ttc, issued_on, valid_until, sent_at, clients(name), employees:owner_id(first_name, last_name)").order("number", { ascending: false });
  const all = (data ?? []).map((q) => {
    const o = q.employees as unknown as { first_name: string; last_name: string } | null;
    return { id: q.id, number: q.number, status: q.status, ht: Number(q.total_ht), issued: q.issued_on, valid: q.valid_until, client: (q.clients as unknown as { name: string } | null)?.name ?? "", owner: o ? `${o.first_name} ${o.last_name}` : "" };
  });
  const decided = all.filter((q) => ["accepted", "rejected"].includes(q.status));
  const rows = status ? all.filter((q) => q.status === status) : all;
  return (
    <>
      <PageHeader title={t("quotes.title")} subtitle={t("quotes.subtitle")} actions={ctx.can("commercial", "create") ? <ButtonLink href="/crm/quotes/new" variant="accent" icon="plus">{t("quotes.newTitle")}</ButtonLink> : undefined} />
      <div className="mb-4 grid gap-4 sm:grid-cols-3">
        <Stat label={t("quotes.awaiting")} value={formatMoney(all.filter((q) => ["sent", "opened"].includes(q.status)).reduce((s, q) => s + q.ht, 0), "fr", 0)} sub={t("quotes.count", { count: all.filter((q) => ["sent", "opened"].includes(q.status)).length })} icon="send" href="?status=sent" />
        <Stat label={t("quotes.drafts")} value={all.filter((q) => q.status === "draft").length} icon="file" href="?status=draft" />
        <Stat label={t("quotes.conversion")} value={decided.length ? formatPercent(decided.filter((q) => q.status === "accepted").length / decided.length, "fr", 0) : "—"} sub={t("quotes.conversionSub")} icon="chart" />
      </div>
      <QuotesTable rows={rows} />
    </>
  );
}
