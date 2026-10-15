"use server";
import Anthropic from "@anthropic-ai/sdk";
import { getLocale, getTranslations } from "next-intl/server";
import { aiConfigured, askAssistant, type ChatTurn } from "@/lib/ai/assistant";
import { getCtx } from "@/lib/backoffice/context";
import type { ActionResult } from "@/lib/backoffice/result";

export async function aiStatus() {
  return { configured: aiConfigured() };
}

export async function ask(history: ChatTurn[]): Promise<ActionResult<{ text: string; tools: string[] }>> {
  const t = await getTranslations("ai.errors");
  if (!aiConfigured()) return { ok: false, error: t("notConfigured") };
  const ctx = await getCtx();
  if (!ctx.can("ia", "create")) return { ok: false, error: t("forbidden") };
  const turns = history.filter((h) => h.text.trim()).slice(-12).map((h) => ({ role: h.role, text: h.text.slice(0, 4000) }));
  if (turns.at(-1)?.role !== "user") return { ok: false, error: t("emptyQuestion") };
  try {
    return { ok: true, data: await askAssistant(turns, await getLocale()) };
  } catch (e) {
    if (e instanceof Anthropic.AuthenticationError) return { ok: false, error: t("authError") };
    if (e instanceof Anthropic.RateLimitError) return { ok: false, error: t("rateLimit") };
    if (e instanceof Anthropic.APIError) return { ok: false, error: e.status ? t("apiError", { status: e.status }) : t("networkError") };
    return { ok: false, error: t("unavailable") };
  }
}
