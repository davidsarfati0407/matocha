/** Flux OAuth 2.0 « authorization code » (client confidentiel) + rafraîchissement. */
import { providerConfig, redirectUri, type Provider } from "./providers";

export interface TokenSet {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  scope?: string;
  id_token?: string;
}

export function authorizeUrl(p: Provider, state: string) {
  const c = providerConfig(p);
  const u = new URL(c.authorizeUrl);
  u.search = new URLSearchParams({ client_id: c.clientId ?? "", response_type: "code", redirect_uri: redirectUri(p), scope: c.scopes.join(" "), state, ...c.extraAuth }).toString();
  return u.toString();
}

async function tokenRequest(p: Provider, body: Record<string, string>, f: typeof fetch = fetch): Promise<TokenSet> {
  const c = providerConfig(p);
  const res = await f(c.tokenUrl, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: c.clientId ?? "", client_secret: c.clientSecret ?? "", ...body }).toString(),
  });
  const json = (await res.json().catch(() => ({}))) as TokenSet & { error?: string; error_description?: string };
  if (!res.ok || !json.access_token) throw new Error(`OAuth ${p} : ${json.error ?? res.status} ${json.error_description ?? ""}`.trim());
  return json;
}

export const exchangeCode = (p: Provider, code: string, f?: typeof fetch) => tokenRequest(p, { grant_type: "authorization_code", code, redirect_uri: redirectUri(p) }, f);

export const refreshTokens = (p: Provider, refreshToken: string, f?: typeof fetch) => tokenRequest(p, { grant_type: "refresh_token", refresh_token: refreshToken, ...(p === "microsoft" ? { scope: providerConfig(p).scopes.join(" ") } : {}) }, f);

/** Adresse du compte depuis l'id_token (OpenID Connect) — sans vérification de signature, à titre d'affichage seulement. */
export function emailFromIdToken(idToken?: string): string | null {
  try {
    const payload = JSON.parse(Buffer.from((idToken ?? "").split(".")[1] ?? "", "base64url").toString("utf8")) as { email?: string; preferred_username?: string };
    return payload.email ?? payload.preferred_username ?? null;
  } catch {
    return null;
  }
}
