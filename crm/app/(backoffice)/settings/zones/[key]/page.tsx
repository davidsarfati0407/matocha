import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Pill } from "@/components/map/hud/ui";
import { ButtonLink, Card, PageHeader } from "@/components/ui/kit";
import { sectorConfig } from "@/config/sector.config";
import { PRESENCE } from "@/lib/backoffice/labels";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Espace" };

/** Fiche d'un espace des locaux (cible des liens depuis la map). */
export default async function ZonePage({ params }: { params: Promise<{ key: string }> }) {
  const { key } = await params;
  const supabase = await createClient();
  const { data: z } = await supabase.from("zones").select("id, key, name, type").eq("key", key).maybeSingle();
  if (!z) notFound();
  const [pres, emps, assets] = await Promise.all([
    supabase.from("presence_status").select("employee_id, status").eq("zone_id", z.id),
    supabase.from("employees").select("id, first_name, last_name, job_title, home_zone_id"),
    supabase.from("assets").select("id, name, type, status").eq("zone_id", z.id),
  ]);
  const E = new Map((emps.data ?? []).map((e) => [e.id, e]));
  const home = (emps.data ?? []).filter((e) => e.home_zone_id === z.id);
  return (
    <>
      <PageHeader kicker={`Espace · ${z.type}`} title={z.name} actions={<ButtonLink href={`/map/${sectorConfig.lieux[0].id}?focus=zones:${z.key}`} icon="map">Voir sur la map</ButtonLink>} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title={`Présents maintenant (${(pres.data ?? []).length})`}>
          <ul className="text-sm">{(pres.data ?? []).map((p) => { const e = E.get(p.employee_id); return <li key={p.employee_id} className="flex justify-between py-1"><Link className="hover:text-accent" href={`/hr/employees/${p.employee_id}`}>{e?.first_name} {e?.last_name}</Link><Pill tone={p.status}>{PRESENCE[p.status]}</Pill></li>; })}</ul>
        </Card>
        <Card title={`Postes rattachés (${home.length})`}>
          <ul className="text-sm">{home.map((e) => <li key={e.id} className="py-1"><Link className="hover:text-accent" href={`/hr/employees/${e.id}`}>{e.first_name} {e.last_name}</Link> <span className="text-muted">· {e.job_title}</span></li>)}</ul>
        </Card>
        <Card title={`Équipements (${(assets.data ?? []).length})`}>
          <ul className="text-sm">{(assets.data ?? []).map((a) => <li key={a.id} className="py-1"><Link className="hover:text-accent" href={`/resources/assets/${a.id}`}>{a.name}</Link></li>)}</ul>
        </Card>
      </div>
    </>
  );
}
