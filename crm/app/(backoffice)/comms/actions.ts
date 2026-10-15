"use server";
import { revalidatePath } from "next/cache";
import { outbound, textToHtml } from "@/lib/integrations/outbound";
import { aiConfigured, draftReply } from "@/lib/ai/assistant";
import { getCtx } from "@/lib/backoffice/context";
import { fail, type ActionResult } from "@/lib/backoffice/result";
import { createClient } from "@/lib/supabase/server";

/** Brouillon : IA si configurée, sinon modèle de réponse (indiqué comme tel). */
export async function makeDraft(threadId: string): Promise<ActionResult<{ text: string; source: "ia" | "modele" }>> {
  const supabase = await createClient();
  const { data: t } = await supabase.from("threads").select("subject, clients(name), messages(direction, from_name, body, language, sent_at)").eq("id", threadId).single();
  if (!t) return { ok: false, error: "Fil introuvable" };
  const msgs = [...(t.messages as { direction: string; from_name: string; body: string; language: string | null; sent_at: string | null }[])].sort((a, b) => (a.sent_at ?? "").localeCompare(b.sent_at ?? ""));
  const lastIn = [...msgs].reverse().find((m) => m.direction === "in");
  const lang = lastIn?.language ?? "fr";
  const client = (t.clients as unknown as { name: string } | null)?.name;
  const { fullName, orgName } = await getCtx();
  if (aiConfigured()) {
    try {
      return { ok: true, data: { text: await draftReply({ subject: t.subject, language: lang, client, messages: msgs.map((m) => ({ direction: m.direction, from: m.from_name, body: m.body })) }), source: "ia" } };
    } catch {
      /* repli sur le modèle */
    }
  }
  const first = lastIn?.from_name.split(" ")[0] ?? "";
  const text = lang === "en" ? `Hello ${first},\n\nThank you for your message. [to be completed]\n\nBest regards,\n${fullName} — ${orgName}` : `Bonjour ${first},\n\nMerci pour votre message. [à compléter]\n\nBien cordialement,\n${fullName} — ${orgName}`;
  return { ok: true, data: { text, source: "modele" } };
}

export async function sendReply(threadId: string, body: string, aiDraft: boolean): Promise<ActionResult> {
  if (!body.trim()) return { ok: false, error: "Message vide" };
  const supabase = await createClient();
  const { fullName } = await getCtx();
  const now = new Date().toISOString();
  const { data: t } = await supabase.from("threads").select("subject, channel, clients(email)").eq("id", threadId).single();
  const to = (t?.clients as unknown as { email: string | null } | null)?.email;
  // Envoi réel via le compte connecté (Outlook / Gmail) ou connecteur simulé
  const sent = t?.channel === "email" && to ? await outbound("mail.send", { to: [to], subject: `Re: ${t.subject}`, html: textToHtml(body) }) : null;
  if (sent && !sent.ok) return { ok: false, error: sent.error };
  const { error } = await supabase.from("messages").insert({ thread_id: threadId, direction: "out", from_name: fullName, body, sent_at: now, is_ai_draft: aiDraft });
  if (error) return fail(error);
  await supabase.from("threads").update({ status: "answered", last_message_at: now }).eq("id", threadId);
  revalidatePath("/comms/inbox");
  return { ok: true, message: sent ? `Réponse envoyée à ${to} (${sent.via})` : "Réponse enregistrée (fil interne)" };
}

export async function closeThread(threadId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("threads").update({ status: "closed" }).eq("id", threadId);
  if (error) return fail(error);
  revalidatePath("/comms/inbox");
  return { ok: true, message: "Fil clôturé" };
}
