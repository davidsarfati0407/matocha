"use client";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Textarea } from "@/components/ui/Form";
import { Badge, Button, Card } from "@/components/ui/kit";
import { formatMoney } from "@/lib/format";
import { report } from "@/lib/ui/toast";
import { applyMatches, previewCamt, sampleCamt } from "../actions";

type M = { amount: number; reference: string; debtor: string | null; bookedOn: string | null; invoiceId: string | null; number: string | null; rule: string | null };

export function CamtImport() {
  const t = useTranslations("finance.payments.camt");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [xml, setXml] = useState("");
  const [rows, setRows] = useState<M[] | null>(null);
  const [keep, setKeep] = useState<Set<number>>(new Set());
  const preview = (x: string) =>
    start(async () => {
      const r = await previewCamt(x);
      if (!r.ok) return void report(r);
      setRows(r.data!);
      setKeep(new Set(r.data!.flatMap((m, i) => (m.invoiceId ? [i] : []))));
    });
  return (
    <Card title={t("title")} className="lg:col-span-2">
      <div className="flex flex-col gap-3">
        <label className="rounded-xl border border-dashed border-black/15 p-3 text-center text-sm text-muted">
          {t("drop")}
          <input type="file" accept=".xml" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (f) { const t = await f.text(); setXml(t); preview(t); } }} />
        </label>
        <Textarea aria-label={t("content")} value={xml} onChange={(e) => setXml(e.target.value)} placeholder={t("paste")} className="min-h-20 font-mono text-[11px]" />
        <div className="flex gap-2">
          <Button disabled={pending || !xml} onClick={() => preview(xml)}>{t("analyse")}</Button>
          <Button variant="secondary" disabled={pending} onClick={() => start(async () => { const x = await sampleCamt(); setXml(x); preview(x); })}>
            {t("sample")}
          </Button>
        </div>
        {rows && (
          <>
            <ul className="divide-y divide-black/5 text-sm">
              {rows.map((m, i) => (
                <li key={i} className="flex items-center gap-2 py-2">
                  <input type="checkbox" aria-label={t("match")} disabled={!m.invoiceId} checked={keep.has(i)} onChange={() => setKeep((k) => { const n = new Set(k); if (n.has(i)) n.delete(i); else n.add(i); return n; })} />
                  <span className="min-w-0 flex-1 truncate">
                    <span className="font-medium tabular-nums">{formatMoney(m.amount)}</span> · {m.debtor ?? "?"} <span className="text-muted">{t("quoted", { text: m.reference })}</span>
                  </span>
                  {m.invoiceId ? <Badge tone={m.rule === "reference" ? "ok" : "info"}>{m.number} · {m.rule === "reference" ? t("byReference") : t("byAmount")}</Badge> : <Badge tone="warn">{t("toAssign")}</Badge>}
                </li>
              ))}
            </ul>
            <Button
              variant="accent"
              disabled={pending || keep.size === 0}
              onClick={() =>
                start(async () => {
                  const r = await applyMatches([...keep].map((i) => ({ invoiceId: rows[i].invoiceId!, amount: rows[i].amount, reference: rows[i].reference, bookedOn: rows[i].bookedOn })));
                  if (report(r)) { setRows(null); setXml(""); router.refresh(); }
                })
              }
            >
              {t("matchCount", { count: keep.size })}
            </Button>
          </>
        )}
      </div>
    </Card>
  );
}
