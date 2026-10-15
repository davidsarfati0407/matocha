"use server";
/** Actions des opérations : mêmes règles métier et mêmes droits (RLS) que la map. */
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { sectorConfig } from "@/config/sector.config";
import { invoiceFromWorkOrder } from "@/lib/domain/billing";
import { canMove, stageProgress, stageZone } from "@/lib/domain/stages";
import { createClient } from "@/lib/supabase/server";
import { fail, type ActionResult } from "@/lib/backoffice/result";

export async function moveStage(workOrderId: string, to: string): Promise<ActionResult> {
  const t = await getTranslations("ops.actions");
  const supabase = await createClient();
  const { data: wo } = await supabase.from("work_orders").select("stage, progress").eq("id", workOrderId).single();
  if (!wo) return { ok: false, error: t("notFound") };
  if (!canMove(wo.stage, to)) return { ok: false, error: to === "facturee" ? t("invoiceViaInvoice") : t("oneStepAtATime") };
  const zoneKey = stageZone(to);
  const { data: zone } = zoneKey ? await supabase.from("zones").select("id").eq("key", zoneKey).maybeSingle() : { data: null };
  const { data: updated, error } = await supabase
    .from("work_orders")
    .update({ stage: to, zone_id: zone?.id ?? null, progress: Math.max(stageProgress(to), 0), status: to === "livree" ? "en_cours" : "en_cours", blocked_reason: null })
    .eq("id", workOrderId)
    .select("id");
  if (error) return fail(error);
  if (!updated?.length) return { ok: false, error: t("cannotUpdate") };
  revalidatePath("/ops/work-orders");
  return { ok: true, message: t("stageMoved", { stage: sectorConfig.objetMetierCentral.etapes.find((s) => s.id === to)?.libelle ?? to }) };
}

export async function setBlocked(workOrderId: string, reason: string | null): Promise<ActionResult> {
  const t = await getTranslations("ops.actions");
  const supabase = await createClient();
  const { error } = await supabase.from("work_orders").update({ status: reason ? "attente" : "en_cours", blocked_reason: reason }).eq("id", workOrderId);
  if (error) return fail(error);
  revalidatePath(`/ops/work-orders/${workOrderId}`);
  return { ok: true, message: reason ? t("putOnHold") : t("resumed") };
}

export async function toggleChecklist(checklistId: string, index: number): Promise<ActionResult> {
  const t = await getTranslations("ops.actions");
  const supabase = await createClient();
  const { data: c } = await supabase.from("checklists").select("items, work_order_id").eq("id", checklistId).single();
  if (!c) return { ok: false, error: t("checklistNotFound") };
  const items = (c.items as { label: string; done: boolean; done_at?: string | null }[]).map((it, i) => (i === index ? { ...it, done: !it.done, done_at: !it.done ? new Date().toISOString() : null } : it));
  const { error } = await supabase.from("checklists").update({ items }).eq("id", checklistId);
  if (error) return fail(error);
  revalidatePath(`/ops/work-orders/${c.work_order_id}`);
  return { ok: true };
}

const timeSchema = z.object({ work_order_id: z.string().uuid().nullable(), worked_on: z.string(), hours: z.coerce.number().positive().max(24), billable: z.boolean(), note: z.string().max(200).optional(), employee_id: z.string().uuid().optional() });

export async function addTime(input: z.input<typeof timeSchema>): Promise<ActionResult> {
  const t = await getTranslations("ops.actions");
  const p = timeSchema.safeParse(input);
  if (!p.success) return { ok: false, error: t("invalidTime") };
  const supabase = await createClient();
  let employee = p.data.employee_id;
  if (!employee) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: prof } = await supabase.from("profiles").select("employee_id").eq("user_id", user!.id).single();
    employee = prof?.employee_id ?? undefined;
  }
  if (!employee) return { ok: false, error: t("noEmployee") };
  const { error } = await supabase.from("time_entries").insert({ ...p.data, employee_id: employee });
  if (error) return fail(error);
  revalidatePath("/ops/time");
  if (p.data.work_order_id) revalidatePath(`/ops/work-orders/${p.data.work_order_id}`);
  return { ok: true, message: t("timeSaved", { hours: p.data.hours.toString().replace(".", ",") }) };
}

