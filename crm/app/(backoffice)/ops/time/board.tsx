"use client";
/** Minuteur (persiste dans le navigateur) + grille de saisie rapide de la semaine. */
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Field, Select } from "@/components/ui/Form";
import { Badge, Button, Card } from "@/components/ui/kit";
import { formatNumber } from "@/lib/format";
import { report } from "@/lib/ui/toast";
import { addTime, deleteTime } from "../actions";

type Entry = { id: string; work_order_id: string | null; worked_on: string; hours: number; billable: boolean; note: string | null; invoice_id: string | null };
const KEY = "matocha:timer";
const DAYS = ["mon", "tue", "wed", "thu", "fri"] as const;

export function TimeBoard({ weekStart, workOrders, entries }: { weekStart: string; workOrders: { id: string; label: string }[]; entries: Entry[] }) {
  const t = useTranslations("ops.time");
  const router = useRouter();
  const [pending, start] = useTransition();
  const [timer, setTimer] = useState<{ wo: string; since: number } | null>(null);
  const [now, setNow] = useState(0);
  const [wo, setWo] = useState(workOrders[0]?.id ?? "");
  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restauration du minuteur depuis le stockage local
      if (raw) setTimer(JSON.parse(raw));
    } catch {
      /* stockage indisponible */
    }
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const days = DAYS.map((_, i) => new Date(Date.parse(`${weekStart}T12:00:00Z`) + i * 86400_000).toISOString().slice(0, 10));
  const rows = [...new Set([...entries.map((e) => e.work_order_id ?? ""), wo])].filter(Boolean);
  const sum = (w: string, d: string) => entries.filter((e) => e.work_order_id === w && e.worked_on === d).reduce((s, e) => s + e.hours, 0);
  const elapsed = timer && now ? Math.max(0, (now - timer.since) / 3600_000) : 0;

  const stopTimer = () =>
    start(async () => {
      if (!timer) return;
      const hours = Math.max(0.25, Math.round(elapsed * 4) / 4);
      const r = await addTime({ work_order_id: timer.wo, worked_on: new Date().toISOString().slice(0, 10), hours, billable: false, note: "Minuteur" });
      if (report(r)) {
        localStorage.removeItem(KEY);
        setTimer(null);
        router.refresh();
      }
    });

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <Card title={t("timer")}>
        <Field label={t("workOrder")}>
          <Select value={timer?.wo ?? wo} disabled={Boolean(timer)} onChange={(e) => setWo(e.target.value)}>
            {workOrders.map((w) => (
              <option key={w.id} value={w.id}>
                {w.label}
              </option>
            ))}
          </Select>
        </Field>
        <p className="my-4 text-center font-mono text-4xl tabular-nums">{timer ? `${String(Math.floor(elapsed)).padStart(2, "0")}:${String(Math.floor((elapsed % 1) * 60)).padStart(2, "0")}` : "00:00"}</p>
        {timer ? (
          <Button variant="accent" className="w-full" disabled={pending} onClick={stopTimer}>
            {t("stop")}
          </Button>
        ) : (
          <Button
            variant="primary"
            className="w-full"
            disabled={!wo}
            onClick={() => {
              const next = { wo, since: Date.now() };
              setTimer(next);
              try {
                localStorage.setItem(KEY, JSON.stringify(next));
              } catch {
                /* minuteur non persistant */
              }
            }}
          >
            {t("start")}
          </Button>
        )}
      </Card>
      <Card title={t("quickEntry")} className="lg:col-span-2" padded={false}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted">
              <tr>
                <th className="px-5 py-2 text-left font-medium">{t("workOrder")}</th>
                {DAYS.map((d, i) => (
                  <th key={d} className="w-20 px-1 py-2 font-medium">
                    {t(`days.${d}`)} {days[i].slice(8)}
                  </th>
                ))}
                <th className="px-3 py-2 text-right font-medium">{t("total")}</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((w) => (
                <tr key={w} className="border-t border-black/5">
                  <td className="max-w-56 truncate px-5 py-2">{workOrders.find((x) => x.id === w)?.label ?? "—"}</td>
                  {days.map((d) => (
                    <td key={d} className="px-1 py-1.5">
                      <input
                        aria-label={t("hoursFor", { day: d })}
                        type="number"
                        step="0.25"
                        min="0"
                        placeholder={sum(w, d) ? formatNumber(sum(w, d), "fr", 2) : "–"}
                        className="w-full rounded-lg bg-black/[0.03] px-2 py-1 text-center tabular-nums outline-none focus:ring-2 focus:ring-accent/50"
                        onKeyDown={(e) => {
                          if (e.key !== "Enter") return;
                          const v = Number((e.target as HTMLInputElement).value);
                          if (!(v > 0)) return;
                          (e.target as HTMLInputElement).value = "";
                          start(async () => {
                            report(await addTime({ work_order_id: w, worked_on: d, hours: v, billable: false }));
                            router.refresh();
                          });
                        }}
                      />
                    </td>
                  ))}
                  <td className="px-3 text-right tabular-nums">{formatNumber(days.reduce((s, d) => s + sum(w, d), 0), "fr", 2)} h</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="px-5 py-3 text-xs text-muted">{t("hint")}</p>
      </Card>
      <Card title={t("weekEntries")} className="lg:col-span-3">
        <ul className="divide-y divide-black/5 text-sm">
          {entries.map((e) => (
            <li key={e.id} className="flex items-center justify-between gap-3 py-2">
              <span className="truncate">
                {e.worked_on.split("-").reverse().join("/")} · {workOrders.find((w) => w.id === e.work_order_id)?.label ?? t("internal")} {e.note ? <span className="text-muted">· {e.note}</span> : null}
              </span>
              <span className="flex items-center gap-2">
                <span className="tabular-nums">{formatNumber(e.hours, "fr", 2)} h</span>
                {e.invoice_id ? <Badge tone="ok">{t("invoiced")}</Badge> : <button className="text-xs text-muted hover:text-[#b3402a]" onClick={() => start(async () => (report(await deleteTime(e.id)), router.refresh()))}>{t("delete")}</button>}
              </span>
            </li>
          ))}
          {entries.length === 0 && <li className="py-2 text-muted">{t("empty")}</li>}
        </ul>
      </Card>
    </div>
  );
}
