import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { emitWebhook, nextAttemptDelayMs, retryDueWebhooks, signWebhook, verifyWebhookSignature, type DeliveryRow } from "@/lib/ops/webhooks";
import { verifyStripeSignature } from "@/lib/commerce/stripe";
import { createHmac } from "node:crypto";
import { getStore } from "@/lib/store";
import { setupEnv } from "./helpers";

const SECRET = "whsec_test_secret";
const BODY = JSON.stringify({ event: "lead.confirmed", data: { lead_id: "1" } });

beforeEach(() => setupEnv());
afterEach(() => vi.unstubAllGlobals());

describe("outgoing webhook signature", () => {
  it("accepts a valid signature", () => {
    expect(verifyWebhookSignature(SECRET, signWebhook(SECRET, BODY), BODY)).toBe(true);
  });

  it("rejects a tampered body or wrong secret", () => {
    const sig = signWebhook(SECRET, BODY);
    expect(verifyWebhookSignature(SECRET, sig, BODY + " ")).toBe(false);
    expect(verifyWebhookSignature("other", sig, BODY)).toBe(false);
    expect(verifyWebhookSignature(SECRET, null, BODY)).toBe(false);
    expect(verifyWebhookSignature(SECRET, "t=abc,v1=00", BODY)).toBe(false);
  });

  it("rejects a stale timestamp (replay)", () => {
    const old = Math.floor(Date.now() / 1000) - 3600;
    expect(verifyWebhookSignature(SECRET, signWebhook(SECRET, BODY, old), BODY)).toBe(false);
  });
});

describe("Stripe signature", () => {
  it("verifies v1 and refuses stale or wrong ones", () => {
    const t = Math.floor(Date.now() / 1000);
    const v1 = createHmac("sha256", SECRET).update(`${t}.${BODY}`).digest("hex");
    expect(verifyStripeSignature(SECRET, `t=${t},v1=${v1}`, BODY)).toBe(true);
    expect(verifyStripeSignature(SECRET, `t=${t},v1=${"0".repeat(64)}`, BODY)).toBe(false);
    expect(verifyStripeSignature(SECRET, `t=${t - 1000},v1=${v1}`, BODY)).toBe(false);
  });
});

describe("delivery", () => {
  it("is logged as skipped when no endpoint is configured", async () => {
    const d = await emitWebhook("lead.confirmed", { lead_id: "1" });
    expect(d?.status).toBe("skipped");
  });

  it("signs, delivers, and retries with exponential backoff", async () => {
    setupEnv({ OPS_WEBHOOK_URL: "https://agent.example/hook", OPS_WEBHOOK_SECRET: SECRET, OPS_WEBHOOK_MAX_ATTEMPTS: "3" });
    const calls: { headers: Headers; body: string }[] = [];
    let fail = true;
    vi.stubGlobal("fetch", async (_url: string, init: RequestInit) => {
      calls.push({ headers: new Headers(init.headers), body: String(init.body) });
      return new Response(null, { status: fail ? 500 : 200 });
    });

    const first = (await emitWebhook("order.paid", { order_id: "o1" }))!;
    expect(first.status).toBe("retrying");
    expect(first.attempts).toBe(1);
    expect(verifyWebhookSignature(SECRET, calls[0].headers.get("Matocha-Signature"), calls[0].body)).toBe(true);
    expect(nextAttemptDelayMs(2)).toBe(2 * nextAttemptDelayMs(1));

    fail = false;
    await retryDueWebhooks(new Date(Date.now() + 10 * 60_000));
    const row = await getStore()!.get<DeliveryRow>("webhook_deliveries", first.id);
    expect(row?.status).toBe("delivered");
    expect(row?.attempts).toBe(2);
  });

  it("gives up after the maximum number of attempts", async () => {
    setupEnv({ OPS_WEBHOOK_URL: "https://agent.example/hook", OPS_WEBHOOK_SECRET: SECRET, OPS_WEBHOOK_MAX_ATTEMPTS: "2" });
    vi.stubGlobal("fetch", async () => new Response(null, { status: 503 }));
    const first = (await emitWebhook("stock.low", {}))!;
    await retryDueWebhooks(new Date(Date.now() + 3600_000));
    const row = await getStore()!.get<DeliveryRow>("webhook_deliveries", first.id);
    expect(row?.status).toBe("failed");
  });
});
