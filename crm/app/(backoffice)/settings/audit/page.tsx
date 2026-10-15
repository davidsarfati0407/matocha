import type { Metadata } from "next";
import { Badge, Card, Denied, Empty, PageHeader } from "@/components/ui/kit";
import { requirePerm } from "@/lib/backoffice/context";
import { formatDate, formatTime } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Journal d'audit" };

const TABLE: Record<string, string> = { employees: "Collaborateur", employee_salaries: "Salaire", roles: "Rôle", permissions: "Droit", profiles: "Profil", quotes: "Devis", work_orders: "Commande pro", invoices: "Facture", payments: "Paiement", leave_requests: "Congé", lots: "Lot", expenses: "Note de frais", floor_plans: "Plan 3D" };

/** Avant/après des tables sensibles, écrit par trigger Postgres (non falsifiable depuis l'interface). */
export default async function AuditPage() {
  const { allowed } = await requirePerm("organisation");
  if (!allowed) return <Denied what="le journal d'audit" />;
  const supabase = await createClient();
  const [{ data }, profiles] = await Promise.all([supabase.from("audit_log").select("id, table_name, row_id, action, before, after, actor, at").order("at", { ascending: false }).limit(200), supabase.from("profiles").select("user_id, full_name")]);
  const who = new Map((profiles.data ?? []).map((p) => [p.user_id, p.full_name]));
  const diff = (b: Record<string, unknown> | null, a: Record<string, unknown> | null) => {
    if (!b || !a) return "";
    return Object.keys(a).filter((k) => !["updated_at", "created_at"].includes(k) && JSON.stringify(a[k]) !== JSON.stringify(b[k])).slice(0, 4).map((k) => `${k} : ${JSON.stringify(b[k])} → ${JSON.stringify(a[k])}`).join(" · ");
  };
  return (
    <>
      <PageHeader title="Journal d'audit" subtitle="Qui a changé quoi, quand — y compris chaque consultation de salaire" />
      {(data ?? []).length === 0 ? <Empty icon="shield" title="Aucune modification depuis la dernière réinitialisation" hint="Le seed n'est pas journalisé ; toute action dans l'application le sera." /> : (
        <Card padded={false}>
          <ul className="divide-y divide-black/5 text-sm">
            {(data ?? []).map((l) => (
              <li key={l.id} className="px-5 py-2.5">
                <p className="flex flex-wrap items-center gap-2">
                  <span className="text-xs text-muted">{formatDate(l.at)} {formatTime(l.at)}</span>
                  <b>{who.get(l.actor ?? "") ?? "système"}</b>
                  <Badge tone={l.action === "reveal" ? "warn" : l.action === "DELETE" ? "danger" : "info"}>{l.action === "reveal" ? "consultation" : l.action.toLowerCase()}</Badge>
                  <span>{TABLE[l.table_name] ?? l.table_name}</span>
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
