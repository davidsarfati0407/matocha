"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Badge, Button, Card } from "@/components/ui/kit";
import { formatDate, formatTime } from "@/lib/format";
import { report } from "@/lib/ui/toast";
import { runAutomationsNow, toggleAutomation } from "../actions";

type A = { id: string; name: string; enabled: boolean; trigger: Record<string, unknown>; last_run_at: string | null };
const kind = (t: Record<string, unknown>) => (t.type === "event" ? "kindEvent" : t.type === "threshold" ? "kindThreshold" : "kindDate");

export function AutomationList({ rows, canEdit }: { rows: A[]; canEdit: boolean }) {
  const t = useTranslations("settings.automations");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [last, setLast] = useState<Record<string, { count: number | null; href: string | null }>>({});
  return (
    <>
      {canEdit && (
        <Button variant="accent" icon="zap" className="mb-4" disabled={pending} onClick={() => start(async () => { const r = await runAutomationsNow(); if (report(r) && r.ok && r.data) { setLast(Object.fromEntries(r.data.map((x) => [x.name, x]))); router.refresh(); } })}>
          {t("runNow")}
        </Button>
      )}
      <div className="grid gap-3 md:grid-cols-2">
        {rows.map((a) => {
          const [when, then] = a.name.split(" → ");
          const res = last[a.name];
          return (
            <Card key={a.id} className={a.enabled ? "" : "opacity-60"}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-xs uppercase tracking-wide text-muted">{t("when")}</p>
                  <p className="font-medium">{when}</p>
                  <p className="mt-1 text-xs uppercase tracking-wide text-muted">{t("then")}</p>
                  <p className="font-medium">{then}</p>
                  <p className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted">
                    <Badge tone={a.trigger.type === "event" ? "brand" : "info"}>{t(kind(a.trigger))}</Badge>
                    {a.last_run_at && t("lastRun", { date: formatDate(a.last_run_at), time: formatTime(a.last_run_at) })}
                    {res && res.count != null && (res.count > 0 && res.href ? <Link className="font-medium text-accent" href={res.href}>{t("items", { count: res.count })}</Link> : <span>{t("nothing")}</span>)}
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" role="switch" aria-label={t("toggle", { name: a.name })} checked={a.enabled} disabled={!canEdit || pending} onChange={() => start(async () => { if (report(await toggleAutomation(a.id, !a.enabled))) router.refresh(); })} className="size-4 accent-[var(--accent)]" />
                </label>
              </div>
            </Card>
          );
        })}
      </div>
    </>
  );
}
