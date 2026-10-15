"use server";
/** Actions financières : factures, paiements, rapprochement bancaire, relances, notes de frais. */
import { revalidatePath } from "next/cache";
import { outbound, textToHtml } from "@/lib/integrations/outbound";
import { invoicePdf } from "@/lib/pdf/documents";
import { z } from "zod";
import { getCtx } from "@/lib/backoffice/context";
import { fail, type ActionResult } from "@/lib/backoffice/result";
import { computeTotals } from "@/lib/domain/money";
import { matchEntries, parseCamt054 } from "@/lib/domain/camt";
import { createClient } from "@/lib/supabase/server";

const today = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Europe/Paris" });

export async function sendInvoice(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { data: inv } = await supabase.from("invoices").select("number, total_ttc, due_on, clients(email)").eq("id", id).single();
  const to = (inv?.clients as unknown as { email: string | null } | null)?.email;
  if (!to) return { ok: false, error: "Le client n'a pas d'adresse e-mail." };
  const { orgName } = await getCtx();
  const doc = await invoicePdf(id);
  const sent = await outbound("mail.send", { to: [to], subject: `Facture ${inv!.number} — ${orgName}`, html: textToHtml(`Bonjour,\n\nVeuillez trouver notre facture ${inv!.number} de ${Number(inv!.total_ttc).toLocaleString("fr-FR", { style: "currency", currency: "EUR" })} TTC, échéance le ${inv!.due_on.split("-").reverse().join("/")}.\nLa facture est jointe (PDF Factur-X : XML de facture électronique embarqué).\n\nBien cordialement,\n${orgName}`), attachments: doc ? [{ name: `${doc.number}.pdf`, contentType: "application/pdf", base64: doc.pdf.toString("base64") }] : [] });
  if (!sent.ok) return { ok: false, error: sent.error };
  const { error } = await supabase.from("invoices").update({ status: "sent" }).eq("id", id).eq("status", "draft");
  if (error) return fail(error);
  revalidatePath("/finance", "layout");
  return { ok: true, message: `Facture envoyée à ${to} (${sent.via})` };
}

const paySchema = z.object({ invoice_id: z.string().uuid(), amount: z.number().positive(), received_on: z.string(), method: z.enum(["virement", "carte", "cheque", "especes", "prelevement"]).default("virement"), reference: z.string().optional() });
export async function recordPayment(input: z.input<typeof paySchema>): Promise<ActionResult<{ id: string }>> {
  const p = paySchema.safeParse(input);
  if (!p.success) return { ok: false, error: "Paiement invalide" };
  const supabase = await createClient();
  const { data, error } = await supabase.from("payments").insert(p.data).select("id").single();
  if (error) return fail(error);
  revalidatePath("/finance", "layout");
  return { ok: true, message: "Paiement enregistré, facture mise à jour", data: { id: data.id } };
}

export async function deletePayment(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("payments").delete().eq("id", id);
  if (error) return fail(error);
  revalidatePath("/finance", "layout");
  return { ok: true, message: "Paiement annulé" };
}

/** Avoir total : reprend les lignes, annule la facture d'origine. */
export async function creditNote(id: string): Promise<ActionResult<{ id: string }>> {
  const supabase = await createClient();
  const [{ data: inv }, { data: lines }] = await Promise.all([supabase.from("invoices").select("client_id, number, status, paid_amount").eq("id", id).single(), supabase.from("invoice_lines").select("label, quantity, unit_price, vat_rate").eq("invoice_id", id).order("position")]);
  if (!inv) return { ok: false, error: "Facture introuvable" };
  if (Number(inv.paid_amount) > 0) return { ok: false, error: "Facture déjà (partiellement) réglée : annulez d'abord les paiements." };
  const ls = (lines ?? []).map((l) => ({ label: l.label, quantity: Number(l.quantity), unit_price: Number(l.unit_price), vat_rate: Number(l.vat_rate) }));
  const t = computeTotals(ls.map((l) => ({ quantity: l.quantity, unitPrice: l.unit_price, vatRate: l.vat_rate })));
  const { data, error } = await supabase.rpc("create_invoice", { payload: { client_id: inv.client_id, kind: "avoir", status: "sent", notes: `Avoir sur la facture ${inv.number}`, total_ht: t.ht, total_vat: t.vat, total_ttc: t.ttc, due_days: 0, lines: ls } });
  if (error) return fail(error);
  await supabase.from("invoices").update({ status: "cancelled" }).eq("id", id);
  revalidatePath("/finance", "layout");
  return { ok: true, message: "Avoir émis, facture annulée", data: { id: data as string } };
}

