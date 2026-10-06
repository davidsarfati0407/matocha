import { resetMemoryStore } from "@/lib/store";
import { consoleOutbox } from "@/lib/email";
import { createApiToken } from "@/lib/ops/tokens";
import type { Scope } from "@/lib/ops/scopes";

/** Fresh in-memory store + console e-mail for each test. */
export function setupEnv(extra: Record<string, string | undefined> = {}) {
  const env: Record<string, string | undefined> = {
    MATOCHA_STORE: "memory",
    MATOCHA_EMAIL: "console",
    SUPABASE_URL: undefined,
    SUPABASE_SERVICE_ROLE_KEY: undefined,
    RESEND_API_KEY: undefined,
    EMAIL_FROM: undefined,
    OPS_WEBHOOK_URL: undefined,
    OPS_WEBHOOK_SECRET: undefined,
    STRIPE_SECRET_KEY: undefined,
    STRIPE_WEBHOOK_SECRET: undefined,
    SITE_MODE_SALE_UNLOCK: undefined,
    OPS_RATE_LIMIT_PER_MIN: undefined,
    SITE_URL: "https://matocha.test",
    ...extra,
  };
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  resetMemoryStore();
  consoleOutbox().length = 0;
}

export async function token(scopes: Scope[], opts: { expiresInDays?: number | null } = {}) {
  const { token, row } = await createApiToken({
    name: "test",
    scopes,
    expiresInDays: opts.expiresInDays ?? null,
    createdBy: "test@matocha.test",
  });
  return { token, row };
}

let counter = 0;
export function opsRequest(
  method: string,
  path: string,
  init: { token?: string; body?: unknown; idem?: string | null } = {},
) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (init.token) headers.Authorization = `Bearer ${init.token}`;
  if (init.idem !== null && method !== "GET") headers["Idempotency-Key"] = init.idem ?? `k-${++counter}-${Date.now()}`;
  return {
    request: new Request(`https://matocha.test/api/ops/v1${path}`, {
      method,
      headers,
      body: init.body === undefined ? undefined : JSON.stringify(init.body),
    }),
    segments: path.split("?")[0].split("/").filter(Boolean),
  };
}
