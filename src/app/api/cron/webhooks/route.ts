import { safeEqual } from "@/lib/ops/crypto";
import { retryDueWebhooks } from "@/lib/ops/webhooks";

/**
 * Retries outgoing webhooks whose backoff has elapsed. Called by a Vercel
 * cron with `Authorization: Bearer $CRON_SECRET`.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!secret || !safeEqual(given, secret)) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  return Response.json(await retryDueWebhooks());
}
