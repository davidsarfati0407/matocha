"use client";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button, Card } from "@/components/ui/kit";
import { formatDate, formatMoney } from "@/lib/format";
import { report } from "@/lib/ui/toast";
import { revealSalary, toggleOnboarding } from "../../actions";

/** Salaire masqué par défaut : la révélation est un acte volontaire, journalisé par Postgres. */
export function SalaryCard({ id }: { id: string }) {
  const t = useTranslations("hr.salary");
  const [s, setS] = useState<{ gross_annual: number; months: number; bonus_target: number } | null | undefined>(undefined);
  const [pending, start] = useTransition();
  return (
    <Card title={t("pay")}>
      {s === undefined ? (
        <>
          <p className="mb-3 font-mono text-2xl tracking-widest text-muted">•• ••• €</p>
          <Button size="sm" icon="eye" disabled={pending} onClick={() => start(async () => { const r = await revealSalary(id); if (report(r) && r.ok) setS(r.data ?? null); })}>
            {t("reveal")}
          </Button>
        </>
      ) : s === null ? (
        <p className="text-sm text-muted">{t("none")}</p>
      ) : (
        <dl className="space-y-1 text-sm">
          <div className="flex justify-between"><dt className="text-muted">{t("grossAnnual")}</dt><dd className="font-semibold tabular-nums">{formatMoney(Number(s.gross_annual), "fr", 0)}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">{t("paidOver")}</dt><dd>{t("months", { n: s.months })}</dd></div>
          <div className="flex justify-between"><dt className="text-muted">{t("bonusTarget")}</dt><dd className="tabular-nums">{formatMoney(Number(s.bonus_target), "fr", 0)}</dd></div>
          <button className="mt-2 text-xs text-muted" onClick={() => setS(undefined)}>{t("hide")}</button>
        </dl>
      )}
    </Card>
  );
}

export function OnboardingItem({ id, title, due, done, disabled }: { id: string; title: string; due: string | null; done: boolean; disabled: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <label className="flex items-center gap-3 py-1.5 text-sm">
      <input type="checkbox" checked={done} disabled={disabled || pending} onChange={() => start(async () => { report(await toggleOnboarding(id, !done)); router.refresh(); })} className="size-4 accent-[var(--accent)]" />
      <span className={done ? "text-muted line-through" : ""}>{title}</span>
      {due && <span className="ml-auto text-xs text-muted">{formatDate(due)}</span>}
    </label>
  );
}
