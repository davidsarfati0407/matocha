import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, Denied, PageHeader } from "@/components/ui/kit";
import { requirePerm } from "@/lib/backoffice/context";
import { formatDate, formatMoney } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { ReviewDone, TrainingActions } from "./client";

export const metadata: Metadata = { title: "Entretiens & formations" };

export default async function ReviewsPage() {
  const { ctx, allowed } = await requirePerm("rh");
  if (!allowed) return <Denied what="les entretiens" />;
  const supabase = await createClient();
  const [reviews, trainings] = await Promise.all([
    supabase.from("reviews").select("id, scheduled_on, status, summary, objectives, employee:employee_id(id, first_name, last_name), reviewer:reviewer_id(first_name, last_name)").order("scheduled_on"),
    supabase.from("trainings").select("id, title, provider, starts_on, hours, cost, status, employee:employee_id(id, first_name, last_name)").order("starts_on"),
  ]);
  type P = { id?: string; first_name: string; last_name: string } | null;
  const canEdit = ctx.can("rh", "update");
  return (
    <>
      <PageHeader title="Entretiens & formations" subtitle="Entretiens annuels et professionnels, plan de formation et budget" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Entretiens">
          <ul className="divide-y divide-black/5 text-sm">
            {(reviews.data ?? []).map((r) => {
              const e = r.employee as unknown as P;
              const rv = r.reviewer as unknown as P;
              return (
                <li key={r.id} className="py-3">
                  <div className="flex items-center justify-between">
                    <Link className="font-medium hover:text-accent" href={`/hr/employees/${e?.id}?tab=dev`}>{e?.first_name} {e?.last_name}</Link>
                    <Badge tone={r.status === "done" ? "ok" : "info"}>{r.status === "done" ? "Fait" : `Prévu le ${r.scheduled_on ? formatDate(r.scheduled_on) : "—"}`}</Badge>
                  </div>
                  <p className="text-xs text-muted">avec {rv?.first_name} {rv?.last_name}</p>
                  {(r.objectives as { label?: string; titre?: string }[]).length > 0 && <ul className="mt-1 list-disc pl-5 text-xs">{(r.objectives as { label?: string; titre?: string }[]).map((o, i) => <li key={i}>{o.label ?? o.titre ?? JSON.stringify(o)}</li>)}</ul>}
                  {r.summary && <p className="mt-1 text-xs">{r.summary}</p>}
                  {r.status !== "done" && canEdit && <ReviewDone id={r.id} />}
                </li>
              );
            })}
          </ul>
        </Card>
        <Card title="Plan de formation" action={<span className="text-xs text-muted">Budget engagé : {formatMoney((trainings.data ?? []).filter((t) => t.status !== "cancelled").reduce((s, t) => s + Number(t.cost ?? 0), 0), "fr", 0)}</span>}>
          <ul className="divide-y divide-black/5 text-sm">
            {(trainings.data ?? []).map((t) => {
              const e = t.employee as unknown as P;
              return (
                <li key={t.id} className="flex items-center justify-between gap-3 py-3">
                  <span>
                    <span className="font-medium">{t.title}</span>
                    <span className="block text-xs text-muted">{e?.first_name} {e?.last_name} · {t.provider} · {t.starts_on ? formatDate(t.starts_on) : ""} · {t.hours} h · {formatMoney(Number(t.cost ?? 0), "fr", 0)}</span>
                  </span>
                  {t.status === "planned" && canEdit ? <TrainingActions id={t.id} /> : <Badge tone={t.status === "done" ? "ok" : "muted"}>{t.status === "done" ? "Réalisée" : t.status === "cancelled" ? "Annulée" : "Prévue"}</Badge>}
                </li>
              );
            })}
          </ul>
        </Card>
      </div>
    </>
  );
}
