import type { Metadata } from "next";
import { PageHeader } from "@/components/ui/kit";
import { getCtx } from "@/lib/backoffice/context";
import { createClient } from "@/lib/supabase/server";
import { AutomationList } from "./client";

export const metadata: Metadata = { title: "Automatisations" };

export default async function AutomationsPage() {
  const ctx = await getCtx();
  const supabase = await createClient();
  const { data } = await supabase.from("automations").select("id, name, enabled, trigger, last_run_at").order("created_at");
  return (
    <>
      <PageHeader title="Automatisations" subtitle="« Quand … alors … » : les règles d'événement s'exécutent en temps réel ; les règles de date et de seuil sont évaluées à la demande (planification pg_cron en phase 4)." />
      <AutomationList rows={(data ?? []).map((a) => ({ ...a, trigger: a.trigger as Record<string, unknown> }))} canEdit={ctx.can("pilotage", "update") || ctx.can("organisation", "update")} />
    </>
  );
}
