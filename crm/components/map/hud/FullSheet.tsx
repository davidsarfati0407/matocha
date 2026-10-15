"use client";
/** Fenêtre « fiche complète » au-dessus de la map (sans quitter la vue). */
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { sectorConfig } from "@/config/sector.config";
import { computeTotals } from "@/lib/domain/money";
import { formatDate, formatMoney, formatNumber, formatTime } from "@/lib/format";
import { backOfficeHref } from "@/lib/map/links";
import { useMap } from "@/lib/map/store";
import { employeeSheet, workOrderSheet } from "@/app/(map)/map/actions";
import { Avatar, SalaryReveal, useNow } from "./DetailPanel";
import { Icon, Row, SectionTitle, panel } from "./ui";

type EmpSheet = Awaited<ReturnType<typeof employeeSheet>>;
type WoSheet = Awaited<ReturnType<typeof workOrderSheet>>;

export function FullSheet() {
  const open = useMap((s) => s.sheetOpen);
  const sel = useMap((s) => s.selection);
  const snap = useMap((s) => s.snapshot);
  const set = useMap((s) => s.set);
  // Données chargées à la demande, rattachées à l'identifiant pour éviter d'afficher celles d'une autre fiche
  const [empData, setEmp] = useState<{ id: string; data: EmpSheet } | null>(null);
  const [woData, setWo] = useState<{ id: string; data: WoSheet } | null>(null);
  const now = useNow(60000);
  const t = useTranslations("map");

  useEffect(() => {
    if (!open || !sel) return;
    const id = sel.entityId;
    if (sel.entityType === "employees") void employeeSheet(id).then((data) => setEmp({ id, data }));
    if (sel.entityType === "work_orders") void workOrderSheet(id).then((data) => setWo({ id, data }));
  }, [open, sel]);
  const emp = empData && empData.id === sel?.entityId ? empData.data : null;
  const wo = woData && woData.id === sel?.entityId ? woData.data : null;

  if (!open || !sel || !snap) return null;
  const href = backOfficeHref(sel.entityType, sel.entityId);
  const e = snap.employees.find((x) => x.id === sel.entityId);
  const w = snap.workOrders.find((x) => x.id === sel.entityId);

  return (
    <div className="pointer-events-auto absolute inset-0 z-40 grid place-items-center bg-ink/20 p-4 backdrop-blur-[2px]" onClick={() => set({ sheetOpen: false })}>
      <div role="dialog" aria-modal aria-label={t("sheet.label", { label: sel.label })} className={`${panel} flex max-h-[86vh] w-full max-w-4xl flex-col overflow-hidden bg-white`} onClick={(ev) => ev.stopPropagation()}>
        <header className="flex items-center gap-3 border-b border-black/5 px-6 py-4">
          {e && <Avatar e={e} size={44} />}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-xl font-semibold tracking-tight">{e ? `${e.firstName} ${e.lastName}` : w ? `${w.number} · ${w.clientName}` : sel.label}</h2>
            <p className="text-sm text-muted">{e ? `${e.jobTitle} · ${e.department}` : w ? w.title : sel.entityType}</p>
          </div>
          {href && (
            <Link href={href} className="flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium ring-1 ring-black/10 hover:bg-black/5">
              <Icon name="external" size={14} /> {t("common.openInBackoffice")}
            </Link>
          )}
          <button aria-label={t("common.close")} onClick={() => set({ sheetOpen: false })} className="grid size-9 place-items-center rounded-full ring-1 ring-black/10 hover:bg-black/5">
            <Icon name="x" />
          </button>
        </header>
        <div className="overflow-y-auto px-6 pb-6">
          {e && <EmployeeContent e={e} sheet={emp} seesSalaries={snap.me.seesSalaries} now={now} />}
          {w && <WorkOrderContent w={w} sheet={wo} />}
          {!e && !w && <p className="py-6 text-sm text-muted">{t("sheet.fallback")}</p>}
        </div>
      </div>
    </div>
  );
}

