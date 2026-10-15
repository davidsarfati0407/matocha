import { getTranslations } from "next-intl/server";
import { Badge, Card, Denied, Empty, PageHeader } from "@/components/ui/kit";
import { requirePerm } from "@/lib/backoffice/context";
import { formatDate, formatTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata() {
  const t = await getTranslations("settings.audit");
  return { title: t("metaTitle") };
}

/** Avant/après des tables sensibles, écrit par trigger Postgres (non falsifiable depuis l'interface). */
export default async function AuditPage() {
  const t = await getTranslations("settings.audit");
  const { allowed } = await requirePerm("organisation");
  if (!allowed) return <Denied what={t("deniedWhat")} />;
  const supabase = await createClient();
  const [{ data }, profiles] = await Promise.all([supabase.from("audit_log").select("id, table_name, row_id, action, before, after, actor, at").order("at", { ascending: false }).limit(200), supabase.from("profiles").select("user_id, full_name")]);
  const who = new Map((profiles.data ?? []).map((p) => [p.user_id, p.full_name]));
  const diff = (b: Record<string, unknown> | null, a: Record<string, unknown> | null) => {
    if (!b || !a) return "";
    return Object.keys(a).filter((k) => !["updated_at", "created_at"].includes(k) && JSON.stringify(a[k]) !== JSON.stringify(b[k])).slice(0, 4).map((k) => `${k} : ${JSON.stringify(b[k])} → ${JSON.stringify(a[k])}`).join(" · ");
  };
  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      {(data ?? []).length === 0 ? <Empty icon="shield" title={t("empty")} hint={t("emptyHint")} /> : (
        <Card padded={false}>
          <ul className="divide-y divide-black/5 text-sm">
            {(data ?? []).map((l) => (
              <li key={l.id} className="px-5 py-2.5">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted">{formatDate(l.at)} {formatTime(l.at)}</span>
                  <b>{who.get(l.actor ?? "") ?? t("system")}</b>
                  <Badge tone={l.action === "reveal" ? "warn" : l.action === "DELETE" ? "danger" : "info"}>{t.has(`action.${l.action}`) ? t(`action.${l.action}`) : l.action.toLowerCase()}</Badge>
                  <span>{t.has(`table.${l.table_name}`) ? t(`table.${l.table_name}`) : l.table_name}</span>
                </p>
                <p className="truncate font-mono text-[11px] text-muted">{diff(l.before as Record<string, unknown> | null, l.after as Record<string, unknown> | null)}</p>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </>
  );
}
