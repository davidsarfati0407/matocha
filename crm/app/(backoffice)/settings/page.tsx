import type { Metadata } from "next";
import Link from "next/link";
import { Card, PageHeader } from "@/components/ui/kit";
import { sectorConfig } from "@/config/sector.config";
import { getCtx } from "@/lib/backoffice/context";
import { DemoReset, SettingsForm } from "./client";

export const metadata: Metadata = { title: "Paramètres" };

export default async function SettingsPage() {
  const ctx = await getCtx();
  const s = ctx.settings as Record<string, unknown>;
  const legal = (s.legal ?? {}) as Record<string, string>;
  const canEdit = ctx.can("organisation", "update");
  return (
    <>
      <PageHeader title="Paramètres" subtitle={`${ctx.orgName} · règles métier utilisées partout (devis, factures, relances, congés, trésorerie)`} />
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Règles de gestion" className="lg:col-span-2">
          <SettingsForm
            canEdit={canEdit}
            initial={{ hourly_rate: Number(s.hourly_rate ?? 65), payment_terms_days: Number(s.payment_terms_days ?? 30), dunning_days: (s.dunning_days as number[]) ?? [1, 15, 30], min_presence: Number(s.min_presence ?? 0.5), daily_revenue_target: Number(s.daily_revenue_target ?? 0), cash_opening: Number(s.cash_opening ?? 0), employer_charges: Number(s.employer_charges ?? 0.42) }}
          />
        </Card>
        <div className="flex flex-col gap-4">
          <Card title="Identité (fictive)">
            <dl className="space-y-1 text-sm">
              {Object.entries(legal).map(([k, v]) => <div key={k} className="flex justify-between gap-3"><dt className="text-muted">{k}</dt><dd className="text-right">{v}</dd></div>)}
            </dl>
          </Card>
          <Card title="Fiche secteur">
            <p className="text-sm text-muted">Vocabulaire, espaces, postes, étapes, KPI et rôles viennent de <code>config/sector.config.ts</code> ({sectorConfig.entreprise.secteur}).</p>
            <ul className="mt-2 space-y-1 text-sm">
              <li><Link className="text-accent" href="/settings/roles">Rôles et droits →</Link></li>
              <li><Link className="text-accent" href="/settings/integrations">Intégrations →</Link></li>
              <li><Link className="text-accent" href="/settings/automations">Automatisations →</Link></li>
              <li><Link className="text-accent" href="/settings/audit">Journal d'audit →</Link></li>
              <li><Link className="text-accent" href="/settings/privacy">RGPD →</Link></li>
            </ul>
          </Card>
          {ctx.demoMode && canEdit && <DemoReset />}
        </div>
      </div>
    </>
  );
}
