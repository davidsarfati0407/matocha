import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Badge, Card, Denied, PageHeader } from "@/components/ui/kit";
import { requirePerm } from "@/lib/backoffice/context";
import { formatDate, formatMoney } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { ReviewDone, TrainingActions } from "./client";

export async function generateMetadata() {
  const t = await getTranslations("hr");
  return { title: t("reviews.title") };
}

export default async function ReviewsPage() {
  const { ctx, allowed } = await requirePerm("rh");
  const t = await getTranslations("hr.reviews");
  if (!allowed) return <Denied what={t("deniedWhat")} />;
  const supabase = await createClient();
  const [reviews, trainings] = await Promise.all([
    supabase.from("reviews").select("id, scheduled_on, status, summary, objectives, employee:employee_id(id, first_name, last_name), reviewer:reviewer_id(first_name, last_name)").order("scheduled_on"),
    supabase.from("trainings").select("id, title, provider, starts_on, hours, cost, status, employee:employee_id(id, first_name, last_name)").order("starts_on"),
  ]);
  type P = { id?: string; first_name: string; last_name: string } | null;
  const canEdit = ctx.can("rh", "update");
  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title={t("reviews")}>
          <ul className="divide-y divide-black/5 text-sm">
            {(reviews.data ?? []).map((r) => {
              const e = r.employee as unknown as P;
              const rv = r.reviewer as unknown as P;
              return (
                <li key={r.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <Link className="font-medium hover:text-accent" href={`/hr/employees/${e?.id}?tab=dev`}>{e?.first_name} {e?.last_name}</Link>
                    <Badge tone={r.status === "done" ? "ok" : "info"}>{r.status === "done" ? t("done") : t("plannedOn", { date: r.scheduled_on ? formatDate(r.scheduled_on) : "—" })}</Badge>
                  </div>
                  <p className="text-xs text-muted">{t("with", { name: `${rv?.first_name} ${rv?.last_name}` })}</p>
                  {(r.objectives as { label?: string; titre?: string }[]).length > 0 && <ul className="mt-1 list-disc pl-5 text-xs">{(r.objectives as { label?: string; titre?: string }[]).map((o, i) => <li key={i}>{o.label ?? o.titre ?? JSON.stringify(o)}</li>)}</ul>}
                  {r.summary && <p className="mt-1 text-xs">{r.summary}</p>}
                  {r.status !== "done" && canEdit && <ReviewDone id={r.id} />}
                </li>
              );
            })}
          </ul>
        </Card>
        <Card title={t("trainingPlan")} action={<span className="text-xs text-muted">{t("budget", { amount: formatMoney((trainings.data ?? []).filter((x) => x.status !== "cancelled").reduce((s, x) => s + Number(x.cost ?? 0), 0), "fr", 0) })}</span>}>
          <ul className="divide-y divide-black/5 text-sm">
            {(trainings.data ?? []).map((tr) => {
              const e = tr.employee as unknown as P;
              return (
                <li key={tr.id} className="flex items-center justify-between gap-3 py-3">
                  <span>
                    <span className="font-medium">{tr.title}</span>
                    <span className="block text-xs text-muted">{e?.first_name} {e?.last_name} · {tr.provider} · {tr.starts_on ? formatDate(tr.starts_on) : ""} · {t("hours", { h: String(tr.hours) })} · {formatMoney(Number(tr.cost ?? 0), "fr", 0)}</span>
                  </span>
                  {tr.status === "planned" && canEdit ? <TrainingActions id={tr.id} /> : <Badge tone={tr.status === "done" ? "ok" : "muted"}>{tr.status === "done" ? t("trainingDone") : tr.status === "cancelled" ? t("trainingCancelled") : t("trainingPlanned")}</Badge>}
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </>
  );
}
