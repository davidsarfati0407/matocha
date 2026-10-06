import { handleOpsRequest } from "@/lib/ops/router";

/**
 * Matocha Ops API v1 — see docs/ops-api.openapi.yaml.
 * All routing lives in src/lib/ops/router.ts so REST and MCP share one
 * service layer (src/lib/ops/service.ts).
 */
type Ctx = { params: Promise<{ path: string[] }> };

const handle = async (request: Request, ctx: Ctx) => handleOpsRequest(request, (await ctx.params).path);

export const GET = handle;
export const POST = handle;
export const PATCH = handle;
