"use client";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { Field, Input } from "@/components/ui/Form";
import { Button, Card } from "@/components/ui/kit";
import { report } from "@/lib/ui/toast";
import { resetDemo, saveSettings } from "./actions";

type S = { hourly_rate: number; payment_terms_days: number; dunning_days: number[]; min_presence: number; daily_revenue_target: number; cash_opening: number; employer_charges: number };

export function SettingsForm({ initial, canEdit }: { initial: S; canEdit: boolean }) {
  const t = useTranslations("settings.form");
  const router = useRouter();
  const [pending, start] = useTransition();
  const n = (fd: FormData, k: string) => Number(fd.get(k));
  return (
    <form
      className="grid gap-4 sm:grid-cols-2"
      action={(fd) =>
        start(async () => {
          const r = await saveSettings({ hourly_rate: n(fd, "hourly_rate"), payment_terms_days: n(fd, "payment_terms_days"), dunning_days: [n(fd, "d1"), n(fd, "d2"), n(fd, "d3")], min_presence: n(fd, "min_presence") / 100, daily_revenue_target: n(fd, "daily_revenue_target"), cash_opening: n(fd, "cash_opening"), employer_charges: n(fd, "employer_charges") / 100 });
          if (report(r)) router.refresh();
        })
      }
    >
      <fieldset disabled={!canEdit} className="contents">
        <Field label={t("hourlyRate")} hint={t("hourlyRateHint")}><Input name="hourly_rate" type="number" step="1" defaultValue={initial.hourly_rate} /></Field>
        <Field label={t("paymentTerms")} hint={t("paymentTermsHint")}><Input name="payment_terms_days" type="number" defaultValue={initial.payment_terms_days} /></Field>
        <Field label={t("dunning")} className="sm:col-span-2">
          <div className="grid grid-cols-3 gap-2">
            {initial.dunning_days.map((d, i) => <Input key={i} name={`d${i + 1}`} type="number" defaultValue={d} aria-label={t("dunningStep", { n: i + 1 })} />)}
          </div>
        </Field>
        <Field label={t("minPresence")} hint={t("minPresenceHint")}><Input name="min_presence" type="number" min="0" max="100" defaultValue={Math.round(initial.min_presence * 100)} /></Field>
        <Field label={t("revenueTarget")}><Input name="daily_revenue_target" type="number" defaultValue={initial.daily_revenue_target} /></Field>
        <Field label={t("cashOpening")} hint={t("cashOpeningHint")}><Input name="cash_opening" type="number" defaultValue={initial.cash_opening} /></Field>
        <Field label={t("employerCharges")} hint={t("employerChargesHint")}><Input name="employer_charges" type="number" min="0" max="100" defaultValue={Math.round(initial.employer_charges * 100)} /></Field>
      </fieldset>
      {canEdit ? <Button variant="accent" className="sm:col-span-2 sm:w-fit" disabled={pending}>{t("save")}</Button> : <p className="text-sm text-muted sm:col-span-2">{t("readOnly")}</p>}
    </form>
  );
}

export function DemoReset() {
  const t = useTranslations("settings.demo");
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Card title={t("title")}>
      <p className="mb-3 text-sm text-muted">{t("hint")}</p>
      <Button disabled={pending} onClick={() => start(async () => { if (report(await resetDemo())) router.refresh(); })}>{t("reset")}</Button>
    </Card>
  );
}
