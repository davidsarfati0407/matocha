/**
 * Exécute la file de synchronisation et renouvelle les abonnements qui expirent.
 * Appelé par la planification (Vercel Cron ou pg_cron + pg_net) avec « Authorization: Bearer CRON_SECRET ».
 */
import { NextResponse } from "next/server";
import { enqueue, processJobs } from "@/lib/integrations/store";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) return NextResponse.json({ error: "non autorisé" }, { status: 401 });
  const db = createAdminClient();
  // Renouvellement et synchro périodique (le courrier Gmail n'a pas de push sans Pub/Sub)
  const { data: accounts } = await db.from("integration_accounts").select("org_id").eq("status", "connected");
  for (const org of new Set((accounts ?? []).map((a) => a.org_id))) {
    for (const kind of ["subscriptions.renew", "mail.delta", "calendar.delta"]) await enqueue(org, kind, { via: "cron" }, { runNow: false });
  }
  return NextResponse.json(await processJobs({ limit: 50 }));
}
