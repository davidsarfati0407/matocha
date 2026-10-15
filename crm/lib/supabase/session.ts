import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "./env";

// Webhooks des fournisseurs et worker planifié : authentifiés par leur propre secret, pas par la session
const PUBLIC_PATHS = ["/login", "/auth", "/api/integrations/microsoft/notify", "/api/integrations/google/notify", "/api/integrations/worker"];

/** Rafraîchit la session à chaque requête et protège les pages privées. */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([k, v]) => response.headers.set(k, v));
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isPublic = PUBLIC_PATHS.some((p) => request.nextUrl.pathname.startsWith(p));
  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
    return NextResponse.redirect(url);
  }
  // Double authentification : un compte avec un facteur TOTP vérifié doit présenter son code (niveau aal2)
  if (user && !isPublic && !request.nextUrl.pathname.startsWith("/login")) {
    const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== "aal2") {
      if (request.nextUrl.pathname.startsWith("/api/")) return NextResponse.json({ error: "double authentification requise" }, { status: 401 });
      const url = request.nextUrl.clone();
      url.pathname = "/login/mfa";
      url.search = "";
      url.searchParams.set("next", request.nextUrl.pathname + request.nextUrl.search);
      return NextResponse.redirect(url);
    }
  }
  return response;
}
