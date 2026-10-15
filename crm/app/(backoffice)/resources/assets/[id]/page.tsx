import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge, ButtonLink, Card, Denied, Dl, PageHeader, Progress } from "@/components/ui/kit";
import { sectorConfig } from "@/config/sector.config";
import { requirePerm } from "@/lib/backoffice/context";
import { formatDate, formatMoney, formatTime } from "@/lib/format";
import { mapHref } from "@/lib/map/links";
import { createClient } from "@/lib/supabase/server";
import { ASSET_STATUS, ASSET_TYPE } from "@/lib/backoffice/labels";
import { AssetActions } from "./client";

export const metadata: Metadata = { title: "Équipement" };

/** Libellés lisibles pour la télémétrie (valeurs 0–1 affichées en jauge). */
const TELE: Record<string, string> = { batterie: "Batterie", km: "Kilométrage", rouleau: "Rouleau d'étiquettes", temperature_c: "Température (°C)", humidite: "Humidité", cpu: "Processeur", ram: "Mémoire", eau_l: "Réservoir d'eau (L)", boites: "Boîtes", cycles_jour: "Cycles du jour", colis_jour: "Colis du jour", pages_jour: "Pages du jour", boissons_jour: "Boissons du jour", etiquettes_jour: "Étiquettes du jour", en_charge: "En charge", app: "Application", session: "Session", maj_en_attente: "Mise à jour en attente", cout_page: "Coût par page (€)" };

export default async function AssetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { ctx, allowed } = await requirePerm("ressources");
  if (!allowed) return <Denied what="les équipements" />;
  const supabase = await createClient();
  const { data: a } = await supabase.from("assets").select("*, zones(name), employees:assigned_employee_id(id, first_name, last_name)").eq("id", id).maybeSingle();
  if (!a) notFound();
  const { data: bookings } = await supabase.from("asset_bookings").select("id, title, starts_at, ends_at, employees(first_name, last_name)").eq("asset_id", id).gte("ends_at", new Date().toISOString()).order("starts_at").limit(10);
  const emp = a.employees as unknown as { id: string; first_name: string; last_name: string } | null;
  // Les listes [{nom, niveau}] (bacs papier…) sont affichées comme des jauges nommées
  const tele = Object.entries((a.telemetry ?? {}) as Record<string, unknown>).map(([k, v]) => [k, Array.isArray(v) ? Object.fromEntries(v.map((x: { nom: string; niveau: number }) => [x.nom, x.niveau])) : v] as [string, unknown]);
  const st = ASSET_STATUS[a.status];
  return (
    <>
      <PageHeader
        kicker={ASSET_TYPE[a.type]}
        title={a.name}
        subtitle={(a.zones as unknown as { name: string } | null)?.name}
        actions={
          <>
            <Badge tone={st[0]}>{st[1]}</Badge>
            <ButtonLink href={mapHref(sectorConfig.lieux[0].id, a.type === "vehicule" ? "vehicles" : "assets", id)} icon="map">Voir sur la map</ButtonLink>
          </>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Fiche">
          <Dl items={[["Affecté à", emp ? `${emp.first_name} ${emp.last_name}` : null], ["Prochaine maintenance", a.next_maintenance_on ? formatDate(a.next_maintenance_on) : null], ["Coût d'achat", a.purchase_cost ? formatMoney(Number(a.purchase_cost), "fr", 0) : null], ...Object.entries((a.specs ?? {}) as Record<string, unknown>).map(([k, v]) => [k, String(v)] as [string, string])]} />
          {ctx.can("ressources", "update") && <AssetActions id={id} status={a.status} next={a.next_maintenance_on} />}
        </Card>
        <Card title="État en direct" action={<span className="text-xs text-muted">télémétrie simulée</span>}>
          {tele.length === 0 ? (
            <p className="text-sm text-muted">Pas de capteur sur cet équipement.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {tele.map(([k, v]) => (
                <li key={k}>
                  <div className="flex justify-between">
                    <span className="text-muted">{TELE[k] ?? (k === "bacs" ? "Bacs papier" : k === "toner" ? "Toner" : k)}</span>
                    <span className="font-medium tabular-nums">{typeof v === "number" && v <= 1 && !k.endsWith("_jour") && k !== "cout_page" ? `${Math.round(v * 100)} %` : typeof v === "boolean" ? (v ? "Oui" : "Non") : typeof v === "object" ? "" : String(v)}</span>
                  </div>
                  {typeof v === "number" && v <= 1 && !k.endsWith("_jour") && k !== "cout_page" && <Progress value={v * 100} tone={v < 0.2 ? "danger" : "brand"} className="mt-1" />}
                  {typeof v === "object" && v && !Array.isArray(v) && (
                    <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-2">
                      {Object.entries(v as Record<string, number>).map(([kk, vv]) => (
                        <div key={kk} className="text-xs">
                          <p className="mb-1 flex justify-between"><span>{kk}</span><span className="tabular-nums">{Math.round(vv * 100)} %</span></p>
                          <Progress value={vv * 100} tone={vv < 0.2 ? "danger" : "brand"} />
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Prochaines réservations" action={<a className="text-xs font-medium text-accent" href={`/ops/planning?kind=${a.type === "salle" ? "salle" : a.type === "vehicule" ? "vehicule" : "equipement"}`}>Planning →</a>}>
          {(bookings ?? []).length === 0 ? (
            <p className="text-sm text-muted">Aucune réservation à venir.</p>
          ) : (
            <ul className="divide-y divide-black/5 text-sm">
              {(bookings ?? []).map((b) => {
                const be = b.employees as unknown as { first_name: string; last_name: string } | null;
                return (
                  <li key={b.id} className="py-2">
                    <span className="font-medium">{b.title}</span>
                    <span className="block text-xs text-muted">
                      {formatDate(b.starts_at)} · {formatTime(b.starts_at)}–{formatTime(b.ends_at)}
                      {be ? ` · ${be.first_name} ${be.last_name}` : ""}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Card>
      </div>
    </>
  );
}
