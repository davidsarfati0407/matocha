import { getTranslations } from "next-intl/server";
import { Badge, Card, Denied, PageHeader } from "@/components/ui/kit";
import { requirePerm } from "@/lib/backoffice/context";
import { createClient } from "@/lib/supabase/server";
import { PermCell } from "./client";

export async function generateMetadata() {
  const t = await getTranslations("settings.roles");
  return { title: t("metaTitle") };
}

const MODULES = ["pilotage", "communication", "commercial", "operations", "rh", "salaires", "finance", "ressources", "ia", "organisation", "plan"];
const ACTIONS = ["read", "create", "update", "delete", "export"];

export default async function RolesPage() {
  const t = await getTranslations("settings.roles");
  const { ctx, allowed } = await requirePerm("organisation");
  const canEdit = ctx.can("organisation", "update");
  if (!allowed) return <Denied what={t("deniedWhat")} />;
  const supabase = await createClient();
  const [roles, perms, profiles] = await Promise.all([supabase.from("roles").select("id, key, label, description, sees_salaries, edits_plan").order("label"), supabase.from("permissions").select("role_id, module, action"), supabase.from("profiles").select("role_id")]);
  const has = new Set((perms.data ?? []).map((p) => `${p.role_id}:${p.module}:${p.action}`));
  const users = new Map<string, number>();
  for (const p of profiles.data ?? []) users.set(p.role_id, (users.get(p.role_id) ?? 0) + 1);
  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <Card padded={false} className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="text-xs text-muted">
            <tr><th className="px-4 py-2 text-left font-medium">{t("role")}</th>{MODULES.map((m) => <th key={m} className="px-1 py-2 font-medium">{m}</th>)}</tr>
          </thead>
          <tbody>
            {(roles.data ?? []).map((r) => (
              <tr key={r.id} className="border-t border-black/5">
                <td className="px-4 py-2">
                  <p className="font-medium">{r.label} <span className="text-xs text-muted">{t("accounts", { count: users.get(r.id) ?? 0 })}</span></p>
                  <p className="text-xs text-muted">{r.description}</p>
                  <p className="mt-1 flex gap-1">{r.sees_salaries && <Badge tone="warn">{t("salaries")}</Badge>}{r.edits_plan && <Badge tone="info">{t("plan")}</Badge>}</p>
                </td>
                {MODULES.map((m) => (
                  <td key={m} className="px-1 text-center font-mono text-[11px]">
                    {ACTIONS.map((a) => (canEdit ? <PermCell key={a} roleId={r.id} role={r.label} module={m} action={a} letter={t(`letter.${a}`)} on={has.has(`${r.id}:${m}:${a}`)} /> : <span key={a} className={has.has(`${r.id}:${m}:${a}`) ? "text-brand" : "text-black/15"}>{t(`letter.${a}`)}</span>))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="mt-3 text-xs text-muted">{t("footer")}</p>
    </>
  );
}
