"use server";
import { revalidatePath } from "next/cache";
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
  const ctx = await guard();
  if (!ctx) return { ok: false, error: "Droit « organisation » requis." };
  const job = await enqueue(ctx.orgId, "connection.test", {}, { userId: ctx.userId });
  revalidatePath("/settings/integrations");
  if (job.status !== "done") return { ok: false, error: job.last_error ?? "Échec du test" };
  const r = (job.result ?? {}) as { account?: string; detail?: string };
  return { ok: true, message: job.provider === "mock" ? "Test réussi (mode simulé : aucun compte connecté)" : `Connexion vérifiée : ${r.account}`, data: { ...r, provider: job.provider } };
}

export async function disconnect(provider: Provider): Promise<ActionResult> {
  const ctx = await guard();
  if (!ctx) return { ok: false, error: "Droit « organisation » requis." };
  const db = createAdminClient();
  const { data: acc } = await db.from("integration_accounts").select("id").eq("org_id", ctx.orgId).eq("provider", provider).maybeSingle();
  if (!acc) return { ok: false, error: "Aucun compte connecté." };
  if (provider === "google") {
    // Révocation du jeton chez Google (best effort)
    const { data: sec } = await db.from("integration_secrets").select("refresh_token_enc").eq("account_id", acc.id).maybeSingle();
    if (sec?.refresh_token_enc) await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(decryptSecret(sec.refresh_token_enc))}`, { method: "POST" }).catch(() => null);
  }
  await db.from("integration_secrets").delete().eq("account_id", acc.id);
  await db.from("integration_subscriptions").delete().eq("account_id", acc.id);
  await db.from("integration_accounts").update({ status: "disconnected", cursors: {} }).eq("id", acc.id);
  revalidatePath("/settings/integrations");
  return { ok: true, message: "Compte déconnecté, jetons supprimés" };
}

export async function retryJob(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error, count } = await supabase.from("sync_jobs").update({ status: "queued", next_run_at: new Date().toISOString() }, { count: "exact" }).eq("id", id).in("status", ["error", "dead", "queued"]);
  if (error || !count) return { ok: false, error: "Votre rôle ne permet pas cette action." };
  await processJobs({ ids: [id] });
  revalidatePath("/settings/integrations");
  return { ok: true, message: "Tâche relancée" };
}

export async function runQueue(): Promise<ActionResult> {
  const ctx = await guard();
  if (!ctx) return { ok: false, error: "Droit « organisation » requis." };
  const r = await processJobs({ limit: 50 });
  revalidatePath("/settings/integrations");
  return { ok: true, message: `File traitée : ${r.done} faite(s), ${r.retry} à réessayer, ${r.dead} abandonnée(s)` };
}
