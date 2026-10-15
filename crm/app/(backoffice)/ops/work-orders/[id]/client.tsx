"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Field, Input, Select } from "@/components/ui/Form";
import { Button } from "@/components/ui/kit";
import { nextStage, stageLabel } from "@/lib/domain/stages";
import { report, toast } from "@/lib/ui/toast";
import { addTime, consumeStock, invoiceWorkOrder, moveStage, setBlocked, toggleChecklist } from "../../actions";

export function StageActions({ id, stage, status, invoiced, canUpdate, canInvoice, clientName, number }: { id: string; stage: string; status: string; invoiced: boolean; canUpdate: boolean; canInvoice: boolean; clientName: string; number: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const next = nextStage(stage);
  return (
    <>
      <Button
        icon="mail"
        onClick={() => {
          void navigator.clipboard?.writeText(`Bonjour,\n\nVotre commande ${number} est à l'étape « ${stageLabel(stage)} ». Nous vous tiendrons informé de la suite.\n\nBien cordialement,\nL'équipe MATOCHA`).catch(() => {});
          toast({ title: `Message pour ${clientName} prêt`, detail: "Texte pré-rédigé copié : à relire avant envoi (messagerie en mode simulé).", tone: "info" });
        }}
      >
        Notifier le client
      </Button>
      {canUpdate && stage !== "livree" && stage !== "facturee" && (
        <Button
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await setBlocked(id, status === "attente" ? null : window.prompt("Motif de l'attente ?") || null);
              report(r);
              router.refresh();
            })
          }
        >
          {status === "attente" ? "Relancer" : "Mettre en attente"}
        </Button>
      )}
      {canUpdate && next && next !== "facturee" && (
        <Button
          variant="accent"
          icon="chevron"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await moveStage(id, next);
              report(r, { undo: r.ok ? async () => (await moveStage(id, stage), router.refresh()) : undefined });
              router.refresh();
            })
          }
        >
          Passer à « {stageLabel(next)} »
        </Button>
      )}
      {canInvoice && stage === "livree" && !invoiced && (
        <Button
          variant="accent"
          icon="file"
          disabled={pending}
          onClick={() =>
            start(async () => {
              const r = await invoiceWorkOrder(id);
              if (report(r) && r.ok && r.data) router.push(`/finance/invoices/${r.data.id}`);
            })
          }
        >
          Facturer
        </Button>
      )}
    </>
  );
}

export function ChecklistItem({ checklistId, index, label, done, disabled }: { checklistId: string; index: number; label: string; done: boolean; disabled: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <label className="flex cursor-pointer items-center gap-3 py-1.5 text-sm">
      <input type="checkbox" checked={done} disabled={disabled || pending} onChange={() => start(async () => (report(await toggleChecklist(checklistId, index), { success: done ? "Étape décochée" : "Étape cochée" }), router.refresh()))} className="size-4 accent-[var(--accent)]" />
      <span className={done ? "text-muted line-through" : ""}>{label}</span>
    </label>
  );
}

export function TimeForm({ workOrderId }: { workOrderId: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <form
      className="flex flex-col gap-3"
      action={(fd) =>
        start(async () => {
          const r = await addTime({ work_order_id: workOrderId, worked_on: String(fd.get("day")), hours: Number(fd.get("hours")), billable: fd.get("billable") === "on", note: String(fd.get("note") || "") });
          report(r);
          router.refresh();
        })
      }
    >
      <div className="grid grid-cols-2 gap-3">
        <Field label="Jour">
          <Input name="day" type="date" required defaultValue={new Date().toISOString().slice(0, 10)} />
        </Field>
        <Field label="Heures">
          <Input name="hours" type="number" step="0.25" min="0.25" max="24" required defaultValue="1" />
        </Field>
      </div>
      <Field label="Note">
        <Input name="note" placeholder="Préparation, contrôle…" />
      </Field>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" name="billable" className="accent-[var(--accent)]" /> Facturable au client
      </label>
      <Button variant="primary" disabled={pending}>
        Enregistrer
      </Button>
    </form>
  );
}

export function ConsumeForm({ workOrderId, items }: { workOrderId: string; items: { id: string; label: string }[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <form className="flex flex-col gap-3" action={(fd) => start(async () => (report(await consumeStock(workOrderId, String(fd.get("item")), Number(fd.get("qty")))), router.refresh()))}>
      <Field label="Référence">
        <Select name="item" required>
          {items.map((i) => (
            <option key={i.id} value={i.id}>
              {i.label}
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Quantité" hint="Le lot à la DDM la plus proche est choisi automatiquement (FEFO).">
        <Input name="qty" type="number" min="1" step="1" required defaultValue="1" />
      </Field>
      <Button variant="primary" disabled={pending}>
        Sortir du stock
      </Button>
    </form>
  );
}
