import type { Metadata } from "next";
import Link from "next/link";
import { Badge, Card, PageHeader } from "@/components/ui/kit";
import { getCtx } from "@/lib/backoffice/context";
import { nowMs } from "@/lib/clock";
import { formatTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { NewEvent, PersonPicker } from "./client";

export const metadata: Metadata = { title: "Calendrier" };

const TYPE: Record<string, string> = { reunion: "bg-brand text-ground", client: "bg-accent text-white", focus: "bg-matcha/40 text-brand", pause: "bg-black/10", teletravail: "bg-[#2a78d6]/15 text-[#1d5ba6]", deplacement: "bg-[#9a6a00]/15 text-[#7a5300]", tournage: "bg-[#7b4bb7]/15 text-[#5f3794]", livraison: "bg-black/10", autre: "bg-black/10" };
const H0 = 8;
const H1 = 19;

export default async function CalendarPage({ searchParams }: { searchParams: Promise<{ who?: string; week?: string }> }) {
  const ctx = await getCtx();
  const sp = await searchParams;
  const who = sp.who ?? ctx.employeeId ?? "";
  const offset = Number(sp.week ?? 0);
  const today = new Date(nowMs());
  const monday = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - ((today.getUTCDay() + 6) % 7) + offset * 7));
  const days = Array.from({ length: 5 }, (_, i) => new Date(monday.getTime() + i * 86400_000).toISOString().slice(0, 10));
  const supabase = await createClient();
  const [emps, events, clients, rooms] = await Promise.all([
    supabase.from("employees").select("id, first_name, last_name").order("first_name"),
    supabase.from("calendar_events").select("id, title, type, starts_at, ends_at, client_id, owner_id, attendees, external_source, clients:client_id(name)").or(`owner_id.eq.${who},attendees.cs.{${who}}`).gte("starts_at", `${days[0]}T00:00:00Z`).lte("starts_at", `${days[4]}T23:59:59Z`).order("starts_at"),
    supabase.from("clients").select("id, name").order("name"),
    supabase.from("assets").select("id, name").eq("type", "salle"),
  ]);
  const hourOf = (iso: string) => Number(new Date(iso).toLocaleString("en-GB", { hour: "2-digit", hour12: false, timeZone: "Europe/Paris" })) + new Date(iso).getMinutes() / 60;
  const top = (iso: string) => ((Math.min(H1, Math.max(H0, hourOf(iso))) - H0) / (H1 - H0)) * 100;
  const todayIso = today.toISOString().slice(0, 10);
  return (
    <>
      <PageHeader
        title="Calendrier"
        subtitle="Rendez-vous clients, réunions et tournages · agenda Google/Microsoft en mode simulé"
        actions={
          <>
            <PersonPicker people={(emps.data ?? []).map((e) => ({ id: e.id, name: `${e.first_name} ${e.last_name}` }))} who={who} />
            <Link className="rounded-xl px-3 py-2 text-sm ring-1 ring-black/10" href={`?who=${who}&week=${offset - 1}`}>←</Link>
            <Link className="rounded-xl px-3 py-2 text-sm ring-1 ring-black/10" href={`?who=${who}`}>Cette semaine</Link>
            <Link className="rounded-xl px-3 py-2 text-sm ring-1 ring-black/10" href={`?who=${who}&week=${offset + 1}`}>→</Link>
            <NewEvent clients={clients.data ?? []} rooms={rooms.data ?? []} day={days.includes(todayIso) ? todayIso : days[0]} />
          </>
        }
      />
      <Card padded={false} className="overflow-x-auto">
        <div className="grid min-w-[760px] grid-cols-[48px_repeat(5,1fr)]">
          <div />
          {days.map((d) => (
            <div key={d} className={`border-b border-l border-black/5 px-3 py-2 text-sm font-medium ${d === todayIso ? "text-accent" : ""}`}>
              {new Date(`${d}T12:00:00Z`).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" })}
            </div>
          ))}
          <div className="relative h-[620px] text-[10px] text-muted">
            {Array.from({ length: H1 - H0 }, (_, i) => (
              <span key={i} className="absolute right-2" style={{ top: `${(i / (H1 - H0)) * 100}%` }}>
                {H0 + i}h
              </span>
            ))}
          </div>
          {days.map((d) => (
            <div key={d} className="relative h-[620px] border-l border-black/5 bg-[repeating-linear-gradient(180deg,transparent,transparent_55px,rgba(0,0,0,0.04)_55px,rgba(0,0,0,0.04)_56px)]">
              {(events.data ?? [])
                .filter((e) => e.starts_at.slice(0, 10) === d)
                .map((e) => (
                  <div key={e.id} className={`absolute inset-x-1 overflow-hidden rounded-lg px-2 py-1 text-[11px] leading-tight ${TYPE[e.type] ?? TYPE.autre}`} style={{ top: `${top(e.starts_at)}%`, height: `${Math.max(3.5, top(e.ends_at) - top(e.starts_at))}%` }} title={e.title}>
                    <p className="truncate font-semibold">{e.title}</p>
                    <p className="truncate opacity-80">
                      {formatTime(e.starts_at)}–{formatTime(e.ends_at)}
                      {(e.clients as unknown as { name: string } | null)?.name ? ` · ${(e.clients as unknown as { name: string }).name}` : ""}
                    </p>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </Card>
      <p className="mt-3 flex flex-wrap gap-2 text-xs text-muted">
        {Object.keys(TYPE).filter((k) => k !== "autre").map((k) => <Badge key={k} tone="muted">{k}</Badge>)}
      </p>
    </>
  );
}
