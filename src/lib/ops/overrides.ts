import "server-only";
import { getStore } from "@/lib/store";
import type { CatalogOverrideRow } from "@/lib/store/types";
import { nowIso } from "./crypto";

/**
 * Merges `patch` into the override row of an entity. Top-level keys replace
 * the previous value whole (a Proof is always written as a unit).
 */
export async function patchOverride(
  entity: CatalogOverrideRow["entity"],
  key: string,
  patch: Record<string, unknown>,
) {
  const store = getStore();
  if (!store) throw new Error("Stockage non configuré");
  const id = `${entity}:${key}`;
  const current = await store.get<CatalogOverrideRow>("catalog_overrides", id);
  return store.upsert<CatalogOverrideRow>("catalog_overrides", {
    id,
    entity,
    key,
    patch: { ...(current?.patch ?? {}), ...patch },
    updated_at: nowIso(),
  });
}
