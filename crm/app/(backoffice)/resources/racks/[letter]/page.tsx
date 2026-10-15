import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Badge, ButtonLink, Card, Denied, PageHeader } from "@/components/ui/kit";
import { sectorConfig } from "@/config/sector.config";
import { requirePerm } from "@/lib/backoffice/context";
import { formatNumber } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("resources.racks");
  return { title: t("title") };
}

/** Vue d'un rayonnage (cible des liens depuis la map). */
export default async function RackPage({ params }: { params: Promise<{ letter: string }> }) {
  const letter = (await params).letter.replace(/^rack:/, "").toUpperCase().slice(0, 1);
  const t = await getTranslations("resources.racks");
  const tAll = await getTranslations();
  const { allowed } = await requirePerm("ressources");
  if (!allowed) return <Denied what={t("deniedWhat")} />;
  const supabase = await createClient();
  const { data } = await supabase.from("stock_items").select("id, reference, name, quantity, min_quantity, location, on_order").like("location", `${letter}-%`).order("location");
  return (
    <>
      <PageHeader kicker={t("title")} title={t("aisle", { letter })} subtitle={t("locations", { count: (data ?? []).length })} actions={<ButtonLink href={`/map/${sectorConfig.lieux[0].id}?focus=stock_rack:rack:${letter}`} icon="map">{tAll("resources.viewOnMap")}</ButtonLink>} />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {(data ?? []).map((s) => {
          const pct = Math.min(100, (Number(s.quantity) / Math.max(1, Number(s.min_quantity) * 2)) * 100);
          const low = Number(s.quantity) < Number(s.min_quantity);
          return (
            <Link key={s.id} href={`/resources/stock/${s.id}`}>
              <Card className="h-full transition hover:-translate-y-0.5">
                <p className="font-mono text-xs text-muted">{s.location}</p>
                <p className="mt-1 font-medium">{s.name}</p>
                <div className="mt-3 h-16 overflow-hidden rounded-lg bg-black/[0.04]">
                  <div className={`mt-auto h-full origin-bottom ${low ? "bg-accent" : "bg-matcha/60"}`} style={{ transform: `scaleY(${pct / 100})` }} />
                </div>
                <p className="mt-2 flex items-center justify-between text-sm">
                  <span className="tabular-nums">{formatNumber(Number(s.quantity))}</span>
                  {s.on_order ? <Badge tone="info">{t("onOrder")}</Badge> : low ? <Badge tone="warn">{t("low")}</Badge> : null}
                </p>
              </Card>
            </Link>
          );
        })}
      </div>
    </>
  );
}
