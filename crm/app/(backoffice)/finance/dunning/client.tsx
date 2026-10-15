"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Textarea } from "@/components/ui/Form";
import { Badge, Button, Card } from "@/components/ui/kit";
import { formatMoney } from "@/lib/format";
import { report } from "@/lib/ui/toast";
import { sendDunning } from "../actions";

export function DunningCard({ id, number, client, email, rest, late, level, sent, text, canSend }: { id: string; number: string; client: string; email: string | null; rest: number; late: number; level: number; sent: string[]; text: string; canSend: boolean }) {
  const t = useTranslations("finance.dunning");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [body, setBody] = useState(text);
  return (
    <Card
      title={<><Link href={`/finance/invoices/${id}`} className="font-mono hover:text-accent">{number}</Link> · {client}</>}
      action={<Badge tone={level === 3 ? "danger" : level === 2 ? "warn" : "info"}>{level === 3 ? t("levelFormal", { level }) : t("level", { level })}</Badge>}
    >
      <p className="mb-2 text-sm text-muted">
        {formatMoney(rest)} · {t("daysLate", { days: late })} · {t("to", { email: email ?? t("unknownEmail") })}
        {sent.length ? ` · ${t("already", { list: sent.join(", ") })}` : ""}
      </p>
      <Textarea aria-label={t("text")} value={body} onChange={(e) => setBody(e.target.value)} className="min-h-40 text-[13px]" />
      {canSend && (
        <Button variant="accent" icon="send" className="mt-3" disabled={pending} onClick={() => start(async () => { if (report(await sendDunning(id, level, body))) router.refresh(); })}>
          {t("send", { level })}
        </Button>
      )}
    </Card>
  );
}
