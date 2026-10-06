import "server-only";
import { MemoryStore } from "./memory";
import { SupabaseStore } from "./supabase";
import type { Store } from "./types";

const globalStore = globalThis as unknown as { __matochaMemoryStore?: MemoryStore };

/**
 * Returns the configured store, or null when none is configured.
 *
 * - Supabase when SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set.
 * - In-memory when MATOCHA_STORE=memory, outside production only (tests, dev).
 * - Otherwise null: features that need storage render their "not configured"
 *   state instead of pretending.
 */
export function getStore(): Store | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) return new SupabaseStore(url, key);

  if (process.env.MATOCHA_STORE === "memory" && process.env.NODE_ENV !== "production") {
    globalStore.__matochaMemoryStore ??= new MemoryStore();
    return globalStore.__matochaMemoryStore;
  }
  return null;
}

/** Test helper: wipes the in-memory store. */
export function resetMemoryStore() {
  globalStore.__matochaMemoryStore?.reset();
}
