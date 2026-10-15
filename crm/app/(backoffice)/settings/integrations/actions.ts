"use server";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { getCtx } from "@/lib/backoffice/context";
import type { ActionResult } from "@/lib/backoffice/result";
import { decryptSecret } from "@/lib/integrations/crypto";
import type { Provider } from "@/lib/integrations/providers";
import { enqueue, processJobs } from "@/lib/integrations/store";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

async function guard() {
  const ctx = await getCtx();
  return ctx.can("organisation", "update") ? ctx : null;
}

export async function testConnection(): Promise<ActionResult<{ account?: string; detail?: string; provider: string }>> {
  const t = await getTranslations("settings.integrations");
  const ctx = await guard();
  if (!ctx) return { ok: false, error: t("orgRequired") };
  const job = await enqueue(ctx.orgId, "connection.test", {}, { userId: ctx.userId });
  revalidatePath("/settings/integrations");
  if (job.status !== "done") return { ok: false, error: job.last_error ?? t("testFailed") };
  const r = (job.result ?? {}) as { account?: string; detail?: string };
  return { ok: true, message: job.provider === "mock" ? t("testMock") : t("testOk", { account: r.account ?? "" }), data: { ...r, provider: job.provider } };
}

export async function disconnect(provider: Provider): Promise<ActionResult> {
  const t = await getTranslations("settings.integrations");
  const ctx = await guard();
  if (!ctx) return { ok: false, error: t("orgRequired") };
  const db = createAdminClient();
  const { data: acc } = await db.from("integration_accounts").select("id").eq("org_id", ctx.orgId).eq("provider", provider).maybeSingle();
  if (!acc) return { ok: false, error: t("noConnectedAccount") };
  if (provider === "google") {
    // Révocation du jeton chez Google (best effort)
    const { data: sec } = await db.from("integration_secrets").select("refresh_token_enc").eq("account_id", acc.id).maybeSingle();
    if (sec?.refresh_token_enc) await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(decryptSecret(sec.refresh_token_enc))}`, { method: "POST" }).catch(() => null);
  }
  await db.from("integration_secrets").delete().eq("account_id", acc.id);
  await db.from("integration_subscriptions").delete().eq("account_id", acc.id);
  await db.from("integration_accounts").update({ status: "disconnected", cursors: {} }).eq("id", acc.id);
  revalidatePath("/settings/integrations");
  return { ok: true, message: t("disconnected") };
}

export async function retryJob(id: string): Promise<ActionResult> {
  const t = await getTranslations("settings");
  const supabase = await createClient();
  const { error, count } = await supabase.from("sync_jobs").update({ status: "queued", next_run_at: new Date().toISOString() }, { count: "exact" }).eq("id", id).in("status", ["error", "dead", "queued"]);
  if (error || !count) return { ok: false, error: t("actions.forbidden") };
  await processJobs({ ids: [id] });
  revalidatePath("/settings/integrations");
  return { ok: true, message: t("integrations.retried") };
}

export async function runQueue(): Promise<ActionResult> {
  const t = await getTranslations("settings.integrations");
  const ctx = await guard();
  if (!ctx) return { ok: false, error: t("orgRequired") };
  const r = await processJobs({ limit: 50 });
  revalidatePath("/settings/integrations");
  return { ok: true, message: t("queueDone", { done: r.done, retry: r.retry, dead: r.dead }) };
}
