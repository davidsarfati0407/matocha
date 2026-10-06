import "server-only";
import { randomUUID } from "node:crypto";
import { getStore } from "@/lib/store";
import type { Row } from "@/lib/store/types";
import { hmacHex, nowIso, safeEqual } from "./crypto";

export const WEBHOOK_EVENTS = [
  "lead.confirmed",
  "order.paid",
  "order.payment_failed",
  "stock.low",
  "change_request.decided",
  "form.error_spike",
] as const;
export type WebhookEvent = (typeof WEBHOOK_EVENTS)[number];

export type DeliveryRow = Row & {
  event: WebhookEvent;
  payload: Record<string, unknown>;
  status: "pending" | "delivered" | "retrying" | "failed" | "skipped";
  attempts: number;
  next_attempt_at: string | null;
  last_status_code: number | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};

export const SIGNATURE_HEADER = "Matocha-Signature";
const DEFAULT_TOLERANCE_S = 300;

/** `t=<unix seconds>,v1=<hex HMAC-SHA256(secret, "<t>.<body>")>` */
export function signWebhook(secret: string, body: string, timestamp = Math.floor(Date.now() / 1000)) {
  return `t=${timestamp},v1=${hmacHex(secret, `${timestamp}.${body}`)}`;
}

export function verifyWebhookSignature(
  secret: string,
  header: string | null,
  body: string,
  toleranceSeconds = DEFAULT_TOLERANCE_S,
  now = Math.floor(Date.now() / 1000),
): boolean {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(",").map((p) => {
      const i = p.indexOf("=");
      return [p.slice(0, i).trim(), p.slice(i + 1).trim()];
    }),
  );
  const t = Number(parts.t);
  if (!Number.isFinite(t) || !parts.v1) return false;
  if (Math.abs(now - t) > toleranceSeconds) return false;
  return safeEqual(parts.v1, hmacHex(secret, `${t}.${body}`));
}

const maxAttempts = () => Number(process.env.OPS_WEBHOOK_MAX_ATTEMPTS ?? 6);
const backoffBaseMs = () => Number(process.env.OPS_WEBHOOK_BACKOFF_MS ?? 30_000);

/** Exponential backoff: base × 2^(attempt-1). 30 s, 1 min, 2 min, 4 min… */
export function nextAttemptDelayMs(attempt: number) {
  return backoffBaseMs() * 2 ** Math.max(0, attempt - 1);
}

async function attempt(delivery: DeliveryRow): Promise<DeliveryRow> {
  const store = getStore();
  const url = process.env.OPS_WEBHOOK_URL;
  const secret = process.env.OPS_WEBHOOK_SECRET;
  if (!store) return delivery;
  if (!url || !secret) {
    return (await store.update<DeliveryRow>("webhook_deliveries", delivery.id, {
      status: "skipped",
      last_error: "OPS_WEBHOOK_URL ou OPS_WEBHOOK_SECRET absent",
      updated_at: nowIso(),
    }))!;
  }

  const body = JSON.stringify({
    id: delivery.id,
    event: delivery.event,
    created_at: delivery.created_at,
    data: delivery.payload,
  });
  const attempts = delivery.attempts + 1;
  let statusCode: number | null = null;
  let error: string | null = null;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        [SIGNATURE_HEADER]: signWebhook(secret, body),
        "Matocha-Event": delivery.event,
        "Matocha-Delivery": delivery.id,
      },
      body,
      signal: AbortSignal.timeout(8000),
    });
    statusCode = response.status;
    if (response.ok) {
      return (await store.update<DeliveryRow>("webhook_deliveries", delivery.id, {
        status: "delivered",
        attempts,
        last_status_code: statusCode,
        last_error: null,
        next_attempt_at: null,
        updated_at: nowIso(),
      }))!;
    }
    error = `HTTP ${statusCode}`;
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  }

  const exhausted = attempts >= maxAttempts();
  return (await store.update<DeliveryRow>("webhook_deliveries", delivery.id, {
    status: exhausted ? "failed" : "retrying",
    attempts,
    last_status_code: statusCode,
    last_error: error,
    next_attempt_at: exhausted
      ? null
      : new Date(Date.now() + nextAttemptDelayMs(attempts)).toISOString(),
    updated_at: nowIso(),
  }))!;
}

/**
 * Records the event and makes a first delivery attempt. Failures are retried
 * by `retryDueWebhooks()` (called by the cron route /api/cron/webhooks).
 * Never throws: a webhook problem must not break the user-facing action.
 */
export async function emitWebhook(event: WebhookEvent, payload: Record<string, unknown>) {
  const store = getStore();
  if (!store) return null;
  try {
    const now = nowIso();
    const delivery = await store.insert<DeliveryRow>("webhook_deliveries", {
      id: randomUUID(),
      event,
      payload,
      status: "pending",
      attempts: 0,
      next_attempt_at: now,
      last_status_code: null,
      last_error: null,
      created_at: now,
      updated_at: now,
    });
    return await attempt(delivery);
  } catch (error) {
    console.error("[webhooks] emit failed", error);
    return null;
  }
}

export async function retryDueWebhooks(now = new Date()) {
  const store = getStore();
  if (!store) return { processed: 0 };
  const due = (await store.list<DeliveryRow>("webhook_deliveries", { filter: { status: "retrying" } }))
    .filter((d) => d.next_attempt_at && new Date(d.next_attempt_at) <= now);
  for (const d of due) await attempt(d);
  return { processed: due.length };
}
