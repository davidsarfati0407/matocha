import "server-only";
import { getStore } from "@/lib/store";
import type { Row } from "@/lib/store/types";
import { nowIso, sha256 } from "./crypto";
import { OpsError } from "./errors";

export type StoredResponse = { status: number; body: unknown };

type IdemRow = Row & {
  token_id: string;
  fingerprint: string;
  response: StoredResponse;
  created_at: string;
};

const keyId = (tokenId: string, key: string) => sha256(`${tokenId}:${key}`);

export function requireIdempotencyKey(key: string | null | undefined): string {
  const trimmed = key?.trim();
  if (!trimmed) {
    throw new OpsError(
      400,
      "idempotency_key_required",
      "L'en-tête Idempotency-Key est obligatoire pour toute écriture.",
    );
  }
  if (trimmed.length > 200) {
    throw new OpsError(400, "idempotency_key_invalid", "Idempotency-Key trop longue (200 caractères max).");
  }
  return trimmed;
}

/** Returns the stored response if this key was already used for the same request. */
export async function lookupIdempotent(tokenId: string, key: string, fingerprint: string) {
  const store = getStore();
  if (!store) return null;
  const row = await store.get<IdemRow>("idempotency_keys", keyId(tokenId, key));
  if (!row) return null;
  if (row.fingerprint !== fingerprint) {
    throw new OpsError(
      422,
      "idempotency_key_reused",
      "Cette Idempotency-Key a déjà servi pour une requête différente.",
    );
  }
  return row.response;
}

export async function saveIdempotent(
  tokenId: string,
  key: string,
  fingerprint: string,
  response: StoredResponse,
) {
  const store = getStore();
  if (!store) return;
  await store.upsert<IdemRow>("idempotency_keys", {
    id: keyId(tokenId, key),
    token_id: tokenId,
    fingerprint,
    response,
    created_at: nowIso(),
  });
}
