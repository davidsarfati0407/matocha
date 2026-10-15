"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Textarea } from "@/components/ui/Form";
import { Badge, Button, Card } from "@/components/ui/kit";
import { formatMoney } from "@/lib/format";
import { report } from "@/lib/ui/toast";
import { sendDunning } from "../actions";

export function DunningCard({ id, number, client, email, rest, late, level, sent, text, canSend }: { id: string; number: string; client: string; email: string | null; rest: number; late: number; level: number; sent: string[]; text: string; canSend: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [body, setBody] = useState(text);
  return (
    <Card
      title={<><Link href={`/finance/invoices/${id}`} className="font-mono hover:text-accent">{number}</Link> · {client}</>}
      action={<Badge tone={level === 3 ? "danger" : level === 2 ? "warn" : "info"}>Niveau {level}{level === 3 ? " · mise en demeure" : ""}</Badge>}
    >
      <p className="mb-2 text-sm text-muted">
        {formatMoney(rest)} · {late} j de retard · à {email ?? "e-mail inconnu"}
        {sent.length ? ` · déjà : ${sent.join(", ")}` : ""}
      </p>
      <Textarea aria-label="Texte de relance" value={body} onChange={(e) => setBody(e.target.value)} className="min-h-40 text-[13px]" />
      {canSend && (
        <Button variant="accent" icon="send" className="mt-3" disabled={pending} onClick={() => start(async () => { if (report(await sendDunning(id, level, body))) router.refresh(); })}>
          Envoyer la relance {level}
        </Button>
      )}
    </Card>
  );
}
