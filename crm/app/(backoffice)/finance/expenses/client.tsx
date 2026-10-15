"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { Drawer } from "@/components/ui/Drawer";
import { Field, Input, Select } from "@/components/ui/Form";
import { Badge, Button } from "@/components/ui/kit";
import { formatDate, formatMoney } from "@/lib/format";
import { report } from "@/lib/ui/toast";
import { decideExpenses, submitExpense } from "../actions";

type R = { id: string; on: string; category: string; label: string; ttc: number; vat: number; status: string; who: string; mine: boolean };
const ST: Record<string, ["warn" | "ok" | "danger" | "muted", string]> = { submitted: ["warn", "À valider"], approved: ["ok", "Validée"], rejected: ["danger", "Refusée"], reimbursed: ["muted", "Remboursée"] };

export function ExpensesTable({ rows, approver }: { rows: R[]; approver: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const decide = (ids: string[], s: "approved" | "rejected" | "reimbursed") => start(async () => { report(await decideExpenses(ids, s)); router.refresh(); });
  const columns: Column<R>[] = [
    { key: "on", header: "Date", value: (r) => r.on, cell: (r) => formatDate(r.on) },
    { key: "who", header: "Collaborateur", cell: (r) => r.who, filter: true },
    { key: "category", header: "Catégorie", cell: (r) => r.category, filter: true },
    { key: "label", header: "Objet", cell: (r) => r.label },
    { key: "ttc", header: "TTC", align: "right", value: (r) => r.ttc, cell: (r) => formatMoney(r.ttc) },
    { key: "vat", header: "dont TVA", align: "right", value: (r) => r.vat, cell: (r) => formatMoney(r.vat), hideOnMobile: true },
    { key: "status", header: "Statut", value: (r) => ST[r.status][1], filter: true, cell: (r) => <Badge tone={ST[r.status][0]}>{ST[r.status][1]}</Badge> },
    ...(approver
      ? [{ key: "act", header: "", cell: (r: R) => (r.status === "submitted" ? <span className="flex gap-1"><Button size="sm" variant="accent" disabled={pending} onClick={() => decide([r.id], "approved")}>Valider</Button><Button size="sm" disabled={pending} onClick={() => decide([r.id], "rejected")}>Refuser</Button></span> : r.status === "approved" ? <Button size="sm" disabled={pending} onClick={() => decide([r.id], "reimbursed")}>Remboursée</Button> : null) }]
      : []),
  ];
  return <DataTable rows={rows} columns={columns} module="finance:expenses" exportName="notes-de-frais" bulk={approver ? [{ label: "Valider", icon: "check", tone: "accent", run: (s) => decide(s.filter((x) => x.status === "submitted").map((x) => x.id), "approved") }] : []} />;
}

export function NewExpense() {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const [ttc, setTtc] = useState(0);
  const [rate, setRate] = useState(0.2);
  const router = useRouter();
  const vat = Math.round((ttc - ttc / (1 + rate)) * 100) / 100;
  return (
    <>
      <Button variant="accent" icon="plus" onClick={() => setOpen(true)}>Nouvelle note</Button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Nouvelle note de frais">
        <form className="flex flex-col gap-4" action={(fd) => start(async () => { if (report(await submitExpense({ spent_on: String(fd.get("on")), category: String(fd.get("cat")), label: String(fd.get("label")), amount_ttc: ttc, vat_amount: vat }))) { setOpen(false); router.refresh(); } })}>
          <label className="rounded-xl border border-dashed border-black/15 p-4 text-center text-sm text-muted">
            Photo du justificatif (stockage en mode simulé)
            <input type="file" accept="image/*,.pdf" className="sr-only" />
          </label>
          <Field label="Date"><Input name="on" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required /></Field>
          <Field label="Catégorie">
            <Select name="cat">
              {["Transport", "Repas client", "Hébergement", "Fournitures", "Salon", "Autre"].map((c) => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Objet"><Input name="label" required /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Montant TTC"><Input type="number" step="0.01" min="0.01" required onChange={(e) => setTtc(Number(e.target.value))} /></Field>
            <Field label="Taux de TVA" hint={`TVA calculée : ${formatMoney(vat)}`}>
              <Select value={rate} onChange={(e) => setRate(Number(e.target.value))}>
                <option value={0.2}>20 %</option>
                <option value={0.1}>10 %</option>
                <option value={0.055}>5,5 %</option>
                <option value={0}>Pas de TVA</option>
              </Select>
            </Field>
          </div>
          <Button variant="accent" disabled={pending || ttc <= 0}>Soumettre</Button>
        </form>
      </Drawer>
    </>
  );
}
