"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Drawer } from "@/components/ui/Drawer";
import { Field, Input, Select } from "@/components/ui/Form";
import { Badge, Button, Progress } from "@/components/ui/kit";
import { formatDate, formatMoney } from "@/lib/format";
import { STAGES, canMove, stageLabel } from "@/lib/domain/stages";
import { report } from "@/lib/ui/toast";
import { createWorkOrder, moveStage } from "../actions";

export interface WoRow {
  id: string;
  number: string;
  title: string;
  client: string;
  stage: string;
  status: string;
  progress: number;
  hoursUsed: number;
  hoursBudget: number;
  level: 0 | 50 | 80 | 100;
  dueAt: string | null;
  late: boolean;
  amountTtc: number;
  owner: string;
  blocked: string | null;
}

export function BudgetBadge({ level, used, budget }: { level: number; used: number; budget: number }) {
  const label = `${used.toString().replace(".", ",")} / ${budget.toString().replace(".", ",")} h`;
  return level >= 100 ? <Badge tone="danger">{label} · 100 %</Badge> : level >= 80 ? <Badge tone="warn">{label} · 80 %</Badge> : level >= 50 ? <Badge tone="info">{label} · 50 %</Badge> : <Badge tone="muted" dot={false}>{label}</Badge>;
}

export function WorkOrdersView({ rows, view, clients, canCreate }: { rows: WoRow[]; view: "liste" | "kanban"; clients: { id: string; name: string }[]; canCreate: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [drag, setDrag] = useState<string | null>(null);

  const columns: Column<WoRow>[] = [
    { key: "number", header: "N°", cell: (r) => <span className="font-mono text-[13px]">{r.number}</span> },
    { key: "client", header: "Compte", cell: (r) => r.client, filter: true },
    { key: "title", header: "Objet", cell: (r) => <span className="text-muted">{r.title}</span>, hideOnMobile: true },
    { key: "stage", header: "Étape", value: (r) => stageLabel(r.stage), cell: (r) => <Badge tone={r.stage === "facturee" || r.stage === "livree" ? "ok" : "brand"}>{stageLabel(r.stage)}</Badge>, filter: true },
    { key: "status", header: "Statut", value: (r) => (r.status === "attente" ? "En attente" : r.late ? "En retard" : "Normal"), cell: (r) => (r.status === "attente" ? <Badge tone="warn">En attente</Badge> : r.late ? <Badge tone="danger">En retard</Badge> : <span className="text-muted">—</span>), filter: true },
    { key: "budget", header: "Budget d'heures", value: (r) => r.level, cell: (r) => <BudgetBadge level={r.level} used={r.hoursUsed} budget={r.hoursBudget} /> },
    { key: "owner", header: "Responsable", cell: (r) => r.owner, filter: true, hideOnMobile: true },
    { key: "due", header: "Échéance", value: (r) => r.dueAt ?? "", cell: (r) => (r.dueAt ? formatDate(r.dueAt) : "—") },
    { key: "amount", header: "Montant TTC", align: "right", value: (r) => r.amountTtc, cell: (r) => formatMoney(r.amountTtc) },
  ];

  const toggle = (
    <div className="flex rounded-xl bg-black/[0.04] p-0.5 text-xs font-medium">
      {(["liste", "kanban"] as const).map((v) => (
        <Link key={v} href={`?view=${v}`} className={`rounded-lg px-2.5 py-1.5 capitalize ${view === v ? "bg-white shadow-sm" : "text-muted"}`}>
          {v}
        </Link>
      ))}
    </div>
  );

  return (
    <>
      <div className="mb-3 flex justify-between gap-2">
        {toggle}
        {canCreate && (
          <Button variant="accent" icon="plus" onClick={() => setOpen(true)}>
            Commande sans devis
          </Button>
        )}
      </div>
      {view === "liste" ? (
        <DataTable rows={rows} columns={columns} module="ops:work-orders" exportName="commandes-pro" href={(r) => `/ops/work-orders/${r.id}`} />
      ) : (
        <div className="flex gap-3 overflow-x-auto pb-3" aria-label="Kanban des commandes pro">
          {STAGES.map((s) => {
            const items = rows.filter((r) => r.stage === s.id);
            return (
              <section
                key={s.id}
                aria-label={s.libelle}
                onDragOver={(e) => drag && e.preventDefault()}
                onDrop={() => {
                  const r = rows.find((x) => x.id === drag);
                  setDrag(null);
                  if (!r || r.stage === s.id) return;
                  if (!canMove(r.stage, s.id)) {
                    report({ ok: false, error: s.id === "facturee" ? "La facturation se fait en créant la facture." : "On avance d'une étape à la fois." });
                    return;
                  }
                  start(async () => {
                    const res = await moveStage(r.id, s.id);
                    report(res, { undo: res.ok ? async () => (await moveStage(r.id, r.stage), router.refresh()) : undefined });
                    router.refresh();
                  });
                }}
                className={`flex w-64 shrink-0 flex-col rounded-2xl bg-black/[0.03] p-2 ${pending ? "opacity-70" : ""}`}
              >
                <header className="flex items-center justify-between px-1.5 pb-2 pt-1">
                  <h2 className="text-[13px] font-semibold">{s.libelle}</h2>
                  <span className="text-xs text-muted">{items.length}</span>
                </header>
                <div className="flex flex-col gap-2">
                  {items.map((r) => (
                    <Link key={r.id} href={`/ops/work-orders/${r.id}`} draggable onDragStart={() => setDrag(r.id)} className="card block cursor-grab p-3 text-sm active:cursor-grabbing">
                      <p className="flex justify-between gap-2">
                        <span className="font-mono text-xs">{r.number}</span>
                        {r.status === "attente" ? <Badge tone="warn">Attente</Badge> : r.late ? <Badge tone="danger">Retard</Badge> : null}
                      </p>
                      <p className="mt-1 truncate font-medium">{r.client}</p>
                      <p className="truncate text-xs text-muted">{r.title}</p>
                      <Progress value={r.progress} tone="accent" className="mt-2" />
                      <div className="mt-2 flex items-center justify-between text-xs text-muted">
                        <BudgetBadge level={r.level} used={r.hoursUsed} budget={r.hoursBudget} />
                        <span>{formatMoney(r.amountTtc, "fr", 0)}</span>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      )}
      <NewWorkOrder open={open} onClose={() => setOpen(false)} clients={clients} />
    </>
  );
}

function NewWorkOrder({ open, onClose, clients }: { open: boolean; onClose: () => void; clients: { id: string; name: string }[] }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Drawer open={open} onClose={onClose} title="Commande pro sans devis">
      <form
        id="new-wo"
        className="flex flex-col gap-4"
        action={(fd) =>
          start(async () => {
            const r = await createWorkOrder({ client_id: String(fd.get("client_id")), title: String(fd.get("title")), hours_budget: Number(fd.get("hours_budget")), due_at: new Date(String(fd.get("due"))).toISOString(), amount_ht: Number(fd.get("amount_ht")), physical_object: String(fd.get("physical") || "") });
            if (report(r) && r.ok && r.data) {
              onClose();
              router.push(`/ops/work-orders/${r.data.id}`);
            }
          })
        }
      >
        <p className="rounded-xl bg-ground/70 p-3 text-xs text-muted">Normalement, une commande pro naît d'un devis accepté (sans ressaisie). Ce formulaire sert aux réassorts directs.</p>
        <Field label="Compte">
          <Select name="client_id" required defaultValue="">
            <option value="" disabled>
              Choisir…
            </option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Objet">
          <Input name="title" required placeholder="Réassort mensuel" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Montant HT (€)">
            <Input name="amount_ht" type="number" step="0.01" min="0" required defaultValue="0" />
          </Field>
          <Field label="Budget d'heures">
            <Input name="hours_budget" type="number" step="0.25" min="0" defaultValue="2" />
          </Field>
        </div>
        <Field label="Échéance">
          <Input name="due" type="datetime-local" required />
        </Field>
        <Field label="Colis (facultatif)">
          <Input name="physical" placeholder="2 cartons · 8 kg" />
        </Field>
        <Button variant="accent" disabled={pending}>
          Créer la commande
        </Button>
      </form>
    </Drawer>
  );
}
