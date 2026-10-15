"use client";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Input } from "@/components/ui/Form";
import { Card } from "@/components/ui/kit";
import { formatMoney } from "@/lib/format";

/** Simulation d'augmentation générale : impact annuel sur le coût employeur (rien n'est enregistré). */
export function RaiseSimulator({ gross, cost }: { gross: number; cost: number }) {
  const t = useTranslations("hr.salaries");
  const [pct, setPct] = useState(3);
  const ratio = gross ? cost / gross : 1.42;
  const extraGross = (gross * pct) / 100;
  return (
    <Card title={t("simTitle")}>
      <label className="text-sm">
        {t("simLabel")}
        <Input type="range" min="0" max="10" step="0.5" value={pct} onChange={(e) => setPct(Number(e.target.value))} className="mt-2 !p-0 ring-0" />
      </label>
      <p className="mt-1 text-2xl font-semibold tabular-nums">+{pct.toString().replace(".", ",")} %</p>
      <dl className="mt-3 space-y-1 text-sm">
        <div className="flex justify-between"><dt className="text-muted">{t("grossAnnual")}</dt><dd className="tabular-nums">+{formatMoney(extraGross, "fr", 0)}</dd></div>
        <div className="flex justify-between font-semibold"><dt>{t("employerCost")}</dt><dd className="tabular-nums">+{formatMoney(extraGross * ratio, "fr", 0)}</dd></div>
        <div className="flex justify-between text-muted"><dt>{t("perMonth")}</dt><dd className="tabular-nums">+{formatMoney((extraGross * ratio) / 12, "fr", 0)}</dd></div>
      </dl>
      <p className="mt-3 text-xs text-muted">{t("simHint")}</p>
    </Card>
  );
}
