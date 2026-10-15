"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Field, Input } from "@/components/ui/Form";
import { Button, Card } from "@/components/ui/kit";
import { report } from "@/lib/ui/toast";
import { resetDemo, saveSettings } from "./actions";

type S = { hourly_rate: number; payment_terms_days: number; dunning_days: number[]; min_presence: number; daily_revenue_target: number; cash_opening: number; employer_charges: number };

export function SettingsForm({ initial, canEdit }: { initial: S; canEdit: boolean }) {
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
        <Field label="Taux horaire facturé (€ HT)" hint="Heures facturables des commandes pro"><Input name="hourly_rate" type="number" step="1" defaultValue={initial.hourly_rate} /></Field>
        <Field label="Délai de paiement (jours)" hint="Échéance des factures"><Input name="payment_terms_days" type="number" defaultValue={initial.payment_terms_days} /></Field>
        <Field label="Paliers de relance (J+ après échéance)" className="sm:col-span-2">
          <div className="grid grid-cols-3 gap-2">
            {initial.dunning_days.map((d, i) => <Input key={i} name={`d${i + 1}`} type="number" defaultValue={d} aria-label={`Relance ${i + 1}`} />)}
          </div>
        </Field>
        <Field label="Présence minimale de l'équipe (%)" hint="Contrôle des congés"><Input name="min_presence" type="number" min="0" max="100" defaultValue={Math.round(initial.min_presence * 100)} /></Field>
        <Field label="Objectif de CA journalier (€ HT)"><Input name="daily_revenue_target" type="number" defaultValue={initial.daily_revenue_target} /></Field>
        <Field label="Solde bancaire de départ (€)" hint="Trésorerie prévisionnelle (banque en mode simulé)"><Input name="cash_opening" type="number" defaultValue={initial.cash_opening} /></Field>
        <Field label="Charges patronales (%)" hint="Coût employeur estimé"><Input name="employer_charges" type="number" min="0" max="100" defaultValue={Math.round(initial.employer_charges * 100)} /></Field>
      </fieldset>
      {canEdit ? <Button variant="accent" className="sm:col-span-2 sm:w-fit" disabled={pending}>Enregistrer</Button> : <p className="text-sm text-muted sm:col-span-2">Lecture seule : droit « organisation » requis.</p>}
    </form>
  );
}

export function DemoReset() {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Card title="Démonstration">
      <p className="mb-3 text-sm text-muted">Rejoue le scénario de la map (75 s) depuis le début : remet en place le lot, la commande et le devis de démo.</p>
      <Button disabled={pending} onClick={() => start(async () => { if (report(await resetDemo())) router.refresh(); })}>Réinitialiser le scénario</Button>
    </Card>
  );
}