export async function deleteTime(id: string): Promise<ActionResult> {
  const t = await getTranslations("ops.actions");
  const supabase = await createClient();
  const { error } = await supabase.from("time_entries").delete().eq("id", id).is("invoice_id", null);
  if (error) return fail(error);
  revalidatePath("/ops/time");
  return { ok: true, message: t("timeDeleted") };
}

/** Commande livrée → facture brouillon (lignes du devis + heures facturables), sans ressaisie. */
export async function invoiceWorkOrder(workOrderId: string): Promise<ActionResult<{ id: string }>> {
  const tr = await getTranslations("ops.actions");
  const supabase = await createClient();
  const { data: wo } = await supabase.from("work_orders").select("id, client_id, quote_id, title, amount_ht, stage").eq("id", workOrderId).single();
  if (!wo) return { ok: false, error: tr("notFound") };
  if (wo.stage !== "livree") return { ok: false, error: tr("onlyDelivered") };
  const [lines, time, org, quote] = await Promise.all([
    wo.quote_id ? supabase.from("quote_lines").select("label, quantity, unit_price, unit_cost, vat_rate").eq("quote_id", wo.quote_id).order("position") : Promise.resolve({ data: [] }),
    supabase.from("time_entries").select("id, hours, billable, invoice_id").eq("work_order_id", wo.id),
    supabase.from("orgs").select("vat_standard, vat_reduced, settings").single(),
    wo.quote_id ? supabase.from("quotes").select("discount_pct").eq("id", wo.quote_id).single() : Promise.resolve({ data: null }),
  ]);
  const draft = invoiceFromWorkOrder({
    quoteLines: (lines.data ?? []).map((l) => ({ label: l.label, quantity: Number(l.quantity), unitPrice: Number(l.unit_price), unitCost: Number(l.unit_cost), vatRate: Number(l.vat_rate) })),
    amountHt: Number(wo.amount_ht),
    title: wo.title,
    timeEntries: (time.data ?? []).map((t) => ({ id: t.id, hours: Number(t.hours), billable: t.billable, invoiced: Boolean(t.invoice_id) })),
    hourlyRate: Number((org.data?.settings as Record<string, number>)?.hourly_rate ?? 65),
    standardVat: Number(org.data?.vat_standard ?? 0.2),
    reducedVat: Number(org.data?.vat_reduced ?? 0.055),
    discountPct: Number((quote.data as { discount_pct?: number } | null)?.discount_pct ?? 0),
  });
  const { data: id, error } = await supabase.rpc("create_invoice", {
    payload: {
      client_id: wo.client_id,
      work_order_id: wo.id,
      quote_id: wo.quote_id,
      due_days: Number((org.data?.settings as Record<string, number>)?.payment_terms_days ?? 30),
      total_ht: draft.totals.ht,
      total_vat: draft.totals.vat,
      total_ttc: draft.totals.ttc,
      lines: draft.lines.map((l) => ({ label: l.label, quantity: l.quantity, unit_price: l.unitPrice, vat_rate: l.vatRate })),
      time_entry_ids: draft.timeEntryIds,
    },
  });
  if (error) return fail(error);
  revalidatePath("/finance/invoices");
  revalidatePath(`/ops/work-orders/${wo.id}`);
  return { ok: true, message: tr("invoiceDraftCreated"), data: { id: id as string } };
}

const woSchema = z.object({ client_id: z.string().uuid(), title: z.string().min(2), hours_budget: z.coerce.number().min(0), due_at: z.string(), amount_ht: z.coerce.number().min(0), physical_object: z.string().optional() });

