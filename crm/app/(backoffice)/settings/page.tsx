import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Card, PageHeader } from "@/components/ui/kit";
import { sectorConfig } from "@/config/sector.config";
import { getCtx } from "@/lib/backoffice/context";
import { DemoReset, SettingsForm } from "./client";

export async function generateMetadata() {
  const t = await getTranslations("settings.general");
  return { title: t("metaTitle") };
}

export default async function SettingsPage() {
  const t = await getTranslations("settings.general");
  const ctx = await getCtx();
  const s = ctx.settings as Record<string, unknown>;
  const legal = (s.legal ?? {}) as Record<string, string>;
  const canEdit = ctx.can("organisation", "update");
  return (
    <>
      <PageHeader title={t("title")} subtitle={t("subtitle", { org: ctx.orgName })} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title={t("rules")} className="lg:col-span-2">
          <SettingsForm
            canEdit={canEdit}
            initial={{ hourly_rate: Number(s.hourly_rate ?? 65), payment_terms_days: Number(s.payment_terms_days ?? 30), dunning_days: (s.dunning_days as number[]) ?? [1, 15, 30], min_presence: Number(s.min_presence ?? 0.5), daily_revenue_target: Number(s.daily_revenue_target ?? 0), cash_opening: Number(s.cash_opening ?? 0), employer_charges: Number(s.employer_charges ?? 0.42) }}
          />
        </Card>
        <div className="flex flex-col gap-4">
          <Card title={t("identity")}>
            <dl className="space-y-1 text-sm">
              {Object.entries(legal).map(([k, v]) => <div key={k} className="flex justify-between gap-3"><dt className="text-muted">{k}</dt><dd className="text-right">{v}</dd></div>)}
            </dl>
          </Card>
          <Card title={t("sector")}>
            <p className="text-sm text-muted">{t.rich("sectorHint", { sector: sectorConfig.entreprise.secteur, code: (c) => <code>{c}</code> })}</p>
            <ul className="mt-2 space-y-1 text-sm">
              <li><Link className="text-accent" href="/settings/roles">{t("linkRoles")}</Link></li>
              <li><Link className="text-accent" href="/settings/integrations">{t("linkIntegrations")}</Link></li>
              <li><Link className="text-accent" href="/settings/automations">{t("linkAutomations")}</Link></li>
              <li><Link className="text-accent" href="/settings/audit">{t("linkAudit")}</Link></li>
              <li><Link className="text-accent" href="/settings/privacy">{t("linkPrivacy")}</Link></li>
            </ul>
          </Card>
          {ctx.demoMode && canEdit && <DemoReset />}
        </div>
      </div>
    </>
  );
}
