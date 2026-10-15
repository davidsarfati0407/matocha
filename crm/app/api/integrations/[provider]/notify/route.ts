/**
 * Webhooks des fournisseurs.
 * - Microsoft Graph : validation (écho de validationToken en text/plain), puis notifications
 *   vérifiées par clientState → tâche de synchronisation delta.
 * - Google Agenda : en-têtes X-Goog-Channel-* vérifiés par le jeton du canal → tâche delta.
 * Réponse rapide (202) : le travail est fait par la file, avec reprise sur erreur.
 */
import { NextResponse } from "next/server";
import { enqueue } from "@/lib/integrations/store";
import { createAdminClient } from "@/lib/supabase/admin";

async function orgFor(externalId: string, state: string | null) {
  const db = createAdminClient();
  const { data } = await db.from("integration_subscriptions").select("client_state, resource, integration_accounts(org_id)").like("external_id", `${externalId}%`).maybeSingle();
  if (!data || !state || data.client_state !== state) return null;
  return { org: (data.integration_accounts as unknown as { org_id: string }).org_id, resource: data.resource };
}

export async function POST(req: Request, ctx: { params: Promise<{ provider: string }> }) {
  const provider = (await ctx.params).provider;
  const url = new URL(req.url);
  if (provider === "microsoft") {
    const token = url.searchParams.get("validationToken");
    if (token) return new NextResponse(token, { status: 200, headers: { "content-type": "text/plain" } });
    const body = (await req.json().catch(() => ({ value: [] }))) as { value?: { subscriptionId: string; clientState?: string }[] };
    for (const n of body.value ?? []) {
      const m = await orgFor(n.subscriptionId, n.clientState ?? null);
      if (m) await enqueue(m.org, m.resource.includes("messages") ? "mail.delta" : "calendar.delta", { via: "webhook" }, { runNow: false });
    }
    return new NextResponse(null, { status: 202 });
  }
  if (provider === "google") {
    const channel = req.headers.get("x-goog-channel-id");
    const state = req.headers.get("x-goog-resource-state");
    if (channel && state !== "sync") {
      const m = await orgFor(channel, req.headers.get("x-goog-channel-token"));
      if (m) await enqueue(m.org, "calendar.delta", { via: "webhook" }, { runNow: false });
    }
    return new NextResponse(null, { status: 202 });
  }
  return NextResponse.json({ error: "fournisseur inconnu" }, { status: 404 });
}
