import type { Metadata } from "next";
import Link from "next/link";
import { Pill } from "@/components/map/hud/ui";
import { ButtonLink, Card, Denied, PageHeader, Stat } from "@/components/ui/kit";
import { sectorConfig } from "@/config/sector.config";
import { requirePerm } from "@/lib/backoffice/context";
import { PRESENCE } from "@/lib/backoffice/labels";
import { nowMs } from "@/lib/clock";
import { computeDay, groupByLocalDay, weeklyOvertime, type Badge } from "@/lib/domain/time";
import { formatNumber, formatTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Présence" };

export default async function PresencePage() {
  const { allowed } = await requirePerm("rh");
  if (!allowed) return <Denied what="la présence de l'équipe" />;
  const now = nowMs();
  const monday = new Date(now);
  monday.setDate(monday.getDate() - ((monday.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const supabase = await createClient();
  const [pres, emps, badges] = await Promise.all([
    supabase.from("presence_status").select("employee_id, status, first_in, current_event"),
    supabase.from("employees").select("id, first_name, last_name, job_title, work_rate").is("left_on", null).order("last_name"),
    supabase.from("badge_events").select("employee_id, kind, at").gte("at", monday.toISOString()).order("at"),
  ]);
  const P = new Map((pres.data ?? []).map((p) => [p.employee_id, p]));
  const byEmp = new Map<string, Badge[]>();
  for (const b of badges.data ?? []) byEmp.set(b.employee_id, [...(byEmp.get(b.employee_id) ?? []), { kind: b.kind as Badge["kind"], at: b.at }]);
  const rows = (emps.data ?? []).map((e) => {
    const days = [...groupByLocalDay(byEmp.get(e.id) ?? []).values()].map((l) => computeDay(l, now));
    const worked = days.reduce((s, d) => s + d.workedMin, 0);
    return { ...e, p: P.get(e.id), worked, ot: weeklyOvertime(worked, Number(e.work_rate)), anomalies: days.flatMap((d) => d.anomalies) };
  });
  const count = (s: string[]) => rows.filter((r) => s.includes(r.p?.status ?? "")).length;
  return (
    <>
      <PageHeader title="Présence" subtitle="Badges du jour et feuilles de temps de la semaine, calculées automatiquement" actions={<ButtonLink href={`/map/${sectorConfig.lieux[0].id}`} icon="map">Voir sur la map</ButtonLink>} />
      <div className="mb-4 grid gap-4 sm:grid-cols-4">
        <Stat label="Sur site" value={count(["au_poste", "reunion", "pause"])} icon="user" />
        <Stat label="Télétravail / déplacement" value={count(["teletravail", "deplacement"])} icon="sun" />
        <Stat label="Absents" value={count(["absent"])} icon="calendar" />
        <Stat label="Pas encore badgé" value={count(["pas_badge"])} tone={count(["pas_badge"]) ? "warn" : undefined} icon="badge" />
      </div>
      <Card padded={false}>
        <table className="w-full text-sm">
          <thead className="text-left text-xs text-muted">
            <tr><th className="px-5 py-2 font-medium">Collaborateur</th><th className="px-3 font-medium">Statut</th><th className="px-3 font-medium">Arrivée</th><th className="px-3 text-right font-medium">Semaine</th><th className="px-3 text-right font-medium">H. sup.</th><th className="px-5 font-medium">Contrôles</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-black/5">
                <td className="px-5 py-2"><Link className="font-medium hover:text-accent" href={`/hr/employees/${r.id}?tab=temps`}>{r.first_name} {r.last_name}</Link><span className="block text-xs text-muted">{r.job_title}</span></td>
                <td className="px-3"><Pill tone={r.p?.status ?? "pas_badge"}>{PRESENCE[r.p?.status ?? "pas_badge"]}</Pill>{r.p?.current_event && <span className="block text-xs text-muted">{r.p.current_event}</span>}</td>
                <td className="px-3 tabular-nums">{r.p?.first_in ? formatTime(r.p.first_in) : "—"}</td>
                <td className="px-3 text-right tabular-nums">{formatNumber(r.worked / 60, "fr", 1)} h</td>
                <td className={`px-3 text-right tabular-nums ${r.ot > 0 ? "font-semibold text-[#9a6a00]" : "text-muted"}`}>{r.ot > 0 ? `${formatNumber(r.ot, "fr", 1)} h` : "—"}</td>
                <td className="px-5 text-xs">{r.anomalies.length ? <span className="text-[#9a6a00]">{[...new Set(r.anomalies)].join(", ")}</span> : <span className="text-muted">ok</span>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </>
  );
}
