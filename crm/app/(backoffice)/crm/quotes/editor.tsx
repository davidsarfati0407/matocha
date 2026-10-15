"use client";
/** Éditeur de devis guidé : catalogue, totaux et marge en direct (même calcul que le serveur). */
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import { Field, Input, Select, Textarea } from "@/components/ui/Form";
import { Button, Card } from "@/components/ui/kit";
import { Icon } from "@/components/map/hud/ui";
import { computeTotals } from "@/lib/domain/money";
import { formatMoney, formatPercent } from "@/lib/format";
import { report } from "@/lib/ui/toast";
import { saveQuote } from "../actions";

export type Catalog = { id: string; sku: string; name: string; unit: string; unit_price: number; unit_cost: number; vat_rate: number };
export type Line = { catalog_item_id: string | null; label: string; quantity: number; unit_price: number; unit_cost: number; vat_rate: number };

export function QuoteEditor({ id, clients, catalog, initial }: { id?: string; clients: { id: string; name: string }[]; catalog: Catalog[]; initial: { client_id: string; deal_id: string | null; discount_pct: number; notes: string; lines: Line[]; hint?: string } }) {
  const t = useTranslations("crm");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [clientId, setClientId] = useState(initial.client_id);
  const [lines, setLines] = useState<Line[]>(initial.lines);
  const [discount, setDiscount] = useState(initial.discount_pct);
  const [notes, setNotes] = useState(initial.notes);
  const totals = useMemo(() => computeTotals(lines.filter((l) => l.quantity > 0).map((l) => ({ quantity: l.quantity, unitPrice: l.unit_price, unitCost: l.unit_cost, vatRate: l.vat_rate })), { discountPct: discount }), [lines, discount]);
  const set = (i: number, patch: Partial<Line>) => setLines((ls) => ls.map((l, j) => (j === i ? { ...l, ...patch } : l)));
  const add = (c: Catalog) => setLines((ls) => [...ls, { catalog_item_id: c.id, label: c.name, quantity: 1, unit_price: c.unit_price, unit_cost: c.unit_cost, vat_rate: c.vat_rate }]);
  const lowMargin = totals.marginRate != null && totals.marginRate < 0.35;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card title={t("quotes.editor.lines")} className="lg:col-span-2" padded={false}>
        {initial.hint && <p className="mx-5 mb-2 rounded-xl bg-matcha/15 px-3 py-2 text-sm text-brand">{initial.hint}</p>}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-xs text-muted">
              <tr>
                <th className="px-5 py-2 font-medium">{t("lines.designation")}</th>
                <th className="w-24 px-2 py-2 text-right font-medium">{t("lines.qty")}</th>
                <th className="w-28 px-2 py-2 text-right font-medium">{t("lines.unitPrice")}</th>
                <th className="w-20 px-2 py-2 text-right font-medium">{t("lines.vat")}</th>
                <th className="w-28 px-2 py-2 text-right font-medium">{t("lines.totalHt")}</th>
                <th className="w-8" />
              </tr>
            </thead>
            <tbody>
              {lines.map((l, i) => (
                <tr key={i} className="border-t border-black/5">
                  <td className="px-5 py-1.5">
                    <input aria-label={t("lines.designation")} className="w-full rounded-lg bg-transparent px-1 py-1 outline-none focus:bg-black/[0.03]" value={l.label} onChange={(e) => set(i, { label: e.target.value })} />
                  </td>
                  <td className="px-2">
                    <input aria-label={t("lines.quantity")} type="number" min="0" step="1" className="w-full rounded-lg bg-black/[0.03] px-2 py-1 text-right tabular-nums" value={l.quantity} onChange={(e) => set(i, { quantity: Number(e.target.value) })} />
                  </td>
                  <td className="px-2">
                    <input aria-label={t("lines.unitPriceFull")} type="number" min="0" step="0.01" className="w-full rounded-lg bg-black/[0.03] px-2 py-1 text-right tabular-nums" value={l.unit_price} onChange={(e) => set(i, { unit_price: Number(e.target.value) })} />
                  </td>
                  <td className="px-2 text-right tabular-nums text-muted">{formatPercent(l.vat_rate)}</td>
                  <td className="px-2 text-right tabular-nums">{formatMoney(l.quantity * l.unit_price)}</td>
                  <td>
                    <button type="button" aria-label={t("quotes.editor.removeLine")} className="p-1 text-muted hover:text-[#b3402a]" onClick={() => setLines((ls) => ls.filter((_, j) => j !== i))}>
                      <Icon name="x" size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap gap-1.5 border-t border-black/5 px-5 py-3">
          <span className="mr-1 self-center text-xs text-muted">{t("quotes.editor.add")}</span>
          {catalog.map((c) => (
            <button key={c.id} type="button" onClick={() => add(c)} className="rounded-full bg-black/[0.04] px-2.5 py-1 text-xs hover:bg-accent/10 hover:text-accent">
              + {c.name} · {formatMoney(c.unit_price)}
            </button>
          ))}
          <button type="button" onClick={() => setLines((ls) => [...ls, { catalog_item_id: null, label: "Ligne libre" /* libellé imprimé sur le devis : langue de l'entreprise */, quantity: 1, unit_price: 0, unit_cost: 0, vat_rate: 0.2 }])} className="rounded-full px-2.5 py-1 text-xs text-muted ring-1 ring-black/10">
            {t("quotes.editor.freeLine")}
          </button>
        </div>
      </Card>
      <div className="flex flex-col gap-4">
        <Card title={t("quotes.title")}>
          <div className="flex flex-col gap-3">
            <Field label={t("fields.account")}>
              <Select value={clientId} onChange={(e) => setClientId(e.target.value)}>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("quotes.editor.discount")}>
              <Input type="number" min="0" max="50" step="0.5" value={Math.round(discount * 1000) / 10} onChange={(e) => setDiscount(Math.min(0.5, Math.max(0, Number(e.target.value) / 100)))} />
            </Field>
            <Field label={t("quotes.editor.notes")}>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="min-h-16" />
            </Field>
          </div>
        </Card>
        <Card title={t("quotes.editor.totals")}>
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between"><dt>{t("lines.totalHt")}</dt><dd className="tabular-nums">{formatMoney(totals.ht)}</dd></div>
            {totals.vatByRate.map((v) => (
              <div key={v.rate} className="flex justify-between text-muted"><dt>{t("lines.vatRate", { rate: formatPercent(v.rate) })}</dt><dd className="tabular-nums">{formatMoney(v.vat)}</dd></div>
            ))}
            <div className="flex justify-between border-t border-black/10 pt-1 text-base font-semibold"><dt>{t("lines.totalTtc")}</dt><dd className="tabular-nums">{formatMoney(totals.ttc)}</dd></div>
            <div className={`mt-2 flex justify-between rounded-lg px-2 py-1 ${lowMargin ? "bg-[#b3402a]/10 text-[#b3402a]" : "bg-matcha/15 text-brand"}`}>
              <dt>{t("quotes.editor.margin")}</dt>
              <dd className="tabular-nums">{formatMoney(totals.margin)} · {totals.marginRate == null ? "—" : formatPercent(totals.marginRate)}</dd>
            </div>
            {lowMargin && <p className="text-xs text-[#b3402a]">{t("quotes.editor.lowMargin")}</p>}
          </dl>
          <Button
            variant="accent"
            className="mt-4 w-full"
            disabled={pending || lines.length === 0}
            onClick={() =>
              start(async () => {
                const r = await saveQuote({ id, client_id: clientId, deal_id: initial.deal_id, discount_pct: discount, notes: notes || null, lines: lines.filter((l) => l.quantity > 0) });
                if (report(r) && r.ok && r.data) router.push(`/crm/quotes/${r.data.id}`);
                router.refresh();
              })
            }
          >
            {id ? t("quotes.editor.saveChanges") : t("quotes.editor.create")}
          </Button>
        </Card>
      </div>
    </div>
  );
}
