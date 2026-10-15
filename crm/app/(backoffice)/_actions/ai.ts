"use server";
import Anthropic from "@anthropic-ai/sdk";
import { aiConfigured, askAssistant, type ChatTurn } from "@/lib/ai/assistant";
import { getCtx } from "@/lib/backoffice/context";
import type { ActionResult } from "@/lib/backoffice/result";

export async function aiStatus() {
  return { configured: aiConfigured() };
}

export async function ask(history: ChatTurn[]): Promise<ActionResult<{ text: string; tools: string[] }>> {
  if (!aiConfigured()) return { ok: false, error: "Assistant non configuré : ajoutez ANTHROPIC_API_KEY dans .env.local." };
  const ctx = await getCtx();
  if (!ctx.can("ia", "create")) return { ok: false, error: "Votre rôle ne permet pas d'utiliser l'assistant." };
  const turns = history.filter((h) => h.text.trim()).slice(-12).map((h) => ({ role: h.role, text: h.text.slice(0, 4000) }));
  if (turns.at(-1)?.role !== "user") return { ok: false, error: "Question vide." };
  try {
    return { ok: true, data: await askAssistant(turns) };
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return { ok: false, error: "Clé API refusée par Anthropic." };
    if (e instanceof Anthropic.RateLimitError) return { ok: false, error: "Trop de requêtes : réessayez dans un instant." };
    if (e instanceof Anthropic.APIError) return { ok: false, error: `Erreur de l'API (${e.status ?? "réseau"}).` };
    return { ok: false, error: "Assistant indisponible." };
  }
}
