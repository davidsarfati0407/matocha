"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Button, btn } from "@/components/ui/kit";
import { report } from "@/lib/ui/toast";
import { acceptQuote, duplicateQuote, sendQuote, setQuoteStatus } from "../../actions";

export function QuoteActions({ id, status, canEdit, canCreate, workOrder, clientEmail, number }: { id: string; status: string; canEdit: boolean; canCreate: boolean; workOrder: { id: string; number: string } | null; clientEmail: string | null; number: string }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const open = ["draft", "sent", "opened"].includes(status);
  return (
    <>
      <a className={btn("secondary")} href={`/crm/quotes/${id}/pdf`} target="_blank" rel="noreferrer">
        PDF
      </a>
      {canCreate && (
        <Button disabled={pending} icon="copy" onClick={() => start(async () => { const r = await duplicateQuote(id); if (report(r, { success: "Devis dupliqué" }) && r.ok && r.data) router.push(`/crm/quotes/${r.data.id}`); })}>
          Dupliquer
        </Button>
      )}
      {open && canEdit && (
        <>
          <Button disabled={pending} icon="send" title={clientEmail ? `À ${clientEmail}` : undefined} onClick={() => start(async () => { if (report(await sendQuote(id))) router.refresh(); })}>
            {status === "draft" ? "Envoyer" : "Renvoyer"} {number}
          </Button>
          <Button variant="secondary" disabled={pending} onClick={() => start(async () => { if (report(await setQuoteStatus(id, "rejected"))) router.refresh(); })}>
            Refusé
          </Button>
          <Button variant="accent" icon="check" disabled={pending} onClick={() => start(async () => { const r = await acceptQuote(id); if (report(r) && r.ok) router.refresh(); })}>
            Accepté → créer la commande
          </Button>
        </>
      )}
      {workOrder && (
        <Link className={btn("primary")} href={`/ops/work-orders/${workOrder.id}`}>
          Commande {workOrder.number}
        </Link>
      )}
    </>
  );
}
