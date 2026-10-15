/** Démarre le consentement OAuth (droit organisation:update requis). */
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getCtx } from "@/lib/backoffice/context";
import { authorizeUrl } from "@/lib/integrations/oauth";
import { providerReady, type Provider } from "@/lib/integrations/providers";

export async function GET(_req: Request, ctx: { params: Promise<{ provider: string }> }) {
  const provider = (await ctx.params).provider as Provider;
  if (provider !== "microsoft" && provider !== "google") return NextResponse.json({ error: "fournisseur inconnu" }, { status: 404 });
  const me = await getCtx();
  if (!me.can("organisation", "update")) return NextResponse.json({ error: "droit organisation requis" }, { status: 403 });
  if (!providerReady(provider)) return NextResponse.redirect(new URL(`/settings/integrations?error=${provider}:non_configure`, _req.url));
  const state = randomBytes(24).toString("base64url");
  (await cookies()).set(`oauth_${provider}`, state, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/api/integrations", maxAge: 600 });
  return NextResponse.redirect(authorizeUrl(provider, state));
}
