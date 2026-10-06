import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  CheckoutLine,
  CheckoutSession,
  CommerceEvent,
  CommerceProvider,
} from "./provider";

const API = "https://api.stripe.com/v1";

/** Flattens nested params into Stripe's form encoding (a[b][0][c]=…). */
function encode(params: Record<string, unknown>, prefix = ""): string[] {
  const out: string[] = [];
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) continue;
    const name = prefix ? `${prefix}[${key}]` : key;
    if (typeof value === "object") {
      out.push(...encode(value as Record<string, unknown>, name));
    } else {
      out.push(`${encodeURIComponent(name)}=${encodeURIComponent(String(value))}`);
    }
  }
  return out;
}

type StripeSession = {
  id: string;
  url: string | null;
  status: CheckoutSession["status"];
  payment_status: CheckoutSession["paymentStatus"];
  amount_total: number | null;
  currency: string | null;
  customer_details?: { email?: string | null } | null;
  payment_intent: string | null;
  metadata: Record<string, string> | null;
};

const normalise = (s: StripeSession): CheckoutSession => ({
  id: s.id,
  url: s.url,
  status: s.status,
  paymentStatus: s.payment_status,
  amountTotalCents: s.amount_total,
  currency: s.currency,
  customerEmail: s.customer_details?.email ?? null,
  paymentIntentId: typeof s.payment_intent === "string" ? s.payment_intent : null,
  metadata: s.metadata ?? {},
});

/** Stripe-Signature: t=…,v1=… — HMAC-SHA256 of "<t>.<payload>". */
export function verifyStripeSignature(
  secret: string,
  header: string | null,
  payload: string,
  toleranceSeconds = 300,
  now = Math.floor(Date.now() / 1000),
) {
  if (!header) return false;
  let timestamp = NaN;
  const signatures: string[] = [];
  for (const part of header.split(",")) {
    const [k, v] = part.split("=");
    if (k === "t") timestamp = Number(v);
    if (k === "v1" && v) signatures.push(v);
  }
  if (!Number.isFinite(timestamp) || Math.abs(now - timestamp) > toleranceSeconds) return false;
  const expected = createHmac("sha256", secret).update(`${timestamp}.${payload}`).digest("hex");
  return signatures.some(
    (s) => s.length === expected.length && timingSafeEqual(Buffer.from(s), Buffer.from(expected)),
  );
}

/** Stripe Checkout (hosted) over the REST API — no SDK. */
export class StripeProvider implements CommerceProvider {
  readonly kind = "stripe" as const;
  readonly configured = true;

  constructor(
    private readonly secretKey: string,
    private readonly webhookSecret: string,
  ) {}

  private async call<T>(path: string, init: { method: "GET" | "POST"; body?: Record<string, unknown>; idempotencyKey?: string }) {
    const response = await fetch(`${API}${path}`, {
      method: init.method,
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
        ...(init.idempotencyKey ? { "Idempotency-Key": init.idempotencyKey } : {}),
      },
      body: init.body ? encode(init.body).join("&") : undefined,
      cache: "no-store",
    });
    const json = (await response.json()) as T & { error?: { message?: string } };
    if (!response.ok) throw new Error(`Stripe ${response.status}: ${json.error?.message ?? "erreur"}`);
    return json;
  }

  async createCheckout(input: {
    lines: CheckoutLine[];
    successUrl: string;
    cancelUrl: string;
    idempotencyKey: string;
    metadata?: Record<string, string>;
  }) {
    const line_items = Object.fromEntries(
      input.lines.map((line, i) => [
        i,
        {
          quantity: line.quantity,
          price_data: {
            currency: "eur",
            unit_amount: line.unitAmountCents,
            product_data: { name: line.name, metadata: { pack_key: line.packKey } },
          },
        },
      ]),
    );
    const session = await this.call<StripeSession>("/checkout/sessions", {
      method: "POST",
      idempotencyKey: input.idempotencyKey,
      body: {
        mode: "payment",
        locale: "fr",
        success_url: input.successUrl,
        cancel_url: input.cancelUrl,
        line_items,
        metadata: input.metadata ?? {},
      },
    });
    return normalise(session);
  }

  async getCheckoutSession(id: string) {
    return normalise(await this.call<StripeSession>(`/checkout/sessions/${encodeURIComponent(id)}`, { method: "GET" }));
  }

  async handleWebhook(rawBody: string, signatureHeader: string | null): Promise<CommerceEvent> {
    if (!verifyStripeSignature(this.webhookSecret, signatureHeader, rawBody)) {
      throw new Error("Signature Stripe invalide.");
    }
    const event = JSON.parse(rawBody) as { type: string; data: { object: Record<string, unknown> } };
    const object = event.data.object;
    switch (event.type) {
      case "checkout.session.completed":
      case "checkout.session.async_payment_succeeded":
        return { type: "checkout.completed", session: normalise(object as unknown as StripeSession) };
      case "checkout.session.async_payment_failed":
        return {
          type: "payment.failed",
          sessionId: String(object.id ?? ""),
          paymentIntentId: (object.payment_intent as string) ?? null,
          reason: null,
        };
      case "payment_intent.payment_failed":
        return {
          type: "payment.failed",
          sessionId: null,
          paymentIntentId: String(object.id ?? ""),
          reason: ((object.last_payment_error as { message?: string } | null)?.message) ?? null,
        };
      default:
        return { type: "ignored", rawType: event.type };
    }
  }

  async refund(input: { paymentIntentId: string; amountCents?: number; idempotencyKey: string }) {
    const refund = await this.call<{ id: string; status: string }>("/refunds", {
      method: "POST",
      idempotencyKey: input.idempotencyKey,
      body: { payment_intent: input.paymentIntentId, amount: input.amountCents },
    });
    return { id: refund.id, status: refund.status };
  }
}
