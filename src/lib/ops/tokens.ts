import "server-only";
import { randomUUID } from "node:crypto";
import { getStore } from "@/lib/store";
import type { Row } from "@/lib/store/types";
import { nowIso, randomToken, sha256 } from "./crypto";
import { isScope, type Scope } from "./scopes";

export type ApiTokenRow = Row & {
  name: string;
  token_hash: string;
  prefix: string;
  scopes: Scope[];
  expires_at: string | null;
  revoked_at: string | null;
  created_at: string;
  created_by: string;
  last_used_at: string | null;
};

export const TOKEN_PREFIX = "mto_";

/**
 * Creates a token. The plaintext is returned ONCE; only its SHA-256 is stored.
 */
export async function createApiToken(input: {
  name: string;
  scopes: string[];
  expiresInDays: number | null;
  createdBy: string;
}) {
  const store = getStore();
  if (!store) throw new Error("Stockage non configuré");
  const scopes = [...new Set(input.scopes.filter(isScope))];
  if (scopes.length === 0) throw new Error("Choisissez au moins un scope.");
  const plaintext = `${TOKEN_PREFIX}${randomToken(32)}`;
  const row = await store.insert<ApiTokenRow>("api_tokens", {
    id: randomUUID(),
    name: input.name.trim().slice(0, 80) || "Jeton",
    token_hash: sha256(plaintext),
    prefix: plaintext.slice(0, 10),
    scopes,
    expires_at: input.expiresInDays
      ? new Date(Date.now() + input.expiresInDays * 86_400_000).toISOString()
      : null,
    revoked_at: null,
    created_at: nowIso(),
    created_by: input.createdBy,
    last_used_at: null,
  });
  return { token: plaintext, row };
}

export async function revokeApiToken(id: string) {
  const store = getStore();
  if (!store) throw new Error("Stockage non configuré");
  return store.update<ApiTokenRow>("api_tokens", id, { revoked_at: nowIso() });
}

export async function listApiTokens() {
  const store = getStore();
  if (!store) return [];
  return store.list<ApiTokenRow>("api_tokens", { orderBy: { column: "created_at", ascending: false } });
}
