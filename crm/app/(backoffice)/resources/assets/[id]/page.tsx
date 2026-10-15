import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Badge, ButtonLink, Card, Denied, Dl, PageHeader, Progress } from "@/components/ui/kit";
import { sectorConfig } from "@/config/sector.config";
import { requirePerm } from "@/lib/backoffice/context";
import { formatDate, formatMoney, formatTime } from "@/lib/format";
import { mapHref } from "@/lib/map/links";
import { createClient } from "@/lib/supabase/server";
import { ASSET_STATUS, ASSET_TYPE } from "@/lib/backoffice/labels";
import { AssetActions } from "./client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("resources.asset");
  return { title: t("title") };
}

/** Clés de télémétrie ayant un libellé traduit (valeurs 0–1 affichées en jauge). */
const TELE = new Set(["batterie", "km", "rouleau", "temperature_c", "humidite", "cpu", "ram", "eau_l", "boites", "cycles_jour", "colis_jour", "pages_jour", "boissons_jour", "etiquettes_jour", "en_charge", "app", "session", "maj_en_attente", "cout_page", "bacs", "toner"]);

export default async function AssetPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations("resources.asset");
  const tAll = await getTranslations();
  const { ctx, allowed } = await requirePerm("ressources");
  if (!allowed) return <Denied what={t("deniedWhat")} />;
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
        kicker={ASSET_TYPE[a.type] ? tAll(ASSET_TYPE[a.type] as never) : a.type}
        title={a.name}
        subtitle={(a.zones as unknown as { name: string } | null)?.name}
        actions={
          <>
            <Badge tone={st[0]}>{tAll(st[1] as never)}</Badge>
            <ButtonLink href={mapHref(sectorConfig.lieux[0].id, a.type === "vehicule" ? "vehicles" : "assets", id)} icon="map">{tAll("resources.viewOnMap")}</ButtonLink>
          </>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title={t("card")}>
          <Dl items={[[t("assignedTo"), emp ? `${emp.first_name} ${emp.last_name}` : null], [t("nextMaintenance"), a.next_maintenance_on ? formatDate(a.next_maintenance_on) : null], [t("purchaseCost"), a.purchase_cost ? formatMoney(Number(a.purchase_cost), "fr", 0) : null], ...Object.entries((a.specs ?? {}) as Record<string, unknown>).map(([k, v]) => [k, String(v)] as [string, string])]} />
          {ctx.can("ressources", "update") && <AssetActions id={id} status={a.status} next={a.next_maintenance_on} />}
        </Card>
        <Card title={t("live")} action={<span className="text-xs text-muted">{t("simulated")}</span>}>
          {tele.length === 0 ? (
            <p className="text-sm text-muted">{t("noSensor")}</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {tele.map(([k, v]) => (
                <li key={k}>
                  <div className="flex justify-between">
                    <span className="text-muted">{TELE.has(k) ? t(`tele.${k}`) : k}</span>
                    <span className="font-medium tabular-nums">{typeof v === "number" && v <= 1 && !k.endsWith("_jour") && k !== "cout_page" ? `${Math.round(v * 100)} %` : typeof v === "boolean" ? (v ? tAll("common.yes") : tAll("common.no")) : typeof v === "object" ? "" : String(v)}</span>
                  </div>
                  {typeof v === "number" && v <= 1 && !k.endsWith("_jour") && k !== "cout_page" && <Progress value={v} tone={v < 0.2 ? "danger" : "brand"} className="mt-1" />}
                  {typeof v === "object" && v && !Array.isArray(v) && (
                    <div className="mt-1 grid grid-cols-2 gap-x-4 gap-y-2">
                      {Object.entries(v as Record<string, number>).map(([kk, vv]) => (
                        <div key={kk} className="text-xs">
                          <p className="mb-1 flex justify-between"><span>{kk}</span><span className="tabular-nums">{Math.round(vv * 100)} %</span></p>
                          <Progress value={vv} tone={vv < 0.2 ? "danger" : "brand"} />
                        </div>
                      ))}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title={t("upcoming")} action={<a className="text-xs font-medium text-accent" href={`/ops/planning?kind=${a.type === "salle" ? "salle" : a.type === "vehicule" ? "vehicule" : "equipement"}`}>{t("planningLink")}</a>}>
          {(bookings ?? []).length === 0 ? (
            <p className="text-sm text-muted">{t("noBookings")}</p>
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
