"use server";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { getCtx } from "@/lib/backoffice/context";
import { fail, type ActionResult } from "@/lib/backoffice/result";
import { createClient } from "@/lib/supabase/server";

const settingsSchema = z.object({
  hourly_rate: z.number().min(0).max(1000),
  payment_terms_days: z.number().int().min(0).max(120),
  dunning_days: z.array(z.number().int().min(0).max(120)).length(3),
  min_presence: z.number().min(0).max(1),
  daily_revenue_target: z.number().min(0),
  cash_opening: z.number(),
  employer_charges: z.number().min(0).max(1),
});

/** Paramètres de l'organisation : fusionnés dans orgs.settings (droit organisation:update via RLS). */
export async function saveSettings(input: z.input<typeof settingsSchema>): Promise<ActionResult> {
  const t = await getTranslations("settings.actions");
  const p = settingsSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  if (!(p.data.dunning_days[0] < p.data.dunning_days[1] && p.data.dunning_days[1] < p.data.dunning_days[2])) return { ok: false, error: t("dunningOrder") };
  const supabase = await createClient();
  const { data: org } = await supabase.from("orgs").select("id, settings").single();
  if (!org) return { ok: false, error: t("orgNotFound") };
  const { error, count } = await supabase.from("orgs").update({ settings: { ...(org.settings as object), ...p.data } }, { count: "exact" }).eq("id", org.id);
  if (error) return fail(error);
  if (!count) return { ok: false, error: t("forbidden") };
  revalidatePath("/", "layout");
  return { ok: true, message: t("saved") };
}

export async function toggleAutomation(id: string, enabled: boolean): Promise<ActionResult> {
  const t = await getTranslations("settings.actions");
  const supabase = await createClient();
  const { error, count } = await supabase.from("automations").update({ enabled }, { count: "exact" }).eq("id", id);
  if (error) return fail(error);
  if (!count) return { ok: false, error: t("forbidden") };
  revalidatePath("/settings/automations");
  return { ok: true, message: enabled ? t("automationOn") : t("automationOff") };
}

export async function runAutomationsNow(): Promise<ActionResult<{ name: string; count: number | null; href: string | null; mode: string }[]>> {
  const t = await getTranslations("settings.actions");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("run_automations");
  if (error) return fail(error);
  const rows = data as { name: string; count: number | null; href: string | null; mode: string }[];
  revalidatePath("/settings/automations");
  return { ok: true, message: t("automationsRun", { count: rows.filter((r) => (r.count ?? 0) > 0).length }), data: rows };
}

export async function resetDemo(): Promise<ActionResult> {
  const t = await getTranslations("settings.actions");
  const supabase = await createClient();
  const { error } = await supabase.rpc("demo_reset", { params: {} });
  if (error) return fail(error);
  revalidatePath("/", "layout");
  return { ok: true, message: t("demoReset") };
}

const MODS = ["pilotage", "communication", "commercial", "operations", "rh", "salaires", "finance", "ressources", "ia", "organisation", "plan"];
const ACTS = ["read", "create", "update", "delete", "export"];
/** Accorder / retirer un droit (RLS organisation:update + garde-fous SQL contre l'escalade). */
export async function togglePermission(roleId: string, module: string, action: string, on: boolean): Promise<ActionResult> {
  const t = await getTranslations("settings.actions");
  if (!MODS.includes(module) || !ACTS.includes(action)) return { ok: false, error: t("unknownPermission") };
  const supabase = await createClient();
  const { error, count } = on
    ? await supabase.from("permissions").insert({ org_id: (await getCtx()).orgId, role_id: roleId, module, action }, { count: "exact" })
    : await supabase.from("permissions").delete({ count: "exact" }).eq("role_id", roleId).eq("module", module).eq("action", action);
  if (error) return error.code === "42501" ? { ok: false, error: error.message.replace(/^.*?: /, "") } : fail(error);
  if (!count) return { ok: false, error: t("forbidden") };
  revalidatePath("/", "layout");
  return { ok: true, message: t(on ? "permissionGranted" : "permissionRevoked", { action, module }) };
}
