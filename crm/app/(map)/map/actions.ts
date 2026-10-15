"use server";
/**
 * Actions serveur de la map. Toutes passent par le client Supabase de
 * l'utilisateur : mêmes règles métier et mêmes droits (RLS) que le back-office.
 */
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createEvent } from "@/app/(backoffice)/crm/actions";
import { fail, type ActionResult } from "@/lib/backoffice/result";

const stepSchema = z.enum(["badge", "work_order_stage", "lot_received", "quote_accepted", "pickup", "ambient"]);

export async function demoStep(step: string, params: Record<string, string> = {}) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("demo_step", { step: stepSchema.parse(step), params });
  if (error) return { error: error.message };
  return { data };
}

export async function demoReset(params: Record<string, string>) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("demo_reset", { params });
  return error ? { error: error.message } : { ok: true };
}

/** Badge réel depuis la map (rôle autorisé par la RLS : soi-même ou RH). */
export async function badge(employeeId: string, kind: "in" | "out" | "pause_start" | "pause_end") {
  const supabase = await createClient();
  const { error } = await supabase.from("badge_events").insert({ employee_id: employeeId, kind, source: "map" });
  return error ? { error: error.message } : { ok: true };
}

export async function employeeSheet(employeeId: string) {
  const supabase = await createClient();
  const now = new Date();
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday.getTime() + 7 * 86400_000);
  const [cal, badges, time, docs, emp] = await Promise.all([
    supabase.from("calendar_events").select("id, type, title, starts_at, ends_at, owner_id, attendees").or(`owner_id.eq.${employeeId},attendees.cs.{${employeeId}}`).gte("starts_at", monday.toISOString()).lt("starts_at", sunday.toISOString()).order("starts_at"),
    supabase.from("badge_events").select("kind, at").eq("employee_id", employeeId).gte("at", monday.toISOString()).order("at"),
    supabase.from("time_entries").select("hours, worked_on, work_orders(number, title)").eq("employee_id", employeeId).order("worked_on", { ascending: false }).limit(10),
    supabase.from("documents").select("name, kind").eq("entity_type", "employees").eq("entity_id", employeeId),
    supabase.from("employees").select("manager:manager_id(first_name, last_name)").eq("id", employeeId).single(),
  ]);
  return {
    calendar: cal.data ?? [],
    badges: badges.data ?? [],
    time: (time.data ?? []).map((t) => ({ hours: Number(t.hours), workedOn: t.worked_on, wo: t.work_orders as unknown as { number: string; title: string } | null })),
    documents: docs.data ?? [],
    manager: (emp.data?.manager as unknown as { first_name: string; last_name: string } | null) ?? null,
    weekStart: monday.toISOString(),
  };
}

export async function workOrderSheet(workOrderId: string) {
  const supabase = await createClient();
  const { data: wo } = await supabase.from("work_orders").select("id, quote_id, client_id, clients(name, email, phone, city, segment, satisfaction, internal_note, preferred_channel)").eq("id", workOrderId).single();
  const [lines, invoices, docs, threads, tasks] = await Promise.all([
    wo?.quote_id ? supabase.from("quote_lines").select("label, quantity, unit_price, unit_cost, vat_rate").eq("quote_id", wo.quote_id).order("position") : Promise.resolve({ data: [] }),
    supabase.from("invoices").select("number, status, total_ttc, due_on").eq("work_order_id", workOrderId),
    supabase.from("documents").select("name, kind").eq("entity_id", workOrderId),
    supabase.from("threads").select("subject, status, last_message_at").eq("work_order_id", workOrderId),
    supabase.from("tasks").select("title, status, progress").eq("work_order_id", workOrderId).order("position"),
  ]);
  return {
    client: wo?.clients as unknown as Record<string, unknown> | null,
    lines: (lines.data ?? []).map((l) => ({ label: l.label, quantity: Number(l.quantity), unitPrice: Number(l.unit_price), unitCost: Number(l.unit_cost), vatRate: Number(l.vat_rate) })),
    invoices: invoices.data ?? [],
    documents: docs.data ?? [],
    threads: threads.data ?? [],
    tasks: tasks.data ?? [],
  };
}

const vec2 = z.tuple([z.number(), z.number()]);
const layoutSchema = z.object({
  version: z.literal(1),
  units: z.literal("m"),
  objects: z.array(z.object({ id: z.string(), kit: z.string(), at: vec2, rotation: z.number() }).passthrough()),
}).passthrough();

