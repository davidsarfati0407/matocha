import { handleMcpRequest } from "@/lib/ops/mcp";

/** MCP endpoint (Streamable HTTP, stateless). Tools mirror /api/ops/v1. */
export async function POST(request: Request) {
  return handleMcpRequest(request);
}

/** No server-initiated stream: this server is stateless. */
export async function GET() {
  return new Response("Méthode non autorisée : utilisez POST (JSON-RPC).", {
    status: 405,
    headers: { Allow: "POST" },
  });
}
