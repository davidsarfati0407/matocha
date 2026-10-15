import type { Metadata } from "next";
import { Badge, Card, Denied, PageHeader } from "@/components/ui/kit";
import { requirePerm } from "@/lib/backoffice/context";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Rôles et droits" };

const MODULES = ["pilotage", "communication", "commercial", "operations", "rh", "salaires", "finance", "ressources", "ia", "organisation", "plan"];
const ACTIONS: [string, string][] = [["read", "L"], ["create", "C"], ["update", "M"], ["delete", "S"], ["export", "E"]];

export default async function RolesPage() {
  const { allowed } = await requirePerm("organisation");
  if (!allowed) return <Denied what="les rôles" />;
  const supabase = await createClient();
  const [roles, perms, profiles] = await Promise.all([supabase.from("roles").select("id, key, label, description, sees_salaries, edits_plan").order("label"), supabase.from("permissions").select("role_id, module, action"), supabase.from("profiles").select("role_id")]);
  const has = new Set((perms.data ?? []).map((p) => `${p.role_id}:${p.module}:${p.action}`));
  const users = new Map<string, number>();
  for (const p of profiles.data ?? []) users.set(p.role_id, (users.get(p.role_id) ?? 0) + 1);
  return (
    <>
      <PageHeader title="Rôles et droits" subtitle="Matrice appliquée par Postgres (RLS) : l'interface ne fait que refléter ces droits. L = lire, C = créer, M = modifier, S = supprimer, E = exporter." />
      <Card padded={false} className="overflow-x-auto">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="text-xs text-muted">
            <tr><th className="px-4 py-2 text-left font-medium">Rôle</th>{MODULES.map((m) => <th key={m} className="px-1 py-2 font-medium">{m}</th>)}</tr>
          </thead>
          <tbody>
            {(roles.data ?? []).map((r) => (
              <tr key={r.id} className="border-t border-black/5">
                <td className="px-4 py-2">
                  <p className="font-medium">{r.label} <span className="text-xs text-muted">· {users.get(r.id) ?? 0} compte(s)</span></p>
                  <p className="text-xs text-muted">{r.description}</p>
                  <p className="mt-1 flex gap-1">{r.sees_salaries && <Badge tone="warn">salaires</Badge>}{r.edits_plan && <Badge tone="info">plan 3D</Badge>}</p>
                </td>
                {MODULES.map((m) => (
                  <td key={m} className="px-1 text-center font-mono text-[11px]">
                    {ACTIONS.map(([a, l]) => <span key={a} className={has.has(`${r.id}:${m}:${a}`) ? "text-brand" : "text-black/15"}>{l}</span>)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="mt-3 text-xs text-muted">Les droits sont définis dans la fiche secteur puis appliqués au seed. L'édition depuis l'interface arrive en phase 4.</p>
    </>
  );
}
