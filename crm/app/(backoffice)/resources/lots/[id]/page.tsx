import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Badge, ButtonLink, Card, Denied, Dl, PageHeader } from "@/components/ui/kit";
import { sectorConfig } from "@/config/sector.config";
import { requirePerm } from "@/lib/backoffice/context";
import { formatDate, formatNumber } from "@/lib/format";
import { mapHref } from "@/lib/map/links";
import { createClient } from "@/lib/supabase/server";
import { LOT_STATUS } from "@/lib/backoffice/labels";
import { QualityActions, RecallButton } from "./client";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("resources.lot");
  return { title: t("title") };
}

export default async function LotPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const t = await getTranslations("resources.lot");
  const tAll = await getTranslations();
  const tl = await getTranslations("resources.lots");
  const { ctx, allowed } = await requirePerm("ressources");
  if (!allowed) return <Denied what={t("deniedWhat")} />;
  const supabase = await createClient();
  const { data: lot } = await supabase.from("lots").select("*, stock_items(id, reference, name), suppliers(name, country)").eq("id", id).maybeSingle();
  if (!lot) notFound();
  const { data: moves } = await supabase.from("stock_movements").select("id, kind, quantity, reason, at, work_orders(id, number, clients(id, name, email))").eq("lot_id", id).order("at");
  const item = lot.stock_items as unknown as { id: string; reference: string; name: string };
  const sup = lot.suppliers as unknown as { name: string; country: string } | null;
  type WoRef = { id: string; number: string; clients: { id: string; name: string; email: string | null } | null };
  const clients = new Map<string, { name: string; email: string | null; orders: string[]; qty: number }>();
  let outShop = 0;
  for (const m of moves ?? []) {
    if (m.kind !== "sortie") continue;
    const wo = m.work_orders as unknown as WoRef | null;
    if (wo?.clients) {
      const c = clients.get(wo.clients.id) ?? { name: wo.clients.name, email: wo.clients.email, orders: [], qty: 0 };
      c.orders.push(wo.number);
      c.qty += Number(m.quantity);
      clients.set(wo.clients.id, c);
    } else outShop += Number(m.quantity);
  }
  const st = LOT_STATUS[lot.status];
  return (
    <>
      <PageHeader
        kicker={t("kicker", { reference: item.reference })}
        title={<span className="font-mono">{lot.number}</span>}
        subtitle={`${item.name}${sup ? ` · ${sup.name} (${sup.country})` : ""}`}
        actions={
          <>
            <Badge tone={st[0]}>{tAll(st[1] as never)}</Badge>
            <ButtonLink href={mapHref(sectorConfig.lieux[0].id, "lots", id)} icon="map">{tAll("resources.viewOnMap")}</ButtonLink>
            {clients.size > 0 && <RecallButton lot={lot.number} item={item.name} clients={[...clients.values()]} />}
          </>
        }
      />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title={t("qc")}>
          <Dl
            items={[
              [t("receivedAt"), lot.received_at ? formatDate(lot.received_at) : t("notReceived")],
              [t("bestBefore"), lot.best_before ? formatDate(lot.best_before) : "—"],
              [t("quantity"), formatNumber(Number(lot.quantity))],
              [t("coa"), lot.coa_ok == null ? tl("coa.pending") : lot.coa_ok ? tl("coa.ok") : tl("coa.ko")],
              [t("samples"), t("samplesValue", { count: lot.retained_samples })],
              [t("notes"), lot.qc_notes],
            ]}
          />
          {["quarantaine", "attendu"].includes(lot.status) && ctx.can("ressources", "update") && <QualityActions id={id} disabled={lot.status === "attendu"} />}
        </Card>
        <Card title={t("clientsTitle")} className="lg:col-span-2">
          {clients.size === 0 && outShop === 0 ? (
            <p className="text-sm text-muted">{t("noOut")}</p>
          ) : (
            <ul className="divide-y divide-black/5 text-sm">
              {[...clients.entries()].map(([cid, c]) => (
                <li key={cid} className="flex items-center justify-between gap-3 py-2">
                  <Link className="font-medium hover:text-accent" href={`/crm/clients/${cid}`}>
                    {c.name}
                  </Link>
                  <span className="text-muted">
                    {c.orders.join(", ")} · <span className="tabular-nums">{formatNumber(c.qty)}</span>
                  </span>
                </li>
              ))}
              {outShop > 0 && (
                <li className="flex justify-between py-2">
                  <span>{t("shopOrders")}</span>
                  <span className="tabular-nums text-muted">{formatNumber(outShop)}</span>
                </li>
              )}
            </ul>
          )}
        </Card>
        <Card title={t("history")} className="lg:col-span-3">
          <ol className="relative ml-2 border-l border-black/10 text-sm">
            {(moves ?? []).map((m) => (
              <li key={m.id} className="mb-2 ml-4">
                <span className={`absolute -left-[5px] mt-1.5 size-2.5 rounded-full ${m.kind === "entree" ? "bg-brand" : "bg-accent"}`} />
                <span className="text-muted">{formatDate(m.at)}</span> · {m.reason} · <span className="tabular-nums">{m.kind === "sortie" ? "−" : "+"}{formatNumber(Number(m.quantity))}</span>
              </li>
            ))}
            {(moves ?? []).length === 0 && <li className="ml-4 text-muted">{t("noMoves")}</li>}
          </ol>
        </Card>
      </div>
    </>
  );
}
