import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Card, Denied, PageHeader, Stat, btn } from "@/components/ui/kit";
import { requirePerm } from "@/lib/backoffice/context";
import { formatDate, formatMoney } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { TreasuryChart } from "./chart";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("finance");
  return { title: t("treasury.title") };
}

export default async function TreasuryPage() {
  const t = await getTranslations("finance");
  const { ctx, allowed } = await requirePerm("finance");
  if (!allowed) return <Denied what={t("deniedTreasury")} />;
  const supabase = await createClient();
  const [fc, open, exp] = await Promise.all([
    supabase.from("cash_forecast").select("week_start, inflow, outflow, note").order("week_start"),
    supabase.from("invoices").select("total_ttc, paid_amount, due_on, status").in("status", ["sent", "partial", "overdue"]).eq("kind", "facture"),
    supabase.from("expenses").select("amount_ttc").eq("status", "approved"),
  ]);
  const weeks = (fc.data ?? []).map((w) => ({ week: w.week_start, inflow: Number(w.inflow), outflow: Number(w.outflow), note: w.note }));
  // Solde bancaire de départ : saisi dans les paramètres (connexion bancaire en mode simulé)
  const opening = Number(ctx.settings.cash_opening ?? 0);
  const withCum = weeks.map((w, i) => ({ ...w, cum: opening + weeks.slice(0, i + 1).reduce((s, x) => s + x.inflow - x.outflow, 0) }));
  const cum = withCum.at(-1)?.cum ?? opening;
  const low = withCum.length ? Math.min(...withCum.map((w) => w.cum)) : opening;
  const receivable = (open.data ?? []).reduce((s, i) => s + Number(i.total_ttc) - Number(i.paid_amount), 0);
  const overdue = (open.data ?? []).filter((i) => i.status === "overdue").reduce((s, i) => s + Number(i.total_ttc) - Number(i.paid_amount), 0);
  const month = new Date().toISOString().slice(0, 7);
  return (
    <>
      <PageHeader
        title={t("treasury.title")}
        subtitle={t("treasury.subtitle")}
        actions={ctx.can("finance", "export") ? <a className={btn("secondary")} href={`/finance/export?month=${month}`} download>{t("treasury.export")}</a> : undefined}
      />
      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label={t("treasury.receivables")} value={formatMoney(receivable, "fr", 0)} sub={t("treasury.overduePart", { amount: formatMoney(overdue, "fr", 0) })} tone={overdue ? "warn" : undefined} icon="bank" href="/finance/invoices?status=overdue" />
        <Stat label={t("treasury.expenses")} value={formatMoney((exp.data ?? []).reduce((s, e) => s + Number(e.amount_ttc), 0), "fr", 0)} icon="receipt" href="/finance/expenses" />
        <Stat label={t("treasury.in8Weeks")} value={formatMoney(cum, "fr", 0)} tone={cum < 0 ? "danger" : undefined} sub={t("treasury.opening", { amount: formatMoney(opening, "fr", 0) })} icon="chart" />
        <Stat label={t("treasury.low")} value={formatMoney(low, "fr", 0)} tone={low < 0 ? "danger" : low < opening * 0.5 ? "warn" : undefined} sub={t("treasury.lowSub")} icon="bell" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title={t("treasury.chartTitle")} className="lg:col-span-2">
          <TreasuryChart data={weeks} />
        </Card>
        <Card title={t("treasury.detail")} padded={false}>
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted">
              <tr><th className="px-5 py-2 font-medium">{t("treasury.week")}</th><th className="px-2 text-right font-medium">{t("treasury.net")}</th><th className="px-5 text-right font-medium">{t("treasury.balance")}</th></tr>
            </thead>
            <tbody>
              {withCum.map((w) => (
                <tr key={w.week} className="border-t border-black/5" title={w.note ?? undefined}>
                  <td className="px-5 py-2">{formatDate(w.week)}{w.note && <span className="block text-xs text-muted">{w.note}</span>}</td>
                  <td className={`px-2 text-right tabular-nums ${w.inflow - w.outflow < 0 ? "text-[#b3402a]" : ""}`}>{formatMoney(w.inflow - w.outflow, "fr", 0)}</td>
                  <td className="px-5 text-right tabular-nums">{formatMoney(w.cum, "fr", 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </>
  );
}
