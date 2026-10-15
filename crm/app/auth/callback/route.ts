import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** Retour du lien magique ou du SSO (PKCE) : échange le code contre une session. */
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    // SSO et lien magique : retour à la page demandée (le proxy exige ensuite le code 2FA si activée)
    const next = request.nextUrl.searchParams.get("next");
    if (!error) return NextResponse.redirect(new URL(next?.startsWith("/") && !next.startsWith("//") ? next : "/", request.url));
  }
  return NextResponse.redirect(new URL("/login?error=link", request.url));
}
