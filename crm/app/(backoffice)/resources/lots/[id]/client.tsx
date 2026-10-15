"use client";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Modal } from "@/components/ui/Drawer";
import { Textarea } from "@/components/ui/Form";
import { Button } from "@/components/ui/kit";
import { report, toast } from "@/lib/ui/toast";
import { qualityDecision } from "../../actions";

export function QualityActions({ id, disabled }: { id: string; disabled?: boolean }) {
  const t = useTranslations("resources.lot");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [notes, setNotes] = useState("");
  const run = (release: boolean) => start(async () => { if (report(await qualityDecision(id, release, notes))) router.refresh(); });
  return (
    <div className="mt-4 space-y-2">
      <Textarea placeholder={t("observationsPlaceholder")} value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-16" />
      <div className="flex gap-2">
        <Button variant="accent" icon="check" disabled={pending || disabled} onClick={() => run(true)}>
          {t("release")}
        </Button>
        <Button variant="secondary" disabled={pending || disabled} onClick={() => run(false)}>
          {t("block")}
        </Button>
      </div>
      {disabled && <p className="text-xs text-muted">{t("decisionHint")}</p>}
    </div>
  );
}

/** Rappel de lot : liste des clients et message pré-rempli. */
export function RecallButton({ lot, item, clients }: { lot: string; item: string; clients: { name: string; email: string | null; orders: string[] }[] }) {
  const t = useTranslations("resources.lot");
  const [open, setOpen] = useState(false);
  const text = `Objet : information qualité — lot ${lot}\n\nBonjour,\n\nPar précaution, nous vous informons que le lot ${lot} (${item}) livré dans votre commande fait l'objet d'une vérification qualité. Merci de mettre de côté les unités de ce lot ; nous revenons vers vous sous 48 h avec un échange gratuit si nécessaire.\n\nL'équipe qualité`;
  return (
    <>
      <Button variant="secondary" icon="bell" onClick={() => setOpen(true)}>
        {t("recall")}
      </Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t("recallTitle", { lot })}
        footer={
          <Button
            variant="accent"
            icon="copy"
            onClick={() => {
              void navigator.clipboard?.writeText(text).catch(() => {});
              toast({ tone: "ok", title: t("copied", { count: clients.length }) });
              setOpen(false);
            }}
          >
            {t("copy")}
          </Button>
        }
      >
        <p className="mb-2 text-sm font-medium">{t("clientsConcerned", { count: clients.length })}</p>
        <ul className="mb-4 text-sm text-muted">
          {clients.map((c) => (
            <li key={c.name}>
              {c.name} · {c.email ?? t("noEmail")} · {c.orders.join(", ")}
            </li>
          ))}
        </ul>
        <pre className="whitespace-pre-wrap rounded-xl bg-ground p-3 text-sm">{text}</pre>
      </Modal>
    </>
  );
}
