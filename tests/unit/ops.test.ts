import { beforeEach, describe, expect, it } from "vitest";
import { getCatalog } from "@/lib/catalog";
import { decideChangeRequest, type ChangeRequestRow } from "@/lib/ops/changes";
import { handleOpsRequest } from "@/lib/ops/router";
import { revokeApiToken } from "@/lib/ops/tokens";
import { getStore } from "@/lib/store";
import { getSiteMode } from "@/lib/mode";
import { opsRequest, setupEnv, token } from "./helpers";

async function call(method: string, path: string, init: Parameters<typeof opsRequest>[2] = {}) {
  const { request, segments } = opsRequest(method, path, init);
  const response = await handleOpsRequest(request, segments);
  const text = await response.text();
  let body: unknown = text;
  try {
    body = JSON.parse(text);
  } catch {
    /* CSV */
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- loose JSON in assertions
  return { status: response.status, body: body as Record<string, any>, headers: response.headers };
}

const ALL = [
  "catalog:read",
  "catalog:write",
  "content:read",
  "content:write",
  "leads:read",
  "leads:write",
  "orders:read",
  "orders:write",
  "media:write",
  "analytics:read",
  "settings:propose",
] as const;

beforeEach(() => setupEnv());

describe("authentication", () => {
  it("health is public and reports prelaunch", async () => {
    const res = await call("GET", "/health");
    expect(res.status).toBe(200);
    expect(res.body.mode).toBe("prelaunch");
  });

  it("rejects a missing token", async () => {
    const res = await call("GET", "/catalog");
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("unauthorized");
  });

  it("rejects an invalid token", async () => {
    const res = await call("GET", "/catalog", { token: "mto_nope" });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("invalid_token");
  });

  it("rejects an expired token", async () => {
    const { token: t, row } = await token(["catalog:read"]);
    await getStore()!.update("api_tokens", row.id, { expires_at: new Date(Date.now() - 1000).toISOString() });
    const res = await call("GET", "/catalog", { token: t });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("token_expired");
  });

  it("rejects a revoked token", async () => {
    const { token: t, row } = await token(["catalog:read"]);
    await revokeApiToken(row.id);
    const res = await call("GET", "/catalog", { token: t });
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe("token_revoked");
  });

  it("stores only the hash of the token", async () => {
    const { token: t, row } = await token(["catalog:read"]);
    const stored = await getStore()!.get("api_tokens", row.id);
    expect(JSON.stringify(stored)).not.toContain(t);
  });
});

describe("scopes", () => {
  it("refuses a call outside the token's scopes with 403", async () => {
    const { token: t } = await token(["catalog:read"]);
    const res = await call("GET", "/leads", { token: t });
    expect(res.status).toBe(403);
    expect(res.body.error.code).toBe("insufficient_scope");
    const ok = await call("GET", "/catalog", { token: t });
    expect(ok.status).toBe(200);
  });

  it("refuses writes with a read-only scope", async () => {
    const { token: t } = await token(["catalog:read"]);
    const res = await call("PATCH", "/catalog/packs/poudre-decouverte/price", { token: t, body: { price: 9 } });
    expect(res.status).toBe(403);
  });
});

describe("idempotency", () => {
  it("requires Idempotency-Key on writes", async () => {
    const { token: t } = await token(["catalog:write"]);
    const res = await call("PATCH", "/catalog/packs/poudre-decouverte/price", {
      token: t,
      body: { price: 9.9 },
      idem: null,
    });
    expect(res.status).toBe(400);
    expect(res.body.error.code).toBe("idempotency_key_required");
  });

  it("replays the same response and creates a single change request", async () => {
    const { token: t } = await token(["catalog:write"]);
    const first = await call("PATCH", "/catalog/packs/poudre-decouverte/price", { token: t, body: { price: 9.9 }, idem: "abc" });
    const second = await call("PATCH", "/catalog/packs/poudre-decouverte/price", { token: t, body: { price: 9.9 }, idem: "abc" });
    expect(first.status).toBe(202);
    expect(second.status).toBe(202);
    expect(second.body).toEqual(first.body);
    expect(second.headers.get("Idempotent-Replayed")).toBe("true");
    const crs = await getStore()!.list("change_requests");
    expect(crs).toHaveLength(1);
  });

  it("rejects a key reused for a different request", async () => {
    const { token: t } = await token(["catalog:write"]);
    await call("PATCH", "/catalog/packs/poudre-decouverte/price", { token: t, body: { price: 9.9 }, idem: "same" });
    const res = await call("PATCH", "/catalog/packs/poudre-decouverte/price", { token: t, body: { price: 12 }, idem: "same" });
    expect(res.status).toBe(422);
    expect(res.body.error.code).toBe("idempotency_key_reused");
  });
});

describe("rate limiting", () => {
  it("returns 429 past the per-minute limit", async () => {
    setupEnv({ OPS_RATE_LIMIT_PER_MIN: "3" });
    const { token: t } = await token(["catalog:read"]);
    for (let i = 0; i < 3; i++) expect((await call("GET", "/catalog", { token: t })).status).toBe(200);
    const res = await call("GET", "/catalog", { token: t });
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBeTruthy();
  });
});

describe("change requests (human validation)", () => {
  async function pendingKinds() {
    return (await getStore()!.list<ChangeRequestRow>("change_requests")).map((c) => c.kind).sort();
  }

  it("creates a change_request for every action that needs validation", async () => {
    const { token: t } = await token([...ALL]);
    const store = getStore()!;
    await store.insert("orders", {
      id: "ord_1",
      status: "paid",
      amount_total_cents: 2000,
      payment_intent_id: "pi_1",
      created_at: new Date().toISOString(),
    });
    const block = await call("POST", "/content/blocks", { token: t, body: { key: "faq.test", kind: "faq", body: "Texte" } });
    expect(block.status).toBe(201);

    const responses = await Promise.all([
      call("POST", "/catalog/recipes/poudre-original/proofs", {
        token: t,
        body: { field: "origin", value: "Japon", source: "COA lot 1" },
      }),
      call("PATCH", "/catalog/packs/poudre-decouverte/price", { token: t, body: { price: 9.9 } }),
      call("POST", "/catalog/packs/poudre-decouverte/status", { token: t, body: { status: "available" } }),
      call("POST", `/content/blocks/${block.body.id}/publish`, { token: t }),
      call("POST", "/orders/ord_1/refunds", { token: t, body: { reason: "Colis abîmé" } }),
      call("POST", "/media/incoming", {
        token: t,
        body: {
          id: "hero-pour-poudre-desktop",
          status: "concept",
          kind: "video",
          source: "génération IA",
          license: { name: "Interne", commercialUse: true },
          files: { desktop: "https://cdn.example/hero.mp4" },
          alt: "Stick versé dans un verre de lait",
        },
      }),
      call("POST", "/settings/mode", { token: t, body: { mode: "sale" } }),
    ]);
    for (const r of responses) expect(r.status, JSON.stringify(r.body)).toBe(202);
    expect(await pendingKinds()).toEqual(
      ["content.publish", "media.publish", "order.refund", "pack.price", "pack.status", "recipe.proof", "settings.mode"].sort(),
    );
    /* Nothing changed before approval. */
    const catalog = await getCatalog();
    expect(catalog.packs.find((p) => p.key === "poudre-decouverte")!.price.status).toBe("to_confirm");
  });

  it("applies non-sensitive status changes directly", async () => {
    const { token: t } = await token(["catalog:write"]);
    const res = await call("POST", "/catalog/packs/poudre-quotidien/status", { token: t, body: { status: "preorder" } });
    expect(res.status).toBe(200);
    expect((await getCatalog()).packs.find((p) => p.key === "poudre-quotidien")!.commercialStatus).toBe("preorder");
    expect(await getStore()!.list("change_requests")).toHaveLength(0);
  });

  it("PATCH never confirms a Proof field", async () => {
    const { token: t } = await token(["catalog:write"]);
    const bad = await call("PATCH", "/catalog/recipes/poudre-original", {
      token: t,
      body: { fields: { origin: { value: "Japon", status: "confirmed" } } },
    });
    expect(bad.status).toBe(422);
    const ok = await call("PATCH", "/catalog/recipes/poudre-original", {
      token: t,
      body: { fields: { origin: { value: "Japon", target: "Japon, à confirmer" }, description: "Nouveau texte" } },
    });
    expect(ok.status).toBe(200);
    const recipe = (await getCatalog()).recipes.find((r) => r.key === "poudre-original")!;
    expect(recipe.origin.status).toBe("to_confirm");
    expect(recipe.description).toBe("Nouveau texte");
  });

  it("approve → applied updates the catalogue; reject leaves it", async () => {
    const { token: t } = await token(["catalog:write"]);
    const res = await call("PATCH", "/catalog/packs/poudre-decouverte/price", { token: t, body: { price: 9.9, source: "Devis" } });
    const applied = await decideChangeRequest(res.body.change_request.id, "approve", "david@matocha.test");
    expect(applied.status).toBe("applied");
    const pack = (await getCatalog()).packs.find((p) => p.key === "poudre-decouverte")!;
    expect(pack.price).toMatchObject({ value: 9.9, status: "confirmed" });

    const res2 = await call("POST", "/catalog/recipes/poudre-original/proofs", {
      token: t,
      body: { field: "origin", value: "Japon", source: "COA" },
    });
    const rejected = await decideChangeRequest(res2.body.change_request.id, "reject", "david@matocha.test", "Pas de COA");
    expect(rejected.status).toBe("rejected");
    expect((await getCatalog()).recipes.find((r) => r.key === "poudre-original")!.origin.status).toBe("to_confirm");
    await expect(decideChangeRequest(res2.body.change_request.id, "approve", "x")).rejects.toThrow();
  });

  it("the agent can follow its change request", async () => {
    const { token: t } = await token(["catalog:write", "catalog:read"]);
    const res = await call("PATCH", "/catalog/packs/poudre-decouverte/price", { token: t, body: { price: 5 } });
    const follow = await call("GET", `/change-requests/${res.body.change_request.id}`, { token: t });
    expect(follow.status).toBe(200);
    expect(follow.body.status).toBe("pending");
  });
});

describe("sale mode checklist", () => {
  it("blocks the switch to sale while the checklist fails", async () => {
    setupEnv({ SITE_MODE_SALE_UNLOCK: "true" });
    const { token: t } = await token(["settings:propose"]);
    const res = await call("POST", "/settings/mode", { token: t, body: { mode: "sale" } });
    expect(res.status).toBe(202);
    expect(res.body.checklist.ok).toBe(false);
    const decided = await decideChangeRequest(res.body.change_request.id, "approve", "david@matocha.test");
    expect(decided.status).toBe("failed");
    expect(decided.error).toMatch(/Checklist bloquante/);
    expect(await getSiteMode()).toBe("prelaunch");
  });

  it("stays prelaunch without the deployment unlock even if the setting says sale", async () => {
    await getStore()!.upsert("settings", { id: "site_mode", value: "sale", updated_at: new Date().toISOString() });
    expect(await getSiteMode()).toBe("prelaunch");
  });
});

describe("leads", () => {
  it("lists and exports confirmed leads only, and tags them", async () => {
    const store = getStore()!;
    const base = {
      interests: ["poudre"],
      tags: [],
      source: "home",
      consent_version: "v1",
      consent_text: "x",
      ip_hash: null,
      confirm_token_hash: null,
      unsubscribe_token_hash: "h",
      created_at: new Date().toISOString(),
      unsubscribed_at: null,
      last_email_sent_at: null,
    };
    await store.insert("leads", { ...base, id: "l1", email: "a@ex.fr", status: "confirmed", confirmed_at: new Date().toISOString() });
    await store.insert("leads", { ...base, id: "l2", email: "=cmd@ex.fr", status: "confirmed", confirmed_at: new Date().toISOString() });
    await store.insert("leads", { ...base, id: "l3", email: "b@ex.fr", status: "pending", confirmed_at: null });
    const { token: t } = await token(["leads:read", "leads:write"]);

    const list = await call("GET", "/leads", { token: t });
    expect(list.body.count).toBe(2);
    const csv = await call("GET", "/leads/export", { token: t });
    expect(csv.headers.get("Content-Type")).toContain("text/csv");
    expect(String(csv.body)).toContain("a@ex.fr");
    expect(String(csv.body)).not.toContain("b@ex.fr");
    expect(String(csv.body)).toContain("'=cmd@ex.fr");

    const tagged = await call("PATCH", "/leads/l1/tags", { token: t, body: { add: ["goût:fraise"] } });
    expect(tagged.status).toBe(422);
    const ok = await call("PATCH", "/leads/l1/tags", { token: t, body: { add: ["test-fraise"] } });
    expect(ok.body.tags).toEqual(["test-fraise"]);
  });
});

describe("audit", () => {
  it("logs every call, including refused ones", async () => {
    const { token: t } = await token(["catalog:read"]);
    await call("GET", "/catalog", { token: t });
    await call("GET", "/leads", { token: t });
    await call("GET", "/catalog");
    const rows = await getStore()!.list<{ status: number; id: string }>("audit_log");
    expect(rows.map((r) => r.status).sort()).toEqual([200, 401, 403]);
  });
});
