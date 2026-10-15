"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Textarea } from "@/components/ui/Form";
import { Badge, Button } from "@/components/ui/kit";
import { report } from "@/lib/ui/toast";
import { closeThread, makeDraft, sendReply } from "../actions";

export function Composer({ threadId }: { threadId: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [source, setSource] = useState<"ia" | "modele" | null>(null);
  const [pending, start] = useTransition();
  return (
    <div className="mt-4 border-t border-black/5 pt-4">
      <div className="mb-2 flex items-center gap-2">
        <Button size="sm" icon="sparkles" disabled={pending} onClick={() => start(async () => { const r = await makeDraft(threadId); if (r.ok && r.data) { setText(r.data.text); setSource(r.data.source); } else report(r); })}>
          Proposer un brouillon
        </Button>
        {source && <Badge tone={source === "ia" ? "brand" : "muted"}>{source === "ia" ? "Rédigé par l'IA · à relire" : "Modèle (IA non configurée)"}</Badge>}
      </div>
      <Textarea aria-label="Réponse" value={text} onChange={(e) => setText(e.target.value)} className="min-h-32" placeholder="Votre réponse…" />
      <div className="mt-2 flex gap-2">
        <Button variant="accent" icon="send" disabled={pending || !text.trim()} onClick={() => start(async () => { if (report(await sendReply(threadId, text, source === "ia"))) { setText(""); setSource(null); router.refresh(); } })}>
          Envoyer
        </Button>
        <Button disabled={pending} onClick={() => start(async () => { if (report(await closeThread(threadId))) router.refresh(); })}>Clôturer</Button>
      </div>
    </div>
  );
}
