import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/ui/kit";
import { getCtx } from "@/lib/backoffice/context";
import { createClient } from "@/lib/supabase/server";
import { AutomationList } from "./client";

export async function generateMetadata() {
  const t = await getTranslations("settings.automations");
  return { title: t("metaTitle") };
}

export default async function AutomationsPage() {
  const t = await getTranslations("settings.automations");
  const ctx = await getCtx();
  const supabase = await createClient();
  const { data } = await supabase.from("automations").select("id, name, enabled, trigger, last_run_at").order("created_at");
  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle")} />
      <AutomationList rows={(data ?? []).map((a) => ({ ...a, trigger: a.trigger as Record<string, unknown> }))} canEdit={ctx.can("pilotage", "update") || ctx.can("organisation", "update")} />
    </>
  );
}