/** Import camt.054 : lecture, rapprochement proposé (rien n'est écrit). */
export async function previewCamt(xml: string): Promise<ActionResult<{ amount: number; reference: string; debtor: string | null; bookedOn: string | null; invoiceId: string | null; number: string | null; rule: string | null }[]>> {
  let entries;
  try {
    entries = parseCamt054(xml);
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
  const supabase = await createClient();
  const { data: open } = await supabase.from("invoices").select("id, number, total_ttc, paid_amount").in("status", ["sent", "partial", "overdue"]);
  const list = (open ?? []).map((i) => ({ id: i.id, number: i.number, remaining: Math.round((Number(i.total_ttc) - Number(i.paid_amount)) * 100) / 100 }));
  const m = matchEntries(entries, list);
  return { ok: true, data: m.map((x) => ({ ...x.entry, invoiceId: x.invoiceId, number: list.find((l) => l.id === x.invoiceId)?.number ?? null, rule: x.rule })) };
}

export async function applyMatches(items: { invoiceId: string; amount: number; reference: string; bookedOn: string | null }[]): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("payments").insert(items.map((i) => ({ invoice_id: i.invoiceId, amount: i.amount, received_on: i.bookedOn ?? today(), method: "virement", reference: i.reference })));
  if (error) return fail(error);
  revalidatePath("/finance", "layout");
  return { ok: true, message: `${items.length} paiement(s) lettré(s)` };
}

/** Exemple de relevé camt.054 construit à partir des factures ouvertes (démo). */
export async function sampleCamt(): Promise<string> {
  const supabase = await createClient();
  const { data } = await supabase.from("invoices").select("number, total_ttc, paid_amount, clients(name)").in("status", ["sent", "partial", "overdue"]).eq("kind", "facture").order("issued_on", { ascending: false }).limit(3);
  const txs = (data ?? []).map((i, k) => {
    const amt = (Number(i.total_ttc) - Number(i.paid_amount)).toFixed(2);
    const ref = k === 1 ? "VIREMENT CLIENT" : `REGLEMENT ${i.number}`;
    return `<TxDtls><Amt Ccy="EUR">${amt}</Amt><RltdPties><Dbtr><Nm>${(i.clients as unknown as { name: string }).name}</Nm></Dbtr></RltdPties><RmtInf><Ustrd>${ref}</Ustrd></RmtInf></TxDtls>`;
  });
  txs.push(`<TxDtls><Amt Ccy="EUR">123.45</Amt><RltdPties><Dbtr><Nm>Inconnu</Nm></Dbtr></RltdPties><RmtInf><Ustrd>DIVERS</Ustrd></RmtInf></TxDtls>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.054.001.08"><BkToCstmrDbtCdtNtfctn><Ntfctn><Ntry><Amt Ccy="EUR">0</Amt><CdtDbtInd>CRDT</CdtDbtInd><BookgDt><Dt>${today()}</Dt></BookgDt><NtryDtls>${txs.join("")}</NtryDtls></Ntry></Ntfctn></BkToCstmrDbtCdtNtfctn></Document>`;
}

export async function sendDunning(invoiceId: string, level: number, body?: string): Promise<ActionResult> {
  const supabase = await createClient();
  const now = new Date().toISOString();
  const { data: inv } = await supabase.from("invoices").select("number, clients(email)").eq("id", invoiceId).single();
  const to = (inv?.clients as unknown as { email: string | null } | null)?.email;
  if (!to) return { ok: false, error: "Le client n'a pas d'adresse e-mail." };
  const sent = await outbound("mail.send", { to: [to], subject: `${level === 3 ? "Mise en demeure" : "Relance"} — facture ${inv!.number}`, html: textToHtml(body ?? "") });
  if (!sent.ok) return { ok: false, error: sent.error };
  const { data: existing } = await supabase.from("dunning_steps").select("id").eq("invoice_id", invoiceId).eq("level", level).maybeSingle();
  const { error } = existing ? await supabase.from("dunning_steps").update({ sent_at: now }).eq("id", existing.id) : await supabase.from("dunning_steps").insert({ invoice_id: invoiceId, level, due_at: now, sent_at: now });
  if (error) return fail(error);
  revalidatePath("/finance/dunning");
  return { ok: true, message: `Relance niveau ${level} envoyée à ${to} (${sent.via})` };
}

export async function decideExpenses(ids: string[], status: "approved" | "rejected" | "reimbursed"): Promise<ActionResult> {
  const supabase = await createClient();
  const { employeeId } = await getCtx();
  const { error, count } = await supabase.from("expenses").update({ status, approver_id: employeeId }, { count: "exact" }).in("id", ids);
  if (error) return fail(error);
  revalidatePath("/finance/expenses");
  return { ok: true, message: `${count ?? ids.length} note(s) ${status === "approved" ? "validée(s)" : status === "rejected" ? "refusée(s)" : "remboursée(s)"}` };
}

const expSchema = z.object({ spent_on: z.string(), category: z.string().min(1), label: z.string().min(1), amount_ttc: z.number().positive(), vat_amount: z.number().min(0) });
export async function submitExpense(input: z.input<typeof expSchema>): Promise<ActionResult> {
  const p = expSchema.safeParse(input);
  if (!p.success) return { ok: false, error: "Note de frais incomplète" };
  const { employeeId } = await getCtx();
  if (!employeeId) return { ok: false, error: "Compte non rattaché à un collaborateur" };
  const supabase = await createClient();
  const { error } = await supabase.from("expenses").insert({ ...p.data, employee_id: employeeId, receipt_path: "simulé" });
  if (error) return fail(error);
  revalidatePath("/finance/expenses");
  return { ok: true, message: "Note de frais soumise (justificatif : stockage simulé)" };
}
