"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useOptimistic, useState, useTransition } from "react";
import { Drawer } from "@/components/ui/Drawer";
import { Field, Input, Select } from "@/components/ui/Form";
import { Button } from "@/components/ui/kit";
import { DEAL_STAGES } from "@/lib/backoffice/labels";
import { formatDate, formatMoney } from "@/lib/format";
import { report } from "@/lib/ui/toast";
import { createDeal, moveDeal } from "../actions";

type Deal = { id: string; title: string; stage: string; value: number; probability: number; close: string | null; client: string; clientId: string; owner: string };

export function PipelineBoard({ rows, canEdit }: { rows: Deal[]; canEdit: boolean }) {
  const t = useTranslations("crm");
  const tAll = useTranslations();
  const router = useRouter();
  const [, start] = useTransition();
  const [deals, setOptimistic] = useOptimistic(rows, (cur, m: { id: string; stage: string }) => cur.map((d) => (d.id === m.id ? { ...d, stage: m.stage } : d)));
  const [over, setOver] = useState<string | null>(null);
  const move = (id: string, stage: string) =>
    start(async () => {
      setOptimistic({ id, stage });
      const r = await moveDeal(id, stage);
      report(r, { undo: r.ok && r.data ? async () => (await moveDeal(id, r.data!.previous), router.refresh()) : undefined });
      router.refresh();
    });
  return (
    <div className="grid gap-3 overflow-x-auto pb-2 md:grid-cols-5">
      {DEAL_STAGES.map((s) => {
        const list = deals.filter((d) => d.stage === s.id);
        return (
          <section
            key={s.id}
            aria-label={tAll(s.label as never)}
            onDragOver={(e) => canEdit && (e.preventDefault(), setOver(s.id))}
            onDragLeave={() => setOver(null)}
            onDrop={(e) => {
              setOver(null);
              const id = e.dataTransfer.getData("text/deal");
              if (id && deals.find((d) => d.id === id)?.stage !== s.id) move(id, s.id);
            }}
            className={`min-w-56 rounded-2xl p-2 transition ${over === s.id ? "bg-accent/10 ring-2 ring-accent/40" : "bg-black/[0.03]"}`}
          >
            <header className="flex items-baseline justify-between px-2 py-1.5">
              <h2 className="text-sm font-semibold">{tAll(s.label as never)}</h2>
              <span className="text-xs tabular-nums text-muted">{formatMoney(list.reduce((a, d) => a + d.value, 0), "fr", 0)}</span>
            </header>
            <div className="flex flex-col gap-2">
              {list.map((d) => (
                <article key={d.id} draggable={canEdit} onDragStart={(e) => e.dataTransfer.setData("text/deal", d.id)} className="card cursor-grab p-3 active:cursor-grabbing">
                  <Link href={`/crm/clients/${d.clientId}`} className="text-xs font-medium text-accent">
                    {d.client}
                  </Link>
                  <p className="text-sm font-medium leading-snug">{d.title}</p>
                  <p className="mt-1 flex justify-between text-xs text-muted">
                    <span className="tabular-nums">{formatMoney(d.value, "fr", 0)} · {Math.round(d.probability * 100)} %</span>
                    <span>{d.close ? formatDate(d.close) : ""}</span>
                  </p>
                  {canEdit && !["gagne", "perdu"].includes(d.stage) && (
                    <div className="mt-2 flex gap-1">
                      <Link href={`/crm/quotes/new?client=${d.clientId}&deal=${d.id}`} className="rounded-lg bg-accent/10 px-2 py-1 text-[11px] font-medium text-accent">
                        {t("pipeline.prefilledQuote")}
                      </Link>
                      <select aria-label={t("pipeline.changeStage")} className="ml-auto rounded-lg bg-black/[0.04] px-1 text-[11px]" value={d.stage} onChange={(e) => move(d.id, e.target.value)}>
                        {DEAL_STAGES.map((x) => (
                          <option key={x.id} value={x.id}>
                            {tAll(x.label as never)}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

export function NewDeal({ clients }: { clients: { id: string; name: string }[] }) {
  const t = useTranslations("crm");
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <>
      <Button variant="accent" icon="plus" onClick={() => setOpen(true)}>
        {t("pipeline.newDeal")}
      </Button>
      <Drawer open={open} onClose={() => setOpen(false)} title={t("pipeline.newDeal")}>
        <form
          className="flex flex-col gap-4"
          action={(fd) =>
            start(async () => {
              if (report(await createDeal({ client_id: String(fd.get("client")), title: String(fd.get("title")), value: Number(fd.get("value")), expected_close_on: String(fd.get("close") || ""), source: String(fd.get("source") || "") }))) {
                setOpen(false);
                router.refresh();
              }
            })
          }
        >
          <Field label={t("fields.account")}>
            <Select name="client">
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </Field>
          <Field label={t("pipeline.dealTitle")}>
            <Input name="title" required />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={t("pipeline.value")}>
              <Input name="value" type="number" min="0" step="10" required />
            </Field>
            <Field label={t("pipeline.expectedClose")}>
              <Input name="close" type="date" />
            </Field>
          </div>
          <Field label={t("pipeline.source")}>
            <Input name="source" placeholder={t("pipeline.sourcePlaceholder")} />
          </Field>
          <Button variant="accent" disabled={pending}>
            {t("create")}
          </Button>
        </form>
      </Drawer>
    </>
  );
}
