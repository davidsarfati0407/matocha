import "server-only";
import { executeOperation, type Args } from "./service";

/**
 * REST routing for /api/ops/v1. Each route maps to a named operation of the
 * service layer; path params, query string and JSON body are merged into args.
 */
type Route = { method: string; pattern: string; op: string };

export const ROUTES: Route[] = [
  { method: "GET", pattern: "/health", op: "health" },
  { method: "GET", pattern: "/catalog", op: "catalog_get" },
  { method: "GET", pattern: "/catalog/packs/:id", op: "catalog_pack_get" },
  { method: "PATCH", pattern: "/catalog/recipes/:id", op: "catalog_recipe_patch" },
  { method: "POST", pattern: "/catalog/recipes/:id/proofs", op: "catalog_recipe_proof_confirm" },
  { method: "PATCH", pattern: "/catalog/packs/:id/price", op: "catalog_pack_price" },
  { method: "POST", pattern: "/catalog/packs/:id/status", op: "catalog_pack_status" },
  { method: "GET", pattern: "/content/blocks", op: "content_list" },
  { method: "POST", pattern: "/content/blocks", op: "content_create" },
  { method: "POST", pattern: "/content/blocks/:id/publish", op: "content_publish" },
  { method: "GET", pattern: "/leads", op: "leads_list" },
  { method: "GET", pattern: "/leads/export", op: "leads_export" },
  { method: "PATCH", pattern: "/leads/:id/tags", op: "leads_tags" },
  { method: "GET", pattern: "/orders", op: "orders_list" },
  { method: "GET", pattern: "/orders/:id", op: "orders_get" },
  { method: "POST", pattern: "/orders/:id/shipments", op: "orders_shipment_create" },
  { method: "POST", pattern: "/orders/:id/refunds", op: "orders_refund_request" },
  { method: "POST", pattern: "/media/incoming", op: "media_incoming" },
  { method: "GET", pattern: "/analytics/summary", op: "analytics_summary" },
  { method: "POST", pattern: "/settings/mode", op: "settings_mode_propose" },
  { method: "GET", pattern: "/change-requests/:id", op: "change_request_get" },
];

function match(pattern: string, path: string): Record<string, string> | null {
  const p = pattern.split("/").filter(Boolean);
  const s = path.split("/").filter(Boolean);
  if (p.length !== s.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < p.length; i++) {
    if (p[i].startsWith(":")) params[p[i].slice(1)] = decodeURIComponent(s[i]);
    else if (p[i] !== s[i]) return null;
  }
  return params;
}

const json = (status: number, body: unknown, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", ...headers },
  });

export async function handleOpsRequest(request: Request, segments: string[]): Promise<Response> {
  const path = `/${segments.join("/")}`;
  const candidates = ROUTES.map((r) => ({ r, params: match(r.pattern, path) })).filter((c) => c.params);
  if (candidates.length === 0) {
    return json(404, { error: { code: "not_found", message: "Route inconnue." } });
  }
  const hit = candidates.find((c) => c.r.method === request.method);
  if (!hit) {
    return json(
      405,
      { error: { code: "method_not_allowed", message: "Méthode non autorisée." } },
      { Allow: candidates.map((c) => c.r.method).join(", ") },
    );
  }

  const url = new URL(request.url);
  let body: Args = {};
  if (request.method !== "GET") {
    const text = await request.text();
    if (text) {
      try {
        const parsed = JSON.parse(text);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error();
        body = parsed as Args;
      } catch {
        return json(400, { error: { code: "invalid_json", message: "Corps JSON invalide." } });
      }
    }
  }
  const args: Args = { ...Object.fromEntries(url.searchParams), ...body, ...hit.params };

  const result = await executeOperation({
    name: hit.r.op,
    args,
    authorization: request.headers.get("authorization"),
    idempotencyKey: request.headers.get("idempotency-key"),
    method: request.method,
    route: `/api/ops/v1${hit.r.pattern}`,
  });

  if (result.contentType && typeof result.body === "string") {
    return new Response(result.body, {
      status: result.status,
      headers: {
        "Content-Type": result.contentType,
        "Content-Disposition": 'attachment; filename="matocha-waitlist.csv"',
        "Cache-Control": "no-store",
        ...result.headers,
      },
    });
  }
  return json(result.status, result.body, result.headers);
}