function EmployeeContent({ e, sheet, seesSalaries, now }: { e: NonNullable<ReturnType<typeof useMap.getState>["snapshot"]>["employees"][number]; sheet: EmpSheet | null; seesSalaries: boolean; now: number }) {
  const t = useTranslations("map");
  const days = (["mon", "tue", "wed", "thu", "fri"] as const).map((d) => t(`sheet.days.${d}`));
  const start = sheet ? new Date(sheet.weekStart) : null;
  const H0 = 7;
  const H1 = 19;
  // Heures pointées par jour (entrée → sortie, pauses déduites)
  const worked = days.map((_, i) => {
    if (!sheet || !start) return 0;
    const d0 = new Date(start.getTime() + i * 86400_000);
    const d1 = new Date(d0.getTime() + 86400_000);
    const ev = sheet.badges.filter((b) => Date.parse(b.at) >= d0.getTime() && Date.parse(b.at) < d1.getTime());
    let total = 0;
    let open: number | null = null;
    for (const b of ev) {
      const at = Date.parse(b.at);
      if (b.kind === "in" || b.kind === "pause_end") open = at;
      if ((b.kind === "out" || b.kind === "pause_start") && open !== null) {
        total += at - open;
        open = null;
      }
    }
    if (open !== null && d1.getTime() > now && d0.getTime() <= now) total += now - open;
    return total / 3600_000;
  });
  return (
    <div className="grid gap-6 pt-4 lg:grid-cols-[1.4fr_1fr]">
      <section>
        <SectionTitle>{t("sheet.weekCalendar")}</SectionTitle>
        <div className="grid grid-cols-[32px_repeat(5,1fr)] gap-x-1 text-[10px]">
          <span />
          {days.map((d, i) => (
            <span key={d} className="pb-1 text-center font-semibold">
              {d} {start ? new Date(start.getTime() + i * 86400_000).getDate() : ""}
            </span>
          ))}
          <div className="relative" style={{ height: 300 }}>
            {Array.from({ length: H1 - H0 + 1 }, (_, h) => (
              <span key={h} className="absolute right-1 text-muted" style={{ top: `${(h / (H1 - H0)) * 100}%`, transform: "translateY(-50%)" }}>
                {t("sheet.hourTick", { hour: H0 + h })}
              </span>
            ))}
          </div>
          {days.map((d, i) => {
            const d0 = start ? start.getTime() + i * 86400_000 : 0;
            const evs = (sheet?.calendar ?? []).filter((c) => Date.parse(c.starts_at) >= d0 && Date.parse(c.starts_at) < d0 + 86400_000);
            return (
              <div key={d} className="relative rounded-lg bg-ground/50" style={{ height: 300 }}>
                {evs.map((c) => {
                  const s = new Date(c.starts_at);
                  const en = new Date(c.ends_at);
                  const top = Math.max(0, (s.getHours() + s.getMinutes() / 60 - H0) / (H1 - H0));
                  const bottom = Math.min(1, (en.getHours() + en.getMinutes() / 60 - H0) / (H1 - H0));
                  if (["teletravail", "deplacement"].includes(c.type)) return <div key={c.id} title={c.title} role="img" aria-label={c.title} className="absolute inset-x-0.5 inset-y-0 rounded-md bg-matcha/15" />;
                  return (
                    <div key={c.id} title={c.title} className="absolute inset-x-0.5 overflow-hidden rounded-md bg-brand px-1 py-0.5 text-[9px] leading-tight text-ground" style={{ top: `${top * 100}%`, height: `${Math.max(4, (bottom - top) * 100)}%` }}>
                      {formatTime(c.starts_at)} {c.title}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        <SectionTitle aside={t("sheet.weekTotal", { hours: formatNumber(worked.reduce((a, b) => a + b, 0), "fr", 1) })}>{t("sheet.weekTimesheet")}</SectionTitle>
        <div className="flex h-28 items-end gap-3">
          {worked.map((h, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <span className="text-[10px] text-muted">{h ? t("common.hours", { value: formatNumber(h, "fr", 1) }) : "—"}</span>
              <div role="img" aria-label={t("sheet.dayWorked", { day: days[i], hours: formatNumber(h, "fr", 1) })} className="w-full rounded-t-md bg-accent/80" style={{ height: `${Math.min(1, h / 10) * 80}px` }} />
              <span className="text-[10px] font-semibold">{days[i]}</span>
            </div>
          ))}
        </div>
      </section>
      <section>
        <SectionTitle>{t("sheet.contractBenefits")}</SectionTitle>
        <Row label={t("sheet.contract")}>{e.contract} · {Math.round(e.workRate * 100)} %</Row>
        <Row label={t("sheet.hired")}>{formatDate(e.hiredOn)}</Row>
        <Row label={t("common.manager")}>{sheet?.manager ? `${sheet.manager.first_name} ${sheet.manager.last_name}` : "—"}</Row>
        <Row label={t("sheet.benefits")}>{t("sheet.benefitsValue")}</Row>
        <Row label={t("sheet.leaveBalance")}>{t("common.days", { value: formatNumber(e.leaveBalance, "fr", 1) })}</Row>
        {seesSalaries ? (
          <Row label={t("common.annualSalary")}>
            <SalaryReveal key={e.id} employeeId={e.id} />
          </Row>
        ) : null}
        <SectionTitle>{t("sheet.recentTime")}</SectionTitle>
        {(sheet?.time ?? []).length === 0 && <p className="text-xs text-muted">{t("sheet.noRecentTime")}</p>}
        {(sheet?.time ?? []).map((entry, i) => (
          <Row key={i} label={formatDate(entry.workedOn)}>
            {entry.wo?.number ?? "—"} · {t("common.hours", { value: formatNumber(entry.hours, "fr", 2) })}
          </Row>
        ))}
        <SectionTitle>{t("common.skills")}</SectionTitle>
        <div className="flex flex-wrap gap-1.5">
          {e.skills.map((k) => (
            <span key={k} className="rounded-full bg-ground px-2 py-0.5 text-[11px]">{k}</span>
          ))}
        </div>
        <SectionTitle>{t("sheet.documents")}</SectionTitle>
        {(sheet?.documents ?? []).map((d) => (
          <Row key={d.name} label={d.kind ?? t("sheet.documentFallback")}>
            {d.name}
          </Row>
        ))}
        {sheet && sheet.documents.length === 0 && <p className="text-xs text-muted">{t("sheet.noDocuments")}</p>}
      </section>
    </div>
  );
}

function WorkOrderContent({ w, sheet }: { w: NonNullable<ReturnType<typeof useMap.getState>["snapshot"]>["workOrders"][number]; sheet: WoSheet | null }) {
  const t = useTranslations("map");
  const totals = sheet ? computeTotals(sheet.lines.map((l) => ({ quantity: l.quantity, unitPrice: l.unitPrice, unitCost: l.unitCost, vatRate: l.vatRate }))) : null;
  return (
    <div className="grid gap-6 pt-4 lg:grid-cols-[1.5fr_1fr]">
      <section>
        <SectionTitle>{t("sheet.quoteLines")}</SectionTitle>
        <table className="w-full text-[13px]">
          <thead>
            <tr className="text-left text-[11px] text-muted">
              <th className="py-1 font-medium">{t("sheet.item")}</th>
              <th className="py-1 text-right font-medium">{t("sheet.qty")}</th>
              <th className="py-1 text-right font-medium">{t("sheet.unitPrice")}</th>
              <th className="py-1 text-right font-medium">{t("sheet.vat")}</th>
              <th className="py-1 text-right font-medium">{t("sheet.totalHt")}</th>
            </tr>
          </thead>
          <tbody>
            {(sheet?.lines ?? []).map((l, i) => (
              <tr key={i} className="border-t border-black/5">
                <td className="py-1.5">{l.label}</td>
                <td className="text-right font-mono">{formatNumber(l.quantity)}</td>
                <td className="text-right font-mono">{formatMoney(l.unitPrice)}</td>
                <td className="text-right font-mono">{formatNumber(l.vatRate * 100, "fr", 1)} %</td>
                <td className="text-right font-mono">{formatMoney(l.quantity * l.unitPrice)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {sheet && sheet.lines.length === 0 && <p className="text-xs text-muted">{t("sheet.noQuote")}</p>}
        {totals && totals.ht > 0 && (
          <div className="ml-auto mt-3 w-64 text-[13px]">
            <Row label={t("sheet.totalHt")}>{formatMoney(totals.ht)}</Row>
            {totals.vatByRate.map((v) => (
              <Row key={v.rate} label={t("sheet.vatRate", { rate: formatNumber(v.rate * 100, "fr", 1) })}>
                {formatMoney(v.vat)}
              </Row>
            ))}
            <Row label={t("sheet.totalTtc")}>{formatMoney(totals.ttc)}</Row>
            <Row label={t("sheet.margin")}>{formatMoney(totals.margin)} · {formatNumber((totals.marginRate ?? 0) * 100, "fr", 1)} %</Row>
          </div>
        )}
        <SectionTitle>{t("sheet.tasks")}</SectionTitle>
        {(sheet?.tasks ?? []).map((task) => (
          <Row key={task.title} label={task.status === "done" ? t("sheet.taskDone") : task.status === "doing" ? t("sheet.taskDoing") : t("sheet.taskTodo")}>
            {task.title}
          </Row>
        ))}
      </section>
      <section>
        <SectionTitle>{t("common.account")}</SectionTitle>
        <Row label={t("sheet.name")}>{w.clientName}</Row>
        <Row label={t("sheet.segment")}>{String(sheet?.client?.segment ?? "—")}</Row>
        <Row label={t("sheet.city")}>{String(sheet?.client?.city ?? "—")}</Row>
        <Row label={t("sheet.preferredContact")}>{String(sheet?.client?.preferred_channel ?? "—")}</Row>
        {sheet?.client?.internal_note ? <p className="mt-2 rounded-lg bg-ground/70 p-2 text-xs">{String(sheet.client.internal_note)}</p> : null}
        <SectionTitle>{t("sheet.stages", { count: sectorConfig.objetMetierCentral.etapes.length })}</SectionTitle>
        {w.stages.map((s, i) => (
          <Row key={i} label={sectorConfig.objetMetierCentral.etapes.find((x) => x.id === s.stage)?.libelle ?? s.stage}>
            {formatDate(s.enteredAt)} · {formatTime(s.enteredAt)}
          </Row>
        ))}
        <SectionTitle>{t("sheet.invoices")}</SectionTitle>
        {(sheet?.invoices ?? []).map((i) => (
          <Row key={i.number} label={i.number}>
            {formatMoney(Number(i.total_ttc))} · {i.status}
          </Row>
        ))}
        {sheet && sheet.invoices.length === 0 && <p className="text-xs text-muted">{t("sheet.notInvoiced")}</p>}
        <SectionTitle>{t("sheet.exchanges")}</SectionTitle>
        {(sheet?.threads ?? []).map((th) => (
          <Row key={th.subject} label={t("sheet.email")}>
            {th.subject}
          </Row>
        ))}
        {(sheet?.documents ?? []).map((d) => (
          <Row key={d.name} label={d.kind ?? t("sheet.docFallback")}>
            {d.name}
          </Row>
        ))}
      </section>
    </div>
  );
}
