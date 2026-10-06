import "server-only";
import { executeOperation, OPERATIONS } from "./service";

/**
 * Minimal, stateless MCP server (Streamable HTTP transport, JSON responses).
 * Tools mirror the Ops operations and run through the same pipeline: Bearer
 * auth, scopes, rate limit, idempotency (via the `idempotency_key` argument on
 * write tools) and audit.
 */

const PROTOCOL_VERSION = "2025-06-18";

type JsonRpcRequest = { jsonrpc: "2.0"; id?: string | number | null; method: string; params?: Record<string, unknown> };

const rpcResult = (id: JsonRpcRequest["id"], result: unknown) => ({ jsonrpc: "2.0", id: id ?? null, result });
const rpcError = (id: JsonRpcRequest["id"], code: number, message: string) => ({
  jsonrpc: "2.0",
  id: id ?? null,
  error: { code, message },
});

const tools = OPERATIONS.map((op) => {
  const schema = structuredClone(op.input) as { properties?: Record<string, unknown>; required?: string[] };
  if (op.write) {
    schema.properties = {
      ...(schema.properties ?? {}),
      idempotency_key: { type: "string", description: "Clé d'idempotence unique pour cette écriture (obligatoire)." },
    };
    schema.required = [...(schema.required ?? []), "idempotency_key"];
  }
  return {
    name: op.name,
    description: `${op.description}${op.scope !== "public" ? ` Scope : ${op.scope}.` : ""}`,
    inputSchema: schema,
    annotations: { readOnlyHint: !op.write },
  };
});

async function handleMessage(message: JsonRpcRequest, authorization: string | null) {
  switch (message.method) {
    case "initialize":
      return rpcResult(message.id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: { listChanged: false } },
        serverInfo: { name: "matocha-ops", version: "1.0.0" },
        instructions:
          "Outils opérationnels Matocha. Les écritures exigent idempotency_key. Les actions sensibles créent une demande de validation humaine (statut 202) : suivez-la avec change_request_get.",
      });
    case "ping":
      return rpcResult(message.id, {});
    case "tools/list":
      return rpcResult(message.id, { tools });
    case "tools/call": {
      const name = String(message.params?.name ?? "");
      const args = { ...((message.params?.arguments as Record<string, unknown>) ?? {}) };
      const idempotencyKey = typeof args.idempotency_key === "string" ? args.idempotency_key : null;
      delete args.idempotency_key;
      if (!OPERATIONS.some((op) => op.name === name)) {
        return rpcError(message.id, -32602, `Outil inconnu : ${name}`);
      }
      const result = await executeOperation({
        name,
        args,
        authorization,
        idempotencyKey,
        method: "MCP",
        route: `/mcp#${name}`,
      });
      const text = typeof result.body === "string" ? result.body : JSON.stringify(result.body, null, 2);
      return rpcResult(message.id, {
        content: [{ type: "text", text }],
        ...(typeof result.body === "object" && result.body !== null ? { structuredContent: { status: result.status, body: result.body } } : {}),
        isError: result.status >= 400,
      });
    }
    default:
      return rpcError(message.id, -32601, `Méthode inconnue : ${message.method}`);
  }
}

export async function handleMcpRequest(request: Request): Promise<Response> {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return Response.json(rpcError(null, -32700, "JSON invalide"), { status: 400 });
  }
  const authorization = request.headers.get("authorization");
  const messages = Array.isArray(payload) ? payload : [payload];
  const responses = [];
  for (const m of messages as JsonRpcRequest[]) {
    if (!m || m.jsonrpc !== "2.0" || typeof m.method !== "string") {
      responses.push(rpcError(null, -32600, "Requête JSON-RPC invalide"));
      continue;
    }
    /* Notifications (no id) get no response. */
    if (m.id === undefined || m.method.startsWith("notifications/")) continue;
    responses.push(await handleMessage(m, authorization));
  }
  if (responses.length === 0) return new Response(null, { status: 202 });
  return Response.json(Array.isArray(payload) ? responses : responses[0], {
    headers: { "Cache-Control": "no-store" },
  });
}
