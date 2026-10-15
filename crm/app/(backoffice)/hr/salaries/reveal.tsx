"use client";
import { useState, useTransition } from "react";
import { formatMoney } from "@/lib/format";
import { report } from "@/lib/ui/toast";
import { revealSalary } from "../actions";

export function SalaryCell({ id }: { id: string }) {
  const [v, setV] = useState<number | null | undefined>(undefined);
  const [pending, start] = useTransition();
  if (v !== undefined) return <button className="font-semibold tabular-nums" onClick={() => setV(undefined)} title="Masquer">{v == null ? "—" : formatMoney(v, "fr", 0)}</button>;
  return (
    <button className="rounded-lg px-2 py-1 font-mono text-muted ring-1 ring-black/10 hover:text-ink" disabled={pending} onClick={() => start(async () => { const r = await revealSalary(id); if (report(r) && r.ok) setV(r.data ? Number(r.data.gross_annual) : null); })}>
      •• ••• € · révéler
    </button>
  );
}
