/** Retour OAuth : vérifie l'état anti-CSRF, échange le code, chiffre et stocke les jetons, lance la première synchro. */
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCtx } from "@/lib/backoffice/context";
import { emailFromIdToken, exchangeCode } from "@/lib/integrations/oauth";
import type { Provider } from "@/lib/integrations/providers";
import { enqueue, saveTokens } from "@/lib/integrations/store";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(req: Request, ctx: { params: Promise<{ provider: string }> }) {
  const provider = (await ctx.params).provider as Provider;
  const url = new URL(req.url);
  const back = (q: string) => NextResponse.redirect(new URL(`/settings/integrations?${q}`, req.url));
  const jar = await cookies();
  const expected = jar.get(`oauth_${provider}`)?.value;
  jar.delete(`oauth_${provider}`);
  if (url.searchParams.get("error")) return back(`error=${provider}:${encodeURIComponent(url.searchParams.get("error")!)}`);
  if (!expected || url.searchParams.get("state") !== expected) return back(`error=${provider}:etat_invalide`);
  const me = await getCtx();
  if (!me.can("organisation", "update")) return back(`error=${provider}:droits`);
  try {
    const tokens = await exchangeCode(provider, url.searchParams.get("code") ?? "");
    await saveTokens(createAdminClient(), me.orgId, provider, tokens, emailFromIdToken(tokens.id_token), me.userId);
    for (const kind of ["subscriptions.create", "calendar.delta", "mail.delta"]) await enqueue(me.orgId, kind, {}, { userId: me.userId, runNow: false });
    return back(`ok=${provider}`);
  } catch (e) {
    return back(`error=${provider}:${encodeURIComponent((e as Error).message.slice(0, 120))}`);
  }
}
