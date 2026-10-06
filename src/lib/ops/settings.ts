import "server-only";
import { getStore } from "@/lib/store";
import type { SettingRow } from "@/lib/store/types";
import { nowIso } from "./crypto";

export async function getSetting<T = unknown>(key: string): Promise<T | null> {
  const store = getStore();
  if (!store) return null;
  const row = await store.get<SettingRow>("settings", key);
  return (row?.value ?? null) as T | null;
}

export async function setSetting(key: string, value: unknown) {
  const store = getStore();
  if (!store) throw new Error("Stockage non configuré");
  return store.upsert<SettingRow>("settings", { id: key, value, updated_at: nowIso() });
}
