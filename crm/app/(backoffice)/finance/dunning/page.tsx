import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Card, Denied, Empty, PageHeader } from "@/components/ui/kit";
import { sectorConfig } from "@/config/sector.config";
import { requirePerm } from "@/lib/backoffice/context";
import { daysBetween, dunningText, nextDunning } from "@/lib/domain/billing";
import { formatDate, formatMoney } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { DunningCard } from "./client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("finance");
  return { title: t("dunning.title") };
}

export default async function DunningPage({ searchParams }: { searchParams: Promise<{ invoice?: string }> }) {
  const t = await getTranslations("finance");
  const { ctx, allowed } = await requirePerm("finance");
  if (!allowed) return <Denied what={t("deniedDunning")} />;
  const focus = (await searchParams).invoice;
  const supabase = await createClient();
  await supabase.rpc("refresh_overdue");
  const { data } = await supabase.from("invoices").select("id, number, status, due_on, total_ttc, paid_amount, clients(name, email), dunning_steps(level, sent_at)").in("status", ["sent", "partial", "overdue"]).eq("kind", "facture").order("due_on");
  const today = new Date().toLocaleDateString("sv-SE", { timeZone: sectorConfig.entreprise.fuseau });
  const days = (ctx.settings.dunning_days as number[] | undefined) ?? [1, 15, 30];
  const items = (data ?? [])
    .map((i) => {
      const steps = (i.dunning_steps as { level: number; sent_at: string | null }[]).map((s) => ({ level: s.level, sentAt: s.sent_at }));
      const n = nextDunning({ dueOn: i.due_on, status: i.status, totalTtc: Number(i.total_ttc), paidAmount: Number(i.paid_amount) }, steps, today, days);
      const client = i.clients as unknown as { name: string; email: string | null };
      const rest = Number(i.total_ttc) - Number(i.paid_amount);
      return { id: i.id, number: i.number, client, rest, late: daysBetween(i.due_on, today), next: n, sent: steps.filter((s) => s.sentAt), text: n ? /* texte envoyé au client : langue de l'entreprise */ dunningText(n.level, { client: client.name, number: i.number, amount: formatMoney(rest), dueOn: formatDate(i.due_on), company: ctx.orgName }) : "" };
    })
    .filter((x) => x.late > 0);
  const due = items.filter((x) => x.next).sort((a, b) => (a.id === focus ? -1 : b.id === focus ? 1 : b.late - a.late));
  return (
    <>
      <PageHeader title={t("dunning.title")} subtitle={t("dunning.subtitle", { steps: days.map((d) => t("dunning.dayStep", { days: d })).join(", ") })} />
      {due.length === 0 ? (
        <Empty icon="check" title={t("dunning.empty")} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {due.map((x) => (
            <DunningCard key={x.id} id={x.id} number={x.number} client={x.client.name} email={x.client.email} rest={x.rest} late={x.late} level={x.next!.level} sent={x.sent.map((s) => t("dunning.step", { level: s.level, date: formatDate(s.sentAt!) }))} text={x.text} canSend={ctx.can("finance", "update")} />
          ))}
        </div>
      )}
      {items.length > due.length && (
        <Card title={t("dunning.waiting")} className="mt-4">
          <ul className="text-sm">
            {items.filter((x) => !x.next).map((x) => (
              <li key={x.id} className="flex justify-between py-1">
                <span><span className="font-mono">{x.number}</span> · {x.client.name}</span>
                <span className="text-muted">{t("dunning.daysLate", { days: x.late })} · {formatMoney(x.rest)}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
