import "server-only";
import { getStore } from "@/lib/store";
import { nowIso, sha256 } from "./crypto";
import { OpsError } from "./errors";
import type { Scope } from "./scopes";
import type { ApiTokenRow } from "./tokens";

/** Resolves the Bearer token of a request. Throws 401 on any problem. */
export async function authenticate(authorization: string | null): Promise<ApiTokenRow> {
  const store = getStore();
  if (!store) {
    throw new OpsError(503, "storage_not_configured", "Le stockage n'est pas configuré sur ce déploiement.");
  }
  const match = authorization?.match(/^Bearer\s+(\S+)$/i);
  if (!match) {
    throw new OpsError(401, "unauthorized", "Jeton manquant. Utilisez l'en-tête Authorization: Bearer <jeton>.");
  }
  const token = await store.findOne<ApiTokenRow>("api_tokens", { token_hash: sha256(match[1]) });
  if (!token) throw new OpsError(401, "invalid_token", "Jeton invalide.");
  if (token.revoked_at) throw new OpsError(401, "token_revoked", "Ce jeton a été révoqué.");
  if (token.expires_at && new Date(token.expires_at) <= new Date()) {
    throw new OpsError(401, "token_expired", "Ce jeton a expiré.");
  }
  /* Best effort: last use is informative, never blocking. */
  store.update<ApiTokenRow>("api_tokens", token.id, { last_used_at: nowIso() }).catch(() => {});
  return token;
}

export function requireScope(token: ApiTokenRow, scope: Scope | null) {
  if (scope && !token.scopes.includes(scope)) {
    throw new OpsError(403, "insufficient_scope", `Ce jeton n'a pas le scope « ${scope} ».`, {
      required: scope,
    });
  }
}
