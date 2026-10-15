"use client";
/** Fil d'activité en temps réel (même flux que la map : activity_events). */
import Link from "next/link";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { subscribeActivity, type ActivityEvent } from "@/lib/map/realtime";
import { formatTime } from "@/lib/format";

/** Libellés dans l'espace « activity » : clé = type d'événement, « . » remplacé par « _ » (ex. badge.in → event.badge_in). */
const eventKey = (type: string) => `event.${type.replace(/\./g, "_")}`;

export function ActivityFeed({ initial, orgId, names }: { initial: ActivityEvent[]; orgId: string; names: Record<string, string> }) {
  const t = useTranslations("activity");
  const supabase = useMemo(() => createClient(), []);
  const [events, setEvents] = useState(initial);
  useEffect(() => subscribeActivity(supabase, orgId, (e) => setEvents((prev) => [e, ...prev].slice(0, 30)), () => {}), [supabase, orgId]);
  return (
    <ul className="max-h-80 space-y-1 overflow-y-auto text-sm">
      {events.map((e) => {
        const p = e.payload as Record<string, string>;
        const who = e.entity === "employees" && e.entity_id ? names[e.entity_id] : null;
        const detail = who ?? p.number ?? p.title ?? (p.orders !== undefined ? t("parcels", { count: Number(p.orders) }) : "");
        const href = e.entity === "work_orders" && e.entity_id ? `/ops/work-orders/${e.entity_id}` : e.entity === "employees" && e.entity_id ? `/hr/employees/${e.entity_id}` : null;
        return (
          <li key={e.id} className="flex items-baseline gap-3 rounded-lg px-1.5 py-1 hover:bg-black/[0.02]">
            <span className="w-10 shrink-0 font-mono text-xs text-muted">{formatTime(e.at)}</span>
            <span className="font-medium">{t.has(eventKey(e.type)) ? t(eventKey(e.type)) : e.type}</span>
            {href ? <Link href={href} className="truncate text-muted hover:text-accent">{detail}</Link> : <span className="truncate text-muted">{detail}</span>}
          </li>
        );
      })}
    </ul>
  );
}
