"use client";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Field, Input, Select, Textarea } from "@/components/ui/Form";
import { Button } from "@/components/ui/kit";
import { businessDays } from "@/lib/domain/leave";
import { report } from "@/lib/ui/toast";
import { decideLeave, requestLeave } from "../actions";

export function LeaveDecision({ id, blocked }: { id: string; blocked: boolean }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const decide = (s: "approved" | "rejected") =>
    start(async () => {
      const r = await decideLeave(id, s);
      report(r, { undo: r.ok ? async () => (report(await decideLeave(id, "pending")), router.refresh()) : undefined });
      router.refresh();
    });
  return (
    <div className="flex gap-2">
      <Button variant="accent" icon="check" disabled={pending || blocked} title={blocked ? "Règle bloquante : voir le détail" : undefined} onClick={() => decide("approved")}>
        Valider
      </Button>
      <Button disabled={pending} onClick={() => decide("rejected")}>
        Refuser
      </Button>
    </div>
  );
}

export function RequestLeave({ balance }: { balance: number }) {
  const [open, setOpen] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  const days = useMemo(() => (from && to && to >= from ? businessDays(from, to) : 0), [from, to]);
  return (
    <>
      <Button variant="accent" icon="sun" onClick={() => setOpen(true)}>Demander un congé</Button>
      <Drawer open={open} onClose={() => setOpen(false)} title="Demande d'absence">
        <form className="flex flex-col gap-4" action={(fd) => start(async () => { if (report(await requestLeave({ type: fd.get("type") as "conges", starts_on: from, ends_on: to, comment: String(fd.get("comment") || "") }))) { setOpen(false); router.refresh(); } })}>
          <Field label="Type">
            <Select name="type">
              <option value="conges">Congés payés</option>
              <option value="rtt">RTT</option>
              <option value="formation">Formation</option>
              <option value="sans_solde">Sans solde</option>
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Du"><Input type="date" required value={from} onChange={(e) => setFrom(e.target.value)} /></Field>
            <Field label="Au"><Input type="date" required value={to} onChange={(e) => setTo(e.target.value)} /></Field>
          </div>
          <p className="rounded-xl bg-ground p-3 text-sm">{days} jour(s) ouvré(s) (week-ends et jours fériés exclus) · solde actuel {balance} j</p>
          <Field label="Commentaire"><Textarea name="comment" className="min-h-16" /></Field>
          <Button variant="accent" disabled={pending || days <= 0}>Envoyer la demande</Button>
        </form>
      </Drawer>
    </>
  );
}
