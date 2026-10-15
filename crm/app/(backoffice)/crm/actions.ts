"use server";
/** Actions commerciales : comptes, pipeline, devis. Totaux calculés par le domaine, écritures atomiques en SQL. */
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCtx } from "@/lib/backoffice/context";
import { fail, type ActionResult } from "@/lib/backoffice/result";
import { computeTotals } from "@/lib/domain/money";
import { createClient } from "@/lib/supabase/server";

const lineSchema = z.object({ catalog_item_id: z.string().uuid().nullable().optional(), label: z.string().min(1), quantity: z.number().positive(), unit_price: z.number().min(0), unit_cost: z.number().min(0).default(0), vat_rate: z.number().min(0).max(1) });
const quoteSchema = z.object({ id: z.string().uuid().optional(), client_id: z.string().uuid(), deal_id: z.string().uuid().nullable().optional(), discount_pct: z.number().min(0).max(0.5).default(0), notes: z.string().nullable().optional(), lines: z.array(lineSchema).min(1, "Ajoutez au moins une ligne") });

export async function saveQuote(input: z.input<typeof quoteSchema>): Promise<ActionResult<{ id: string }>> {
  const p = quoteSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const t = computeTotals(p.data.lines.map((l) => ({ quantity: l.quantity, unitPrice: l.unit_price, unitCost: l.unit_cost, vatRate: l.vat_rate })), { discountPct: p.data.discount_pct });
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("save_quote", { payload: { ...p.data, total_ht: t.ht, total_vat: t.vat, total_ttc: t.ttc } });
  if (error) return fail(error);
  revalidatePath("/crm/quotes");
  return { ok: true, message: "Devis enregistré", data: { id: data as string } };
}

export async function sendQuote(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: q, error } = await supabase.from("quotes").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", id).in("status", ["draft", "sent", "opened"]).select("client_id").single();
  if (error) return fail(error);
  await supabase.from("clients").update({ last_contact_at: new Date().toISOString() }).eq("id", q.client_id);
  revalidatePath(`/crm/quotes/${id}`);
  return { ok: true, message: "Devis envoyé avec son PDF (envoi e-mail simulé)" };
}

export async function acceptQuote(id: string): Promise<ActionResult<{ workOrderId: string }>> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("accept_quote", { q_id: id });
  if (error) return fail(error);
  if (!data) return { ok: false, error: "Ce devis n'est plus acceptable." };
  revalidatePath("/crm", "layout");
  revalidatePath("/ops/work-orders");
  return { ok: true, message: "Devis accepté : commande pro créée automatiquement", data: { workOrderId: data as string } };
}

export async function setQuoteStatus(id: string, status: "rejected" | "draft"): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("quotes").update({ status }).eq("id", id);
  if (error) return fail(error);
  revalidatePath(`/crm/quotes/${id}`);
  return { ok: true, message: status === "rejected" ? "Devis marqué refusé" : "Devis repassé en brouillon" };
}

export async function duplicateQuote(id: string): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const [{ data: q }, { data: lines }] = await Promise.all([supabase.from("quotes").select("client_id, deal_id, discount_pct, notes").eq("id", id).single(), supabase.from("quote_lines").select("catalog_item_id, label, quantity, unit_price, unit_cost, vat_rate").eq("quote_id", id).order("position")]);
  if (!q) return { ok: false, error: "Devis introuvable" };
  return saveQuote({ client_id: q.client_id, deal_id: q.deal_id, discount_pct: Number(q.discount_pct), notes: q.notes, lines: (lines ?? []).map((l) => ({ ...l, quantity: Number(l.quantity), unit_price: Number(l.unit_price), unit_cost: Number(l.unit_cost), vat_rate: Number(l.vat_rate) })) });
}

const PROBA: Record<string, number> = { froid: 0.1, tiede: 0.35, chaud: 0.7, gagne: 1, perdu: 0 };
export async function moveDeal(id: string, stage: string): Promise<ActionResult<{ previous: string }>> {
  if (!(stage in PROBA)) return { ok: false, error: "Étape inconnue" };
  const supabase = await createClient();
  const { data: prev } = await supabase.from("deals").select("stage").eq("id", id).single();
  const { error } = await supabase.from("deals").update({ stage, probability: PROBA[stage] }).eq("id", id);
  if (error) return fail(error);
  revalidatePath("/crm/pipeline");
  return { ok: true, message: "Opportunité déplacée", data: { previous: prev?.stage ?? "froid" } };
}

