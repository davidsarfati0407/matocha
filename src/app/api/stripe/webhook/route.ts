import { getCommerceProvider } from "@/lib/commerce/provider";
import { getSiteMode } from "@/lib/mode";
import { nowIso } from "@/lib/ops/crypto";
import { emitWebhook } from "@/lib/ops/webhooks";
import { getStore } from "@/lib/store";
import type { Row } from "@/lib/store/types";

type OrderRow = Row & { status: string; checkout_session_id: string | null; payment_intent_id: string | null };

/**
 * Stripe webhook. Refused (503) outside sale mode: Stripe retries for up to
 * three days, so nothing is lost if the mode is briefly switched back.
 * Orders become "paid" only here, after Stripe's signed confirmation.
 */
export async function POST(request: Request) {
  if ((await getSiteMode()) !== "sale") {
    return Response.json({ received: false, reason: "sales_closed" }, { status: 503 });
  }
  const provider = getCommerceProvider();
  const store = getStore();
  if (!provider.configured || !store) {
    return Response.json({ received: false, reason: "not_configured" }, { status: 503 });
  }

  const raw = await request.text();
  let event;
  try {
    event = await provider.handleWebhook(raw, request.headers.get("stripe-signature"));
  } catch {
    return Response.json({ received: false, reason: "invalid_signature" }, { status: 400 });
  }

  if (event.type === "checkout.completed" && event.session.paymentStatus === "paid") {
    const orderId = event.session.metadata.order_id;
    const order = orderId ? await store.get<OrderRow>("orders", orderId) : null;
    if (order && order.status === "pending") {
      await store.update("orders", order.id, {
        status: "paid",
        email: event.session.customerEmail,
        payment_intent_id: event.session.paymentIntentId,
        amount_total_cents: event.session.amountTotalCents,
        paid_at: nowIso(),
        updated_at: nowIso(),
      });
      await emitWebhook("order.paid", {
        order_id: order.id,
        amount_total_cents: event.session.amountTotalCents,
        currency: event.session.currency,
      });
    }
  }

  if (event.type === "payment.failed") {
    const orders = await store.list<OrderRow>("orders", {
      filter: event.sessionId
        ? { checkout_session_id: event.sessionId }
        : { payment_intent_id: event.paymentIntentId },
      limit: 1,
    });
    const order = orders[0];
    if (order && order.status === "pending") {
      await store.update("orders", order.id, { status: "payment_failed", updated_at: nowIso() });
    }
    await emitWebhook("order.payment_failed", {
      order_id: order?.id ?? null,
      reason: event.reason,
    });
  }

  return Response.json({ received: true });
}