export async function createWorkOrder(input: z.input<typeof woSchema>): Promise<ActionResult<{ id: string }>> {
  const t = await getTranslations("ops.actions");
  const p = woSchema.safeParse(input);
  if (!p.success) return { ok: false, error: t("missingFields") };
  const supabase = await createClient();
  const { data: last } = await supabase.from("work_orders").select("number").order("number", { ascending: false }).limit(1).maybeSingle();
  const n = Number(last?.number?.match(/(\d+)$/)?.[1] ?? 600) + 1;
  const { data: site } = await supabase.from("sites").select("id").limit(1).single();
  const { data, error } = await supabase
    .from("work_orders")
    .insert({ ...p.data, site_id: site?.id, number: `CP-24-${String(n).padStart(4, "0")}`, stage: "confirmee", progress: 0.05, received_at: new Date().toISOString(), amount_ttc: Math.round(p.data.amount_ht * (1 + sectorConfig.entreprise.tva.reduit) * 100) / 100 })
    .select("id")
    .single();
  if (error) return fail(error);
  revalidatePath("/ops/work-orders");
  return { ok: true, message: t("workOrderCreated"), data: { id: data.id } };
}

/** Sortie de stock rattachée à la commande, lot le plus ancien d'abord (FEFO). */
export async function consumeStock(workOrderId: string, stockItemId: string, quantity: number): Promise<ActionResult> {
  const t = await getTranslations("ops.actions");
  if (!(quantity > 0)) return { ok: false, error: t("invalidQuantity") };
  const supabase = await createClient();
  const { data: lot } = await supabase.from("lots").select("id, number").eq("stock_item_id", stockItemId).eq("status", "libere").order("best_before").limit(1).maybeSingle();
  const { error } = await supabase.from("stock_movements").insert({ stock_item_id: stockItemId, lot_id: lot?.id ?? null, work_order_id: workOrderId, kind: "sortie", quantity, reason: "Consommation commande pro" });
  if (error) return fail(error);
  revalidatePath(`/ops/work-orders/${workOrderId}`);
  return { ok: true, message: lot ? t("stockOutLot", { lot: lot.number }) : t("stockOut") };
}

export async function markShopOrders(ids: string[], status: "preparation" | "emballee" | "expediee"): Promise<ActionResult> {
  const t = await getTranslations("ops.actions");
  const supabase = await createClient();
  const patch: Record<string, unknown> = { status };
  if (status === "emballee") patch.packed_at = new Date().toISOString();
  if (status === "expediee") patch.shipped_at = new Date().toISOString();
  const { error, count } = await supabase.from("shop_orders").update(patch, { count: "exact" }).in("id", ids);
  if (error) return fail(error);
  revalidatePath("/ops/shop-orders");
  return { ok: true, message: t("shopOrdersUpdated", { count: count ?? ids.length }) };
}

const bookingSchema = z.object({ asset_id: z.string().uuid(), title: z.string().min(1), starts_at: z.string(), ends_at: z.string() });
export async function bookAsset(input: z.input<typeof bookingSchema>): Promise<ActionResult> {
  const t = await getTranslations("ops.actions");
  const p = bookingSchema.safeParse(input);
  if (!p.success || p.data.ends_at <= p.data.starts_at) return { ok: false, error: t("invalidSlot") };
  const supabase = await createClient();
  const { data: clash } = await supabase.from("asset_bookings").select("title, starts_at, ends_at").eq("asset_id", p.data.asset_id).lt("starts_at", p.data.ends_at).gt("ends_at", p.data.starts_at);
  if (clash?.length) return { ok: false, error: t("bookingConflict", { title: clash[0].title }) };
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: prof } = await supabase.from("profiles").select("employee_id").eq("user_id", user!.id).single();
  const { error } = await supabase.from("asset_bookings").insert({ ...p.data, employee_id: prof?.employee_id });
  if (error) return fail(error);
  revalidatePath("/ops/planning");
  return { ok: true, message: t("bookingSaved") };
}
