import { beforeEach, describe, expect, it } from "vitest";
import { POST as checkout } from "@/app/api/checkout/route";
import { POST as stripeWebhook } from "@/app/api/stripe/webhook/route";
import { getStore } from "@/lib/store";
import { setupEnv } from "./helpers";

const req = (body: unknown) =>
  new Request("https://matocha.test/api/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json", "Idempotency-Key": "click-1" },
    body: JSON.stringify(body),
  });

const line = { lines: [{ packKey: "poudre-daily-box", recipeKey: "poudre-original", quantity: 1 }] };

beforeEach(() => setupEnv({ STRIPE_SECRET_KEY: "sk_test_x", STRIPE_WEBHOOK_SECRET: "whsec_x" }));

describe("checkout lock", () => {
  it("refuses checkout in prelaunch even with payment configured", async () => {
    const res = await checkout(req(line));
    expect(res.status).toBe(403);
    expect((await res.json()).code).toBe("sales_closed");
  });

  it("refuses in sale mode when the CTA resolver does not answer buy", async () => {
    setupEnv({ SITE_MODE_SALE_UNLOCK: "true", STRIPE_SECRET_KEY: "sk_test_x", STRIPE_WEBHOOK_SECRET: "whsec_x" });
    await getStore()!.upsert("settings", { id: "site_mode", value: "sale", updated_at: new Date().toISOString() });
    const res = await checkout(req(line));
    expect(res.status).toBe(409);
    expect((await res.json()).code).toBe("not_purchasable");
  });

  it("refuses the Stripe webhook outside sale mode", async () => {
    const res = await stripeWebhook(new Request("https://matocha.test/api/stripe/webhook", { method: "POST", body: "{}" }));
    expect(res.status).toBe(503);
  });
});
