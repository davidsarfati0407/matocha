import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Module = "pilotage" | "communication" | "commercial" | "operations" | "rh" | "salaires" | "finance" | "ressources" | "ia" | "organisation" | "plan";
export type Action = "read" | "create" | "update" | "delete" | "export";

export interface Ctx {
  userId: string;
  email: string;
  fullName: string;
  employeeId: string | null;
  orgId: string;
  orgName: string;
  settings: Record<string, unknown>;
  demoMode: boolean;
  role: { key: string; label: string; seesSalaries: boolean; editsPlan: boolean };
  perms: Set<string>;
  can: (m: Module, a?: Action) => boolean;
}

/** Contexte de l'utilisateur connecté (mis en cache pour la requête). */
export const getCtx = cache(async (): Promise<Ctx> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: p } = await supabase.from("profiles").select("full_name, employee_id, org_id, role_id, roles(key, label, sees_salaries, edits_plan), orgs(name, settings, demo_mode)").eq("user_id", user.id).single();
  if (!p) redirect("/login");
  const { data: perms } = await supabase.from("permissions").select("module, action").eq("role_id", p.role_id);
  const set = new Set((perms ?? []).map((x) => `${x.module}:${x.action}`));
  const role = p.roles as unknown as { key: string; label: string; sees_salaries: boolean; edits_plan: boolean };
  const org = p.orgs as unknown as { name: string; settings: Record<string, unknown>; demo_mode: boolean };
  return {
    userId: user.id,
    email: user.email ?? "",
    fullName: p.full_name,
    employeeId: p.employee_id,
    orgId: p.org_id,
    orgName: org.name,
    settings: org.settings ?? {},
    demoMode: org.demo_mode,
    role: { key: role.key, label: role.label, seesSalaries: role.sees_salaries, editsPlan: role.edits_plan },
    perms: set,
    can: (m, a = "read") => set.has(`${m}:${a}`),
  };
});

/** Garde de page : l'utilisateur doit avoir le droit demandé (sinon page « accès refusé »). */
export async function requirePerm(m: Module, a: Action = "read") {
  const ctx = await getCtx();
  return { ctx, allowed: ctx.can(m, a) };
}
