"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/kit";
import { formatNumber } from "@/lib/format";
import { report } from "@/lib/ui/toast";
import { countStock, reorder } from "../../actions";

export function ReorderButton({ id, qty }: { id: string; qty: number }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  return (
    <Button variant="accent" icon="cart" disabled={pending} onClick={() => start(async () => { const r = await reorder([id]); if (report(r) && r.ok) router.push("/resources/purchase-orders?status=draft"); })}>
      Commander {formatNumber(qty)} (bon pré-rempli)
    </Button>
  );
}

export function CountForm({ id, current }: { id: string; current: number }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  if (!open) return <button className="text-xs font-medium text-accent" onClick={() => setOpen(true)}>Inventaire</button>;
  return (
    <form
      className="flex items-center gap-2"
      action={(fd) => start(async () => { if (report(await countStock(id, Number(fd.get("q"))))) { setOpen(false); router.refresh(); } })}
    >
      <input name="q" type="number" min="0" step="1" defaultValue={current} aria-label="Quantité comptée" className="w-24 rounded-lg bg-black/[0.04] px-2 py-1 text-sm tabular-nums" />
      <Button size="sm" variant="primary" disabled={pending}>
        Compté ({formatNumber(current)} attendu)
      </Button>
    </form>
  );
}
