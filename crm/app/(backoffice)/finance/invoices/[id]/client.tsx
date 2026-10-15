"use client";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Input, Select } from "@/components/ui/Form";
import { Button, btn } from "@/components/ui/kit";
import { report } from "@/lib/ui/toast";
import { creditNote, deletePayment, recordPayment, sendInvoice } from "../../actions";

export function InvoiceActions({ id, status, kind, canEdit, canCreate, paid }: { id: string; status: string; kind: string; canEdit: boolean; canCreate: boolean; paid: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <>
      <a className={btn("secondary")} href={`/finance/invoices/${id}/pdf`} target="_blank" rel="noreferrer">PDF</a>
      <a className={btn("secondary")} href={`/finance/invoices/${id}/xml`} download>XML Factur-X</a>
      {status === "draft" && canEdit && (
        <Button variant="accent" icon="send" disabled={pending} onClick={() => start(async () => { if (report(await sendInvoice(id))) router.refresh(); })}>
          Envoyer
        </Button>
      )}
      {kind === "facture" && status !== "cancelled" && paid === 0 && canCreate && (
        <Button disabled={pending} onClick={() => start(async () => { const r = await creditNote(id); if (report(r) && r.ok && r.data) router.push(`/finance/invoices/${r.data.id}`); })}>
          Émettre un avoir
        </Button>
      )}
    </>
  );
}

export function PaymentForm({ invoiceId, remaining }: { invoiceId: string; remaining: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <form
      className="mt-4 grid grid-cols-2 gap-2"
      action={(fd) =>
        start(async () => {
          const r = await recordPayment({ invoice_id: invoiceId, amount: Number(fd.get("amount")), received_on: String(fd.get("on")), method: fd.get("method") as "virement", reference: String(fd.get("ref") || "") });
          report(r, { undo: r.ok && r.data ? async () => (await deletePayment(r.data!.id), router.refresh()) : undefined });
          router.refresh();
        })
      }
    >
      <Input name="amount" type="number" step="0.01" min="0.01" defaultValue={remaining} aria-label="Montant" />
      <Input name="on" type="date" defaultValue={new Date().toISOString().slice(0, 10)} aria-label="Date" />
      <Select name="method" aria-label="Moyen">
        <option value="virement">Virement</option>
        <option value="carte">Carte</option>
        <option value="cheque">Chèque</option>
        <option value="prelevement">Prélèvement</option>
      </Select>
      <Input name="ref" placeholder="Référence" aria-label="Référence" />
      <Button variant="primary" className="col-span-2" disabled={pending}>
        Enregistrer le paiement
      </Button>
    </form>
  );
}

export function UndoPayment({ id }: { id: string }) {
  const router = useRouter();
  return (
    <button className="text-xs text-muted hover:text-[#b3402a]" onClick={async () => { if (report(await deletePayment(id))) router.refresh(); }}>
      annuler
    </button>
  );
}
