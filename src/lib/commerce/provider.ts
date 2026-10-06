import "server-only";
import { StripeProvider } from "./stripe";

/**
 * Commerce abstraction. Components and routes talk to this interface only, so
 * Stripe can be swapped (or Shopify headless adopted) without touching the UI.
 * Every call is still gated upstream by `getSiteMode()` and `resolveCta()`.
 */

export type CheckoutLine = {
  packKey: string;
  name: string;
  /** TTC, in cents. */
  unitAmountCents: number;
  quantity: number;
};

export type CheckoutSession = {
  id: string;
  url: string | null;
  status: "open" | "complete" | "expired";
  paymentStatus: "paid" | "unpaid" | "no_payment_required";
  amountTotalCents: number | null;
  currency: string | null;
  customerEmail: string | null;
  paymentIntentId: string | null;
  metadata: Record<string, string>;
};

export type CommerceEvent =
  | { type: "checkout.completed"; session: CheckoutSession }
  | { type: "payment.failed"; sessionId: string | null; paymentIntentId: string | null; reason: string | null }
  | { type: "ignored"; rawType: string };

export interface CommerceProvider {
  readonly kind: "stripe" | "not_configured";
  readonly configured: boolean;
  createCheckout(input: {
    lines: CheckoutLine[];
    successUrl: string;
    cancelUrl: string;
    idempotencyKey: string;
    metadata?: Record<string, string>;
  }): Promise<CheckoutSession>;
  getCheckoutSession(id: string): Promise<CheckoutSession>;
  /** Verifies the signature, then normalises the event. Throws on bad signature. */
  handleWebhook(rawBody: string, signatureHeader: string | null): Promise<CommerceEvent>;
  refund(input: { paymentIntentId: string; amountCents?: number; idempotencyKey: string }): Promise<{ id: string; status: string }>;
}

export class CommerceNotConfiguredError extends Error {
  constructor() {
    super("Le paiement n'est pas configuré (STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET).");
  }
}

class NotConfiguredProvider implements CommerceProvider {
  readonly kind = "not_configured" as const;
  readonly configured = false;
  async createCheckout(): Promise<CheckoutSession> {
    throw new CommerceNotConfiguredError();
  }
  async getCheckoutSession(): Promise<CheckoutSession> {
    throw new CommerceNotConfiguredError();
  }
  async handleWebhook(): Promise<CommerceEvent> {
    throw new CommerceNotConfiguredError();
  }
  async refund(): Promise<{ id: string; status: string }> {
    throw new CommerceNotConfiguredError();
  }
}

export function isPaymentConfigured() {
  return !!process.env.STRIPE_SECRET_KEY && !!process.env.STRIPE_WEBHOOK_SECRET;
}

export function getCommerceProvider(): CommerceProvider {
  const key = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (key && webhookSecret) return new StripeProvider(key, webhookSecret);
  return new NotConfiguredProvider();
}
