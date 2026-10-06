import "server-only";
import { randomUUID } from "node:crypto";
import { getCommerceProvider } from "@/lib/commerce/provider";
import { getStore } from "@/lib/store";
import type { Row } from "@/lib/store/types";
import { audit } from "./audit";
import { saleChecklist } from "./checklist";
import { nowIso } from "./crypto";
import { OpsError } from "./errors";
import { patchOverride } from "./overrides";
import { revalidateSite } from "./revalidate";
import { setSetting } from "./settings";
import { emitWebhook } from "./webhooks";

export const CHANGE_KINDS = [
  "recipe.proof",
  "pack.price",
  "pack.status",
  "content.publish",
  "order.refund",
  "media.publish",
  "settings.mode",
] as const;
export type ChangeKind = (typeof CHANGE_KINDS)[number];

export type ChangeRequestRow = Row & {
  kind: ChangeKind;
  target: string;
  summary: string;
  payload: Record<string, unknown>;
  before: unknown;
  status: "pending" | "approved" | "rejected" | "applied" | "failed";
  requested_by: string;
  token_id: string | null;
  created_at: string;
  decided_by: string | null;
  decided_at: string | null;
  decision_note: string | null;
  applied_at: string | null;
  error: string | null;
};

const requireStore = () => {
  const store = getStore();
  if (!store) throw new OpsError(503, "storage_not_configured", "Le stockage n'est pas configuré.");
  return store;
};

export async function createChangeRequest(input: {
  kind: ChangeKind;
  target: string;
  summary: string;
  payload: Record<string, unknown>;
  before: unknown;
  requestedBy: string;
  tokenId: string | null;
}) {
  return requireStore().insert<ChangeRequestRow>("change_requests", {
    id: randomUUID(),
    kind: input.kind,
    target: input.target,
    summary: input.summary,
    payload: input.payload,
    before: input.before ?? null,
    status: "pending",
    requested_by: input.requestedBy,
    token_id: input.tokenId,
    created_at: nowIso(),
    decided_by: null,
    decided_at: null,
    decision_note: null,
    applied_at: null,
    error: null,
  });
}

export async function listChangeRequests(status?: ChangeRequestRow["status"]) {
  const store = getStore();
  if (!store) return [];
  return store.list<ChangeRequestRow>("change_requests", {
    filter: status ? { status } : undefined,
    orderBy: { column: "created_at", ascending: false },
  });
}

async function apply(cr: ChangeRequestRow): Promise<void> {
  const store = requireStore();
  const p = cr.payload;
  switch (cr.kind) {
    case "recipe.proof": {
      await patchOverride("recipe", cr.target, {
        [String(p.field)]: {
          value: p.value,
          status: "confirmed",
          source: p.source,
          verifiedAt: p.verifiedAt ?? nowIso().slice(0, 10),
        },
      });
      break;
    }
    case "pack.price": {
      await patchOverride("pack", cr.target, {
        price: { value: p.price, status: "confirmed", source: p.source, verifiedAt: nowIso().slice(0, 10) },
      });
      break;
    }
    case "pack.status": {
      await patchOverride("pack", cr.target, { commercialStatus: p.status });
      break;
    }
    case "content.publish": {
      const updated = await store.update("content_blocks", cr.target, {
        status: "published",
        published_at: nowIso(),
        updated_at: nowIso(),
      });
      if (!updated) throw new Error("Bloc de contenu introuvable.");
      break;
    }
    case "media.publish": {
      const updated = await store.update("media_items", cr.target, {
        publish_status: "published",
        updated_at: nowIso(),
      });
      if (!updated) throw new Error("Média introuvable.");
      break;
    }
    case "order.refund": {
      const order = await store.get<Row & { payment_intent_id: string | null; status: string }>("orders", cr.target);
      if (!order) throw new Error("Commande introuvable.");
      if (!order.payment_intent_id) throw new Error("Aucun paiement associé à cette commande.");
      const refund = await getCommerceProvider().refund({
        paymentIntentId: order.payment_intent_id,
        amountCents: typeof p.amount_cents === "number" ? p.amount_cents : undefined,
        idempotencyKey: `refund-${cr.id}`,
      });
      await store.update("orders", order.id, {
        status: "refunded",
        refund_id: refund.id,
        updated_at: nowIso(),
      });
      break;
    }
    case "settings.mode": {
      if (p.mode === "sale") {
        const checklist = await saleChecklist();
        if (!checklist.ok) {
          const failing = checklist.items.filter((i) => !i.ok).map((i) => i.label);
          throw new Error(`Checklist bloquante : ${failing.join(" ; ")}`);
        }
      }
      await setSetting("site_mode", p.mode === "sale" ? "sale" : "prelaunch");
      break;
    }
  }
}

/**
 * Human decision on a change request (admin only).
 * approve: pending → approved → applied (or failed with the reason).
 */
export async function decideChangeRequest(
  id: string,
  decision: "approve" | "reject",
  decidedBy: string,
  note?: string,
) {
  const store = requireStore();
  const cr = await store.get<ChangeRequestRow>("change_requests", id);
  if (!cr) throw new OpsError(404, "not_found", "Demande introuvable.");
  if (cr.status !== "pending") {
    throw new OpsError(409, "already_decided", "Cette demande a déjà été traitée.");
  }
  const decidedAt = nowIso();
  let result: ChangeRequestRow;

  if (decision === "reject") {
    result = (await store.update<ChangeRequestRow>("change_requests", id, {
      status: "rejected",
      decided_by: decidedBy,
      decided_at: decidedAt,
      decision_note: note ?? null,
    }))!;
  } else {
    await store.update<ChangeRequestRow>("change_requests", id, {
      status: "approved",
      decided_by: decidedBy,
      decided_at: decidedAt,
      decision_note: note ?? null,
    });
    try {
      await apply(cr);
      result = (await store.update<ChangeRequestRow>("change_requests", id, {
        status: "applied",
        applied_at: nowIso(),
      }))!;
      await revalidateSite();
    } catch (error) {
      result = (await store.update<ChangeRequestRow>("change_requests", id, {
        status: "failed",
        error: error instanceof Error ? error.message : String(error),
      }))!;
    }
  }

  await audit({
    actor: `admin:${decidedBy}`,
    token_id: null,
    action: `change_request.${decision}`,
    method: null,
    route: null,
    status: null,
    before: { status: cr.status },
    after: { status: result.status, error: result.error },
  });
  await emitWebhook("change_request.decided", {
    change_request_id: id,
    kind: cr.kind,
    target: cr.target,
    status: result.status,
    decided_by: decidedBy,
    note: note ?? null,
    error: result.error,
  });
  return result;
}