/**
 * Sauvegarde versionnée du plan : chaque enregistrement crée une nouvelle
 * version (brouillon). Publier archive l'ancienne version publiée et
 * resynchronise map_objects. Droits : RLS du module « plan ».
 */
export async function savePlan(siteId: string, layout: unknown, publish: boolean) {
  const supabase = await createClient();
  const parsed = layoutSchema.safeParse(layout);
  if (!parsed.success) return { error: (await getTranslations("map"))("actions.invalidPlan") };
  const { data: last } = await supabase.from("floor_plans").select("version").eq("site_id", siteId).order("version", { ascending: false }).limit(1).maybeSingle();
  const version = (last?.version ?? 0) + 1;
  const { data: plan, error } = await supabase
    .from("floor_plans")
    .insert({ site_id: siteId, version, status: publish ? "published" : "draft", layout: parsed.data, published_at: publish ? new Date().toISOString() : null })
    .select("id, version")
    .single();
  if (error) return { error: error.code === "42501" ? (await getTranslations("map"))("actions.planForbidden") : error.message };
  if (publish) {
    await supabase.from("floor_plans").update({ status: "archived" }).eq("site_id", siteId).eq("status", "published").neq("id", plan.id);
    await supabase.from("map_objects").delete().eq("site_id", siteId);
    const { data: zones } = await supabase.from("zones").select("id, key").eq("site_id", siteId);
    const zoneId = new Map((zones ?? []).map((z) => [z.key, z.id]));
    const rows = parsed.data.objects
      .filter((o) => (o as { entity?: unknown }).entity)
      .map((o) => {
        const ent = (o as unknown as { entity: { type: string; id: string; key?: string } }).entity;
        const p = o as unknown as { zone?: string; label?: string; y?: number; params?: Record<string, unknown> };
        return {
          site_id: siteId,
          zone_id: p.zone ? zoneId.get(p.zone) ?? null : null,
          type: o.kit,
          kit: o.kit,
          label: p.label ?? null,
          position: [o.at[0], p.y ?? 0, o.at[1]],
          rotation: o.rotation,
          params: { ...(p.params ?? {}), layout_id: o.id, entity_key: ent.key },
          entity_type: ent.type,
          entity_id: ent.type === "assets" ? ent.id : null,
        };
      });
    if (rows.length) await supabase.from("map_objects").insert(rows);
  }
  return { version: plan.version, id: plan.id, published: publish };
}

// ------------------------------------------------------------- écritures depuis la map
// Mêmes fonctions et mêmes droits que le back-office (RLS) : la map n'a pas de règles à part.

/** Marquer une salle occupée maintenant (crée la réservation ; conflits refusés). */
export async function occupyRoom(assetId: string, minutes: number, title?: string): Promise<ActionResult> {
  // Pas d'arrondi à la minute : une salle qu'on vient de libérer (fin = maintenant) doit pouvoir être reprise aussitôt
  const start = new Date();
  const end = new Date(start.getTime() + Math.min(240, Math.max(15, minutes)) * 60_000);
  return createEvent({ title: title?.trim() || "Salle occupée (depuis la map)", type: "reunion", starts_at: start.toISOString(), ends_at: end.toISOString(), resource_id: assetId });
}

/** Libérer une salle : met fin maintenant à la réservation en cours (la sienne, ou RH). */
export async function releaseRoom(eventId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error, count } = await supabase.from("calendar_events").update({ ends_at: new Date().toISOString() }, { count: "exact" }).eq("id", eventId).gt("ends_at", new Date().toISOString());
  if (error) return fail(error);
  const t = await getTranslations("map");
  if (!count) return { ok: false, error: t("actions.releaseForbidden") };
  return { ok: true, message: t("actions.roomReleased") };
}

/** Affecter un véhicule / équipement à un collaborateur (glisser-déposer sur la map). */
export async function assignAsset(assetId: string, employeeId: string | null): Promise<ActionResult> {
  const supabase = await createClient();
  const { error, count } = await supabase.from("assets").update({ assigned_employee_id: employeeId }, { count: "exact" }).eq("id", assetId);
  if (error) return fail(error);
  const t = await getTranslations("map");
  if (!count) return { ok: false, error: t("actions.assignForbidden") };
  return { ok: true, message: t(employeeId ? "actions.assignmentSaved" : "actions.assignmentRemoved") };
}
