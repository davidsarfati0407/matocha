import type { Metadata } from "next";
import { Badge, Card, Denied, PageHeader } from "@/components/ui/kit";
import { requirePerm } from "@/lib/backoffice/context";
import { createClient } from "@/lib/supabase/server";
import { PermCell } from "./client";

export const metadata: Metadata = { title: "Rôles et droits" };

const MODULES = ["pilotage", "communication", "commercial", "operations", "rh", "salaires", "finance", "ressources", "ia", "organisation", "plan"];
const ACTIONS: [string, string][] = [["read", "L"], ["create", "C"], ["update", "M"], ["delete", "S"], ["export", "E"]];

export default async function RolesPage() {
  const { ctx, allowed } = await requirePerm("organisation");
  const canEdit = ctx.can("organisation", "update");
  if (!allowed) return <Denied what="les rôles" />;
  const supabase = await createClient();
  const [roles, perms, profiles] = await Promise.all([supabase.from("roles").select("id, key, label, description, sees_salaries, edits_plan").order("label"), supabase.from("permissions").select("role_id, module, action"), supabase.from("profiles").select("role_id")]);
  const has = new Set((perms.data ?? []).map((p) => `${p.role_id}:${p.module}:${p.action}`));
  const users = new Map<string, number>();
  for (const p of profiles.data ?? []) users.set(p.role_id, (users.get(p.role_id) ?? 0) + 1);
  return (
    <>
      <PageHeader title="Rôles et droits" subtitle="Matrice appliquée par Postgres (RLS). Cliquez une lettre pour accorder ou retirer le droit (effet immédiat, journalisé). L = lire, C = créer, M = modifier, S = supprimer, E = exporter." />
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
                    {ACTIONS.map(([a, l]) => (canEdit ? <PermCell key={a} roleId={r.id} role={r.label} module={m} action={a} letter={l} on={has.has(`${r.id}:${m}:${a}`)} /> : <span key={a} className={has.has(`${r.id}:${m}:${a}`) ? "text-brand" : "text-black/15"}>{l}</span>))}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <p className="mt-3 text-xs text-muted">Garde-fous en base : seuls la RH et la direction distribuent l'accès aux salaires ; personne ne peut retirer à son propre rôle l'administration des droits. Chaque changement est inscrit au journal d'audit. La fiche secteur reste la source du seed.</p>
    </>
  );
}
