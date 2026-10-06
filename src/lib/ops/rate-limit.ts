import "server-only";
import { getStore } from "@/lib/store";
import type { Row } from "@/lib/store/types";
import { OpsError } from "./errors";

type CounterRow = Row & { count: number; window_start: string };

/** Fixed one-minute window per token. */
export async function enforceRateLimit(tokenId: string, now = Date.now()) {
  const store = getStore();
  if (!store) return;
  const limit = Number(process.env.OPS_RATE_LIMIT_PER_MIN ?? 120);
  const windowStart = Math.floor(now / 60_000) * 60_000;
  const id = `ops:${tokenId}:${windowStart}`;
  const row = await store.get<CounterRow>("rate_limits", id);
  const count = (row?.count ?? 0) + 1;
  await store.upsert<CounterRow>("rate_limits", {
    id,
    count,
    window_start: new Date(windowStart).toISOString(),
  });
  if (count > limit) {
    const retryAfter = Math.ceil((windowStart + 60_000 - now) / 1000);
    throw new OpsError(429, "rate_limited", "Trop de requêtes pour ce jeton. Réessayez dans un instant.", {
      retry_after_seconds: retryAfter,
      limit_per_minute: limit,
    });
  }
}