const dealSchema = z.object({ client_id: z.string().uuid(), title: z.string().min(2), value: z.number().min(0), expected_close_on: z.string().optional(), source: z.string().optional() });
export async function createDeal(input: z.input<typeof dealSchema>): Promise<ActionResult> {
  const p = dealSchema.safeParse(input);
  if (!p.success) return { ok: false, error: "Formulaire incomplet" };
  const supabase = await createClient();
  const { employeeId } = await getCtx();
  const { error } = await supabase.from("deals").insert({ ...p.data, expected_close_on: p.data.expected_close_on || null, stage: "froid", probability: PROBA.froid, owner_id: employeeId });
  if (error) return fail(error);
  revalidatePath("/crm/pipeline");
  return { ok: true, message: "Opportunité créée" };
}

const clientSchema = z.object({ kind: z.enum(["entreprise", "particulier"]), name: z.string().min(2), segment: z.string().optional(), email: z.string().email().optional().or(z.literal("")), phone: z.string().optional(), city: z.string().optional() });
export async function createClientAccount(input: z.input<typeof clientSchema>): Promise<ActionResult<{ id: string }>> {
  const p = clientSchema.safeParse(input);
  if (!p.success) return { ok: false, error: p.error.issues[0].message };
  const supabase = await createClient();
  const { data, error } = await supabase.from("clients").insert({ ...p.data, email: p.data.email || null }).select("id").single();
  if (error) return fail(error);
  revalidatePath("/crm/clients");
  return { ok: true, message: "Compte créé", data: { id: data.id } };
}

export async function logInteraction(clientId: string, channel: "email" | "interne", subject: string, body: string): Promise<ActionResult> {
  if (!subject.trim() || !body.trim()) return { ok: false, error: "Objet et contenu requis" };
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data: t, error } = await supabase.from("threads").insert({ channel, subject, client_id: clientId, status: channel === "email" ? "awaiting_reply" : "closed", last_message_at: now }).select("id").single();
  if (error) return fail(error);
  const { fullName } = await getCtx();
  const { error: e2 } = await supabase.from("messages").insert({ thread_id: t.id, direction: "out", from_name: fullName, body, sent_at: now });
  if (e2) return fail(e2);
  await supabase.from("clients").update({ last_contact_at: now }).eq("id", clientId);
  revalidatePath(`/crm/clients/${clientId}`);
  return { ok: true, message: channel === "email" ? "E-mail enregistré (envoi simulé)" : "Note ajoutée à l'historique" };
}

const eventSchema = z.object({ title: z.string().min(1), type: z.enum(["reunion", "client", "focus", "deplacement", "tournage", "livraison", "autre"]), starts_at: z.string(), ends_at: z.string(), client_id: z.string().uuid().nullable().optional(), resource_id: z.string().uuid().nullable().optional() });
export async function createEvent(input: z.input<typeof eventSchema>): Promise<ActionResult> {
  const p = eventSchema.safeParse(input);
  if (!p.success || p.data.ends_at <= p.data.starts_at) return { ok: false, error: "Créneau invalide" };
  const supabase = await createClient();
  const { employeeId } = await getCtx();
  if (p.data.resource_id) {
    const { data: clash } = await supabase.from("calendar_events").select("title").eq("resource_id", p.data.resource_id).lt("starts_at", p.data.ends_at).gt("ends_at", p.data.starts_at).limit(1);
    if (clash?.length) return { ok: false, error: `Salle déjà prise : « ${clash[0].title} »` };
  }
  const { error } = await supabase.from("calendar_events").insert({ ...p.data, owner_id: employeeId, external_source: "local" });
  if (error) return fail(error);
  revalidatePath("/crm/calendar");
  return { ok: true, message: "Rendez-vous ajouté (synchronisation agenda en mode simulé)" };
}
