import type { Metadata } from "next";
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";
import { Card, Denied, PageHeader } from "@/components/ui/kit";
import { requirePerm } from "@/lib/backoffice/context";
import { overlaps } from "@/lib/domain/stages";
import { formatTime } from "@/lib/format";
import { LEAVE_TYPE } from "@/lib/backoffice/labels";
import { createClient } from "@/lib/supabase/server";
import { BookButton } from "./book";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("ops.planning");
  return { title: t("title") };
}

type Block = { title: string; start: string; end: string; kind: "event" | "booking" | "leave" };

export default async function PlanningPage({ searchParams }: { searchParams: Promise<{ day?: string; kind?: string }> }) {
  const t = await getTranslations("ops.planning");
  const tAll = await getTranslations();
  const { allowed } = await requirePerm("operations");
  if (!allowed) return <Denied what={t("deniedWhat")} />;
  const sp = await searchParams;
  const day = sp.day ?? new Date().toISOString().slice(0, 10);
  const kind = sp.kind ?? "salle";
  const d0 = new Date(`${day}T00:00:00+02:00`);
  const d1 = new Date(d0.getTime() + 86400_000);
  const supabase = await createClient();
  const [assets, emps, cal, bookings, leaves] = await Promise.all([
    supabase.from("assets").select("id, name, type").in("type", ["salle", "vehicule", "machine", "equipement"]).order("name"),
    supabase.from("employees").select("id, first_name, last_name, job_title").order("last_name"),
    supabase.from("calendar_events").select("title, starts_at, ends_at, owner_id, attendees, resource_id, type").lt("starts_at", d1.toISOString()).gt("ends_at", d0.toISOString()),
    supabase.from("asset_bookings").select("asset_id, title, starts_at, ends_at").lt("starts_at", d1.toISOString()).gt("ends_at", d0.toISOString()),
    supabase.from("leave_requests").select("employee_id, type, starts_on, ends_on").eq("status", "approved").lte("starts_on", day).gte("ends_on", day),
  ]);
  const people = kind === "personne";
  const rows = people
    ? (emps.data ?? []).map((e) => ({ id: e.id, label: `${e.first_name} ${e.last_name}`, sub: e.job_title }))
    : (assets.data ?? []).filter((a) => a.type === kind || (kind === "equipement" && ["machine", "equipement"].includes(a.type))).map((a) => ({ id: a.id, label: a.name, sub: a.type }));
  const blocksFor = (id: string): Block[] => {
    const out: Block[] = [];
    for (const c of cal.data ?? []) if ((people && (c.owner_id === id || (c.attendees ?? []).includes(id))) || (!people && c.resource_id === id)) out.push({ title: c.title, start: c.starts_at, end: c.ends_at, kind: "event" });
    if (!people) for (const b of bookings.data ?? []) if (b.asset_id === id && !out.some((o) => o.title === b.title && o.start === b.starts_at)) out.push({ title: b.title ?? t("bookingFallback"), start: b.starts_at, end: b.ends_at, kind: "booking" });
    if (people) for (const l of leaves.data ?? []) if (l.employee_id === id) out.push({ title: l.type === "conges" ? t("leave") : LEAVE_TYPE[l.type] ? tAll(LEAVE_TYPE[l.type] as never) : l.type, start: d0.toISOString(), end: d1.toISOString(), kind: "leave" });
    return out;
  };
  const H0 = 7;
  const H1 = 20;
  const pos = (iso: string) => {
    const d = new Date(iso);
    const h = Number(d.toLocaleString("en-GB", { hour: "2-digit", hour12: false, timeZone: "Europe/Paris" })) + d.getMinutes() / 60;
    return Math.max(0, Math.min(1, (h - H0) / (H1 - H0))) * 100;
  };
  const kinds = ["salle", "vehicule", "equipement", "personne"] as const;
  const dateLocale = (await getLocale()) === "en" ? "en-GB" : "fr-FR";
  const shift = (n: number) => new Date(Date.parse(day) + n * 86400_000).toISOString().slice(0, 10);
  return (
    <>
      <PageHeader
        title={t("title")}
        subtitle={t("subtitle", { date: new Date(`${day}T12:00:00Z`).toLocaleDateString(dateLocale, { weekday: "long", day: "numeric", month: "long" }) })}
        actions={
          <>
            <Link className="rounded-xl px-3 py-2 text-sm ring-1 ring-black/10" href={`?day=${shift(-1)}&kind=${kind}`}>{t("prevDay")}</Link>
            <Link className="rounded-xl px-3 py-2 text-sm ring-1 ring-black/10" href={`?kind=${kind}`}>{t("today")}</Link>
            <Link className="rounded-xl px-3 py-2 text-sm ring-1 ring-black/10" href={`?day=${shift(1)}&kind=${kind}`}>{t("nextDay")}</Link>
            {!people && <BookButton assets={rows.map((r) => ({ id: r.id, name: r.label }))} day={day} />}
          </>
        }
      />
      <div className="mb-3 flex gap-1 rounded-xl bg-black/[0.04] p-0.5 text-sm font-medium sm:w-fit">
        {kinds.map((k) => (
          <Link key={k} href={`?day=${day}&kind=${k}`} className={`rounded-lg px-3 py-1.5 ${kind === k ? "bg-white shadow-sm" : "text-muted"}`}>
            {t(`kinds.${k}`)}
          </Link>
        ))}
      </div>
      <Card padded={false}>
        {/* Zone défilante horizontale : focusable au clavier (flèches) et nommée pour les lecteurs d'écran */}
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label={t("gridLabel")}>
        <div className="min-w-[860px]">
          <div className="grid grid-cols-[220px_1fr] border-b border-black/5 text-[11px] text-muted">
            <span className="px-4 py-2">{t("resource")}</span>
            <div className="relative h-8">
              {Array.from({ length: H1 - H0 + 1 }, (_, i) => (
                <span key={i} className="absolute top-2 -translate-x-1/2" style={{ left: `${(i / (H1 - H0)) * 100}%` }}>
                  {t("hourTick", { hour: H0 + i })}
                </span>
              ))}
            </div>
          </div>
          {rows.map((r) => {
            const blocks = blocksFor(r.id);
            const conflicts = new Set<number>();
            blocks.forEach((a, i) => blocks.forEach((b, j) => i < j && a.kind !== "leave" && b.kind !== "leave" && overlaps(a, b) && (conflicts.add(i), conflicts.add(j))));
            return (
              <div key={r.id} className="grid grid-cols-[220px_1fr] border-b border-black/5 last:border-0">
                <div className="px-4 py-2 leading-tight">
                  <p className="truncate text-sm font-medium">{r.label}</p>
                  <p className="truncate text-[11px] text-muted">{conflicts.size ? <span className="font-semibold text-[#b3402a]">{t("conflict")}</span> : blocks.length ? t("busy") : t("free")}</p>
                </div>
                <div className="relative h-12 bg-[repeating-linear-gradient(90deg,transparent,transparent_calc(100%/13-1px),rgba(0,0,0,0.04)_calc(100%/13-1px),rgba(0,0,0,0.04)_calc(100%/13))]">
                  {blocks.map((b, i) => (
                    <div key={i} title={`${b.title} · ${formatTime(b.start)}–${formatTime(b.end)}`} className={`absolute top-2 h-8 overflow-hidden rounded-lg px-2 py-1 text-[11px] leading-tight ${conflicts.has(i) ? "bg-[#b3402a] text-white" : b.kind === "leave" ? "bg-matcha/25 text-brand" : "bg-brand text-ground"}`} style={{ left: `${pos(b.start)}%`, width: `${Math.max(2, pos(b.end) - pos(b.start))}%` }}>
                      <span className="block truncate font-semibold">{b.title}</span>
                      {b.kind !== "leave" && <span className="block truncate opacity-80">{formatTime(b.start)}–{formatTime(b.end)}</span>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        </div>
      </Card>
    </>
  );
}
