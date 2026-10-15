"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { Button, btn } from "@/components/ui/kit";
import { report } from "@/lib/ui/toast";
import { acceptQuote, duplicateQuote, sendQuote, setQuoteStatus } from "../../actions";

export function QuoteActions({ id, status, canEdit, canCreate, workOrder, clientEmail, number }: { id: string; status: string; canEdit: boolean; canCreate: boolean; workOrder: { id: string; number: string } | null; clientEmail: string | null; number: string }) {
  const t = useTranslations("crm.quotes");
  const router = useRouter();
  const [pending, start] = useTransition();
  const open = ["draft", "sent", "opened"].includes(status);
  return (
    <>
      <a className={btn("secondary")} href={`/crm/quotes/${id}/pdf`} target="_blank" rel="noreferrer">
        {t("pdf")}
      </a>
      {canCreate && (
        <Button disabled={pending} icon="copy" onClick={() => start(async () => { const r = await duplicateQuote(id); if (report(r, { success: t("duplicated") }) && r.ok && r.data) router.push(`/crm/quotes/${r.data.id}`); })}>
          {t("duplicate")}
        </Button>
      )}
      {open && canEdit && (
        <>
          <Button disabled={pending} icon="send" title={clientEmail ? t("toEmail", { email: clientEmail }) : undefined} onClick={() => start(async () => { if (report(await sendQuote(id))) router.refresh(); })}>
            {status === "draft" ? t("send", { number }) : t("resend", { number })}
          </Button>
          <Button variant="secondary" disabled={pending} onClick={() => start(async () => { if (report(await setQuoteStatus(id, "rejected"))) router.refresh(); })}>
            {t("markRejected")}
          </Button>
          <Button variant="accent" icon="check" disabled={pending} onClick={() => start(async () => { const r = await acceptQuote(id); if (report(r) && r.ok) router.refresh(); })}>
            {t("acceptCreateOrder")}
          </Button>
        </>
      )}
      {workOrder && (
        <Link className={btn("primary")} href={`/ops/work-orders/${workOrder.id}`}>
          {t("workOrder", { number: workOrder.number })}
        </Link>
      )}
    </>
  );
}
