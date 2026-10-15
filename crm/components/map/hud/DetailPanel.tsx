"use client";
/** Fiche résumée de l'objet sélectionné, selon son type. */
import Link from "next/link";
import { useEffect, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { sectorConfig } from "@/config/sector.config";
import { formatDate, formatMoney, formatNumber, formatTime } from "@/lib/format";
import { backOfficeHref } from "@/lib/map/links";
import type { MapAsset, MapEmployee, MapSnapshot, MapWorkOrder } from "@/lib/map/snapshot";
import { useMap } from "@/lib/map/store";
import { revealSalary } from "@/app/(tech)/tech/actions";
import { assignAsset, occupyRoom, releaseRoom } from "@/app/(map)/map/actions";
import { engineRef } from "../engine/engine";
import { Bar, Icon, Pill, Ring, Row, SectionTitle, panel } from "./ui";

export function useNow(ms = 1000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(t);
  }, [ms]);
  return now;
}

const minutes = (from: string | null, now: number) => (from ? Math.max(0, Math.round((now - Date.parse(from)) / 60000)) : 0);
const dur = (min: number) => (min >= 60 ? `${Math.floor(min / 60)} h ${String(min % 60).padStart(2, "0")}` : `${min} min`);
const stageLabel = (id: string) => sectorConfig.objetMetierCentral.etapes.find((s) => s.id === id)?.libelle ?? id;
const zoneName = (s: MapSnapshot, id: string | null) => s.zones.find((z) => z.id === id || z.key === id)?.name ?? "—";
/** Traducteur de l'espace « map » transmis aux fonctions de rendu hors composant. */
type T = ReturnType<typeof useTranslations<"map">>;
/** Locale des noms de jours / mois (les nombres et heures gardent le format régional : lib/format). */
export const dateLocale = (locale: string) => (locale === "en" ? "en-GB" : locale === "fr" ? "fr-FR" : locale);

export function DetailPanel() {
  const sel = useMap((s) => s.selection);
  const snap = useMap((s) => s.snapshot);
  const following = useMap((s) => s.following);
  const set = useMap((s) => s.set);
  const t = useTranslations("map");
  if (!sel || !snap) return null;

  const href = backOfficeHref(sel.entityType === "vehicles" ? "assets" : sel.entityType, sel.entityId);
  const content = renderContent(sel, snap, t);
  return (
    <aside aria-label={t("detail.sheetLabel", { label: sel.label })} className={`${panel} pointer-events-auto flex max-h-full w-[360px] flex-col overflow-hidden`}>
      <header className="flex items-start gap-3 border-b border-black/5 p-4">
        {content.avatar}
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-accent">{content.kicker}</p>
          <h2 className="truncate text-[17px] font-semibold leading-tight tracking-tight">{content.title}</h2>
          {content.subtitle && <p className="truncate text-xs text-muted">{content.subtitle}</p>}
        </div>
        <div className="flex gap-1">
          {(sel.kind === "person" || sel.kind === "vehicle") && (
            <button aria-label={t("detail.follow")} aria-pressed={following} title={t("detail.follow")} onClick={() => set({ following: !following })} className={`grid size-7 place-items-center rounded-full ring-1 ring-black/10 ${following ? "bg-accent text-white" : "hover:bg-black/5"}`}>
              <Icon name="target" size={14} />
            </button>
          )}
          <button aria-label={t("common.fullSheet")} title={t("common.fullSheet")} onClick={() => set({ sheetOpen: true })} className="grid size-7 place-items-center rounded-full ring-1 ring-black/10 hover:bg-black/5">
            <Icon name="expand" size={14} />
          </button>
          <button aria-label={t("common.close")} title={t("detail.closeTitle")} onClick={() => engineRef.current?.selectPick(null, false)} className="grid size-7 place-items-center rounded-full ring-1 ring-black/10 hover:bg-black/5">
            <Icon name="x" size={14} />
          </button>
        </div>
      </header>
      <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{content.body}</div>
      <footer className="flex gap-2 border-t border-black/5 p-3">
        <button onClick={() => set({ sheetOpen: true })} className="flex-1 rounded-xl bg-accent px-3 py-2 text-sm font-medium text-white hover:brightness-95">
          {t("common.fullSheet")}
        </button>
        {href ? (
          <Link href={href} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium ring-1 ring-black/10 hover:bg-black/5">
            <Icon name="external" size={14} /> {t("common.backoffice")}
          </Link>
        ) : null}
      </footer>
    </aside>
  );
}

interface Content {
  kicker: string;
  title: string;
  subtitle?: string;
  avatar?: React.ReactNode;
  body: React.ReactNode;
}

function renderContent(sel: NonNullable<ReturnType<typeof useMap.getState>["selection"]>, s: MapSnapshot, t: T): Content {
  if (sel.entityType === "employees") {
    const e = s.employees.find((x) => x.id === sel.entityId);
    if (e) return { kicker: t("detail.employeeKicker", { department: e.department ?? "" }), title: `${e.firstName} ${e.lastName}`, subtitle: e.jobTitle, avatar: <Avatar e={e} />, body: <PersonBody e={e} s={s} /> };
  }
  if (sel.entityType === "work_orders") {
    const w = s.workOrders.find((x) => x.id === sel.entityId);
    if (w) return { kicker: `${sectorConfig.objetMetierCentral.nom} · ${stageLabel(w.stage)}`, title: w.clientName ?? w.number, subtitle: `${w.number} · ${w.title}`, avatar: <Square icon="box" label={sectorConfig.objetMetierCentral.nom} />, body: <WorkOrderBody w={w} s={s} /> };
  }
  if (sel.entityType === "lots") {
    const l = s.lots.find((x) => x.id === sel.entityId);
    const item = s.stock.find((x) => x.id === l?.stockItemId);
    if (l)
      return {
        kicker: t("detail.lotKicker"),
        title: t("common.lot", { number: l.number }),
        subtitle: item?.name,
        avatar: <Square icon="box" label={t("detail.lotKicker")} />,
        body: (
          <div className="pt-3">
            <div className="flex gap-2">
              <Pill tone={l.status === "quarantaine" ? "warn" : l.status === "libere" ? "ok" : "muted"}>{l.status === "quarantaine" ? t("detail.inQuarantine") : l.status}</Pill>
            </div>
            <Row label={t("detail.quantity")}>{t("detail.boxes", { count: formatNumber(l.quantity) })}</Row>
            <Row label={t("detail.received")}>{l.receivedAt ? `${formatDate(l.receivedAt)} · ${formatTime(l.receivedAt)}` : "—"}</Row>
            <Row label={t("detail.bestBefore")}>{l.bestBefore ? formatDate(l.bestBefore) : "—"}</Row>
            <SectionTitle>{t("detail.receptionControl")}</SectionTitle>
            {(["coa", "visual", "weighing", "opening", "tasting"] as const).map((k, i) => (
              <Check key={k} label={t(`detail.lotChecks.${k}`)} done={l.status !== "quarantaine" || i === 0} />
            ))}
          </div>
        ),
      };
  }
  if (sel.entityType === "stock_rack") {
    const letter = sel.entityId.replace("rack:", "");
    const items = s.stock.filter((x) => x.location?.startsWith(letter));
    const value = items.reduce((v, x) => v + x.quantity * x.unitCost, 0);
    return {
      kicker: t("detail.rackKicker"),
      title: t("common.rack", { letter }),
      subtitle: t("detail.rackSubtitle", { count: items.length, value: formatMoney(value, "fr", 0) }),
      avatar: <Square icon="layers" label={t("detail.rackKicker")} />,
      body: (
        <div className="pt-2">
          {items.map((x) => {
            const low = x.quantity < x.minQuantity;
            return (
              <div key={x.id} className="border-b border-black/5 py-2 text-[13px]">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-medium">{x.name}</span>
                  <Pill tone={x.onOrder ? "muted" : low ? "accent" : "ok"}>{x.onOrder ? t("common.ordered") : x.quantity === 0 ? t("detail.outOfStock") : low ? t("common.lowStock") : t("common.inStock")}</Pill>
                </div>
                <div className="mt-1 flex items-center gap-2 text-xs text-muted">
                  <span className="font-mono">{x.location}</span>
                  <Bar value={x.quantity / Math.max(1, x.minQuantity * 2)} tone={low ? "accent" : "ok"} className="flex-1" />
                  <span className="font-mono">
                    {formatNumber(x.quantity)} / {formatNumber(x.minQuantity)}
                  </span>
                </div>
              </div>
            );
          })}
          {items.some((x) => x.quantity < x.minQuantity && !x.onOrder) && (
            <button className="mt-3 w-full rounded-xl bg-brand px-3 py-2 text-sm font-medium text-ground" onClick={() => useMap.getState().toast({ title: t("detail.purchaseOrderTitle"), detail: t("detail.purchaseOrderDetail"), tone: "ok" })}>
              {t("detail.orderMissing")}
            </button>
          )}
        </div>
      ),
    };
  }
  if (sel.entityType === "zones") {
    const z = s.zones.find((x) => x.key === sel.entityId);
    return { kicker: t("detail.zoneKicker", { code: z?.code ?? "" }), title: z?.name ?? sel.label, subtitle: z?.description ?? undefined, avatar: <Square icon="map" label={z?.name ?? sel.label} />, body: <ZoneBody zoneKey={sel.entityId} s={s} /> };
  }
  if (sel.entityType === "vehicles") {
    return {
      kicker: t("detail.externalVehicle"),
      title: sel.label,
      subtitle: t("detail.thirdPartyTransport"),
      avatar: <Square icon="truck" label={t("detail.externalVehicle")} />,
      body: (
        <div className="pt-3 text-[13px]">
          <Row label={t("detail.status")}>{t("detail.maneuvering")}</Row>
          <Row label={t("detail.slot")}>{formatTime(new Date())}</Row>
          <p className="mt-3 text-xs text-muted">{t("detail.externalVehicleNote")}</p>
        </div>
      ),
    };
  }
  const a = s.assets.find((x) => x.id === sel.entityId);
  if (a) return assetContent(a, s, t);
  const obj = engineRef.current?.world.objects.get(sel.entityId);
  const p = obj?.def.params ?? {};
  return {
    kicker: t("detail.object"),
    title: sel.label,
    avatar: <Square icon="box" label={t("detail.object")} />,
    body: (
      <div className="pt-3">
        {p.title ? <Row label={t("detail.artwork")}>{String(p.title)}</Row> : null}
        {p.author ? <Row label={t("detail.author")}>{String(p.author)}</Row> : null}
        {p.value ? <Row label={t("detail.insuredValue")}>{formatMoney(Number(p.value), "fr", 0)}</Row> : null}
        <Row label={t("detail.location")}>{zoneName(s, obj?.def.zone ?? null)}</Row>
      </div>
    ),
  };
}

function assetContent(a: MapAsset, s: MapSnapshot, t: T): Content {
  const tel = a.telemetry as Record<string, unknown>;
  const owner = s.employees.find((e) => e.id === a.assignedEmployeeId);
  const base = { avatar: <Square icon={a.type === "vehicule" ? "truck" : a.type === "imprimante" ? "print" : a.type === "salle" ? "users" : "box"} label={a.name} />, subtitle: zoneName(s, a.zoneId) };
  switch (a.type) {
    case "poste_informatique": {
      const session = !owner ? "offline" : owner.status === "au_poste" ? "active" : owner.status === "teletravail" ? "remote" : owner.status === "reunion" || owner.status === "pause" ? "locked" : "offline";
      return {
        ...base,
        kicker: t("detail.computer"),
        title: a.name,
        body: (
          <div className="pt-3">
            <Row label={t("detail.user")}>{owner ? `${owner.firstName} ${owner.lastName}` : "—"}</Row>
            <Row label={t("detail.sessionLabel")}>
              <Pill tone={session === "active" ? "ok" : session === "remote" ? "teletravail" : "muted"}>{t(`detail.session.${session}`)}</Pill>
            </Row>
            <Row label={t("detail.since")}>{owner?.firstIn ? formatTime(owner.firstIn) : "—"}</Row>
            <Row label={t("detail.application")}>{String(tel.app ?? "—")}</Row>
            <SectionTitle>{t("detail.resources")}</SectionTitle>
            <Live label="CPU" base={Number(tel.cpu ?? 0.2)} />
            <Live label="RAM" base={Number(tel.ram ?? 0.5)} />
            <Row label={t("detail.updates")}>{tel.maj_en_attente ? <Pill tone="warn">{t("detail.updatePending")}</Pill> : <Pill tone="ok">{t("detail.upToDate")}</Pill>}</Row>
            <Row label={t("detail.security")}>{t("detail.securityValue")}</Row>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Action label={t("detail.remoteControl")} icon="external" detail={t("detail.simulatedAction")} />
              <Action label={t("detail.lock")} icon="lock" detail={t("detail.simulatedAction")} />
            </div>
          </div>
        ),
      };
    }
    case "imprimante": {
      const bacs = (tel.bacs as { nom: string; niveau: number }[]) ?? [];
      const toner = (tel.toner as Record<string, number>) ?? {};
      const colors: Record<string, string> = { noir: "#24261F", cyan: "#2BA6C8", magenta: "#C83A8C", jaune: "#E3C341" };
      return {
        ...base,
        kicker: t("detail.printer"),
        title: a.name,
        body: (
          <div className="pt-2">
            <SectionTitle>{t("detail.paper")}</SectionTitle>
            {bacs.map((b) => (
              <div key={b.nom} role="img" aria-label={t("detail.paperTray", { tray: b.nom, percent: Math.round(b.niveau * 100) })} className="flex items-center gap-2 py-1 text-[13px]">
                <span className="w-8 font-mono text-xs">{b.nom}</span>
                <Bar value={b.niveau} tone={b.niveau < 0.25 ? "accent" : "ok"} className="flex-1" />
                <span className="w-10 text-right text-xs">{Math.round(b.niveau * 100)} %</span>
              </div>
            ))}
            {Object.keys(toner).length > 0 && (
              <>
                <SectionTitle>{t("detail.ink")}</SectionTitle>
                <div className="flex items-end gap-3">
                  {Object.entries(toner).map(([k, v]) => (
                    <div key={k} role="img" aria-label={t("detail.inkLevel", { color: t.has(`detail.inkColors.${k}`) ? t(`detail.inkColors.${k}`) : k, percent: Math.round(v * 100) })} className="flex flex-col items-center gap-1">
                      <div className="flex h-14 w-6 items-end overflow-hidden rounded-md bg-black/5 ring-1 ring-black/10">
                        <div style={{ height: `${v * 100}%`, background: colors[k] }} className="w-full" />
                      </div>
                      <span className={`text-[10px] ${v < 0.2 ? "font-semibold text-accent" : "text-muted"}`}>{Math.round(v * 100)}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
            <Row label={t("detail.pagesToday")}>{formatNumber(Number(tel.pages_jour ?? 0) + 140)}</Row>
            <Row label={t("detail.costPerPage")}>{formatMoney(Number(tel.cout_page ?? 0.01), "fr", 3)}</Row>
            <button className="mt-3 w-full rounded-xl bg-brand px-3 py-2 text-sm font-medium text-ground" onClick={() => useMap.getState().toast({ title: t("detail.suppliesTitle"), detail: t("detail.suppliesDetail"), tone: "info" })}>
              {t("detail.prepareOrder")}
            </button>
          </div>
        ),
      };
    }
    case "salle": {
      const now = Date.now();
      const events = s.calendar.filter((c) => c.resourceId === a.id);
      const current = events.find((c) => Date.parse(c.startsAt) <= now && Date.parse(c.endsAt) > now);
      const people = current ? s.employees.filter((e) => current.attendees.includes(e.id) || current.ownerId === e.id) : [];
      return {
        ...base,
        kicker: t("detail.room"),
        title: a.name,
        subtitle: t("detail.roomSubtitle", { places: String((a.specs.places as number) ?? ""), equipment: ((a.specs.equipement as string[]) ?? []).join(", ") }),
        body: (
          <div className="pt-3">
            <Pill tone={current ? "accent" : "ok"}>{current ? t("detail.occupied") : t("common.free")}</Pill>
            {current && (
              <div className="mt-3 rounded-xl bg-ground/60 p-3">
                <p className="text-sm font-semibold">{current.title}</p>
                <p className="text-xs text-muted">{t("detail.endsIn", { duration: dur(Math.max(0, Math.round((Date.parse(current.endsAt) - now) / 60000))) })}</p>
                <p className="mt-1 text-xs">{people.map((p) => p.firstName).join(", ")}</p>
              </div>
            )}
            <SectionTitle>{t("detail.todayBookings")}</SectionTitle>
            {events.map((c) => (
              <Row key={c.id} label={`${formatTime(c.startsAt)}–${formatTime(c.endsAt)}`}>
                {c.title}
              </Row>
            ))}
            <RoomActions assetId={a.id} current={current ? { id: current.id, title: current.title } : null} />
          </div>
        ),
      };
    }
    case "vehicule":
      return {
        ...base,
        kicker: t("detail.fleetVehicle"),
        title: a.name,
        subtitle: String(a.specs.plaque ?? a.specs.energie ?? ""),
        body: (
          <div className="pt-3">
            <Row label={t("detail.energy")}>{String(a.specs.energie ?? "—")}</Row>
            <Row label={t("detail.mileage")}>{formatNumber(Number(tel.km ?? 0))} km</Row>
            <Row label={t("detail.battery")}>
              <span className="flex items-center gap-2">
                <Bar value={Number(tel.batterie ?? 0)} tone="ok" className="w-20" /> {Math.round(Number(tel.batterie ?? 0) * 100)} %{tel.en_charge ? t("detail.charging") : ""}
              </span>
            </Row>
            <Row label={t("detail.service")}>{a.nextMaintenanceOn ? formatDate(a.nextMaintenanceOn) : "—"}</Row>
            <AssignControl assetId={a.id} assigned={a.assignedEmployeeId} s={s} />
            <SectionTitle>{t("detail.bookings")}</SectionTitle>
            {s.bookings.filter((b) => b.assetId === a.id).map((b, i) => (
              <Row key={i} label={`${formatTime(b.startsAt)}–${formatTime(b.endsAt)}`}>
                {b.title}
              </Row>
            ))}
          </div>
        ),
      };
    default: {
      // Machines et équipements (tables de pack, set de tournage, balances, armoire, badgeuse…)
      const table = engineRef.current ? [...engineRef.current.world.objects.values()].find((o) => o.def.entity?.id === a.id) : undefined;
      const operatorSlot = table?.def.workspots?.find((w) => w.owner)?.owner;
      const operator = operatorSlot ? s.employees.find((e) => e.slot === operatorSlot) : undefined;
      const station = Number(table?.def.params?.index ?? 0);
      const queue = station ? s.shopToday.byStation[station] ?? 0 : 0;
      return {
        ...base,
        kicker: a.key === "badgeuse" ? t("detail.badgeReader") : t("detail.equipment"),
        title: a.name,
        body: a.key === "badgeuse" ? <BadgeLog s={s} /> : (
          <div className="pt-3">
            <Row label={t("detail.state")}>
              <Pill tone={a.status === "ok" || a.status === "en_service" ? "ok" : "warn"}>{a.status === "ok" ? t("detail.inService") : a.status}</Pill>
            </Row>
            {operator && <Row label={t("detail.operator")}>{`${operator.firstName} ${operator.lastName}`}</Row>}
            {operator && <Row label={t("detail.occupancy")}>{operator.status === "au_poste" ? t("detail.busy") : t("common.free")}</Row>}
            {station > 0 && <Row label={t("detail.queue")}>{t("detail.queueValue", { count: queue })}</Row>}
            {"temperature_c" in tel && <Live label={t("detail.temperature")} base={Number(tel.temperature_c)} unit="°C" spread={0.3} />}
            {"humidite" in tel && <Row label={t("detail.humidity")}>{Math.round(Number(tel.humidite) * 100)} %</Row>}
            {"boites" in tel && <Row label={t("detail.samples")}>{t("detail.sealedBoxes", { count: String(tel.boites) })}</Row>}
            {"batterie" in tel && <Row label={t("detail.battery")}>{Math.round(Number(tel.batterie) * 100)} %</Row>}
            {"boissons_jour" in tel && <Row label={t("detail.drinksToday")}>{String(Number(tel.boissons_jour) + 46)}</Row>}
            {a.key === "thermoscelleuse" && <CycleCountdown />}
            <Row label={t("detail.maintenance")}>{a.nextMaintenanceOn ? formatDate(a.nextMaintenanceOn) : "—"}</Row>
          </div>
        ),
      };
    }
  }
}

function PersonBody({ e, s }: { e: MapEmployee; s: MapSnapshot }) {
  const now = useNow(1000);
  const t = useTranslations("map");
  const locale = useLocale();
  const presentMin = e.firstIn ? minutes(e.firstIn, now) : 0;
  const pc = s.assets.find((a) => a.type === "poste_informatique" && a.assignedEmployeeId === e.id);
  const wo = s.workOrders.find((w) => w.ownerId === e.id && !["livree", "facturee"].includes(w.stage));
  const manager = s.employees.find((m) => m.id === e.managerId);
  const years = (now - Date.parse(e.hiredOn)) / (365.25 * 86400_000);
  const today = s.calendar.filter((c) => c.ownerId === e.id || c.attendees.includes(e.id));
  return (
    <div className="pt-3">
      <div className="flex flex-wrap items-center gap-2">
        <Pill tone={e.status} />
        {e.status === "pause" && e.since && <span className="text-xs text-muted">{t("detail.sinceDuration", { duration: dur(minutes(e.since, now)) })}</span>}
        {e.currentEvent && <span className="truncate text-xs text-muted">{e.currentEvent}</span>}
      </div>
      <Row label={t("detail.whereabouts")}>{zoneName(s, e.zoneId)}</Row>
      <Row label={t("detail.entryBadge")}>{e.firstIn ? formatTime(e.firstIn) : "—"}</Row>
      <Row label={t("detail.presenceToday")}>{e.firstIn ? dur(presentMin) : "—"}</Row>
      <Row label={t("detail.seniority")}>{years < 1 ? t("detail.months", { count: Math.round(years * 12) }) : t("detail.years", { count: years.toFixed(1).replace(".", ",") })}</Row>
      <Row label={t("detail.leaveBalance")}>{t("common.days", { value: formatNumber(e.leaveBalance, "fr", 1) })}</Row>
      <Row label={t("detail.overtime")}>{t("common.hours", { value: formatNumber(e.overtime, "fr", 2) })}</Row>
      {s.me.seesSalaries && (
        <Row label={t("common.annualSalary")}>
          <SalaryReveal key={e.id} employeeId={e.id} />
        </Row>
      )}
      {wo && (
        <Row label={t("detail.currentFile")}>
          <button className="text-accent hover:underline" onClick={() => engineRef.current?.selectPick(`wo:${wo.id}`)}>
            {wo.number}
          </button>
        </Row>
      )}
      {pc && (
        <Row label={t("detail.computer")}>
          <button className="text-accent hover:underline" onClick={() => { const id = engineRef.current?.resolve("assets", pc.id); if (id) engineRef.current?.selectPick(id); }}>
            {pc.name}
          </button>
        </Row>
      )}
      {manager && <Row label={t("common.manager")}>{`${manager.firstName} ${manager.lastName}`}</Row>}
      <SectionTitle aside={new Date(now).toLocaleDateString(dateLocale(locale), { weekday: "long", day: "numeric", month: "long", timeZone: sectorConfig.entreprise.fuseau })}>{t("detail.todayAgenda")}</SectionTitle>
      <DayTimeline events={today} now={now} />
      <SectionTitle>{t("common.skills")}</SectionTitle>
      <div className="flex flex-wrap gap-1.5">
        {e.skills.map((k) => (
          <span key={k} className="rounded-full bg-ground px-2 py-0.5 text-[11px]">{k}</span>
        ))}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <a href={`mailto:${e.email}`} className="flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-medium ring-1 ring-black/10 hover:bg-black/5">
          <Icon name="mail" size={13} /> {t("detail.message")}
        </a>
        <a href={`tel:${e.phone}`} className="flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-medium ring-1 ring-black/10 hover:bg-black/5">
          <Icon name="phone" size={13} /> {t("detail.call")}
        </a>
      </div>
    </div>
  );
}

export function SalaryReveal({ employeeId }: { employeeId: string }) {
  // Remis à zéro par la clé du composant (key={employeeId}) à chaque changement de personne
  const [v, setV] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const t = useTranslations("map");
  if (v) return <span className="font-mono" title={t("detail.revealedTitle")}>{v}</span>;
  return (
    <button
      disabled={pending}
      onClick={() =>
        start(async () => {
          const r = await revealSalary(employeeId);
          setV("salary" in r && r.salary ? `${formatMoney(r.salary.gross_annual, "fr", 0)} × ${r.salary.months}` : "—");
        })
      }
      className="group inline-flex items-center gap-2"
    >
      <span className="select-none font-mono blur-[5px]" aria-hidden>
        00 000 €
      </span>
      <span className="rounded-full bg-accent/12 px-2 py-0.5 text-[11px] text-accent group-hover:bg-accent group-hover:text-white">{t("detail.reveal")}</span>
    </button>
  );
}

export function DayTimeline({ events, now }: { events: MapSnapshot["calendar"]; now: number }) {
  const t = useTranslations("map");
  // Début de la frise : 7 h, heure du site
  const local = new Date(new Date(now).toLocaleString("en-US", { timeZone: sectorConfig.entreprise.fuseau }));
  const d0 = new Date(now - ((local.getHours() - 7) * 3600 + local.getMinutes() * 60 + local.getSeconds()) * 1000);
  const span = 11 * 3600_000;
  const pos = (t: number) => Math.max(0, Math.min(1, (t - d0.getTime()) / span)) * 100;
  const upcoming = events.filter((c) => Date.parse(c.endsAt) > now).slice(0, 3);
  return (
    <div>
      <div className="relative h-7 rounded-lg bg-ground/70" role="group" aria-label={t("detail.timelineLabel")}>
        {events.map((c) => (
          <div key={c.id} title={c.title} role="img" aria-label={t("detail.timelineEvent", { start: formatTime(c.startsAt), end: formatTime(c.endsAt), title: c.title })} className={`absolute top-1 h-5 rounded-md ${c.type === "teletravail" || c.type === "deplacement" ? "bg-matcha/40" : "bg-brand/80"}`} style={{ left: `${pos(Date.parse(c.startsAt))}%`, width: `${Math.max(1.5, pos(Date.parse(c.endsAt)) - pos(Date.parse(c.startsAt)))}%` }} />
        ))}
        <div className="absolute inset-y-0 w-0.5 bg-accent" style={{ left: `${pos(now)}%` }} />
      </div>
      <div className="mt-0.5 flex justify-between text-[10px] text-muted">
        {["7 h", "9 h", "11 h", "13 h", "15 h", "18 h"].map((h) => (
          <span key={h}>{h}</span>
        ))}
      </div>
      {upcoming.map((c) => (
        <Row key={c.id} label={formatTime(c.startsAt)}>
          {c.title}
        </Row>
      ))}
      {upcoming.length === 0 && <p className="text-xs text-muted">{t("detail.nothingPlanned")}</p>}
    </div>
  );
}

function WorkOrderBody({ w, s }: { w: MapWorkOrder; s: MapSnapshot }) {
  const t = useTranslations("map");
  const owner = s.employees.find((e) => e.id === w.ownerId);
  return (
    <div className="pt-3">
      <div className="flex items-center gap-2">
        <Pill tone={w.status === "attente" ? "warn" : w.stage === "livree" || w.stage === "facturee" ? "ok" : "accent"}>{w.status === "attente" ? t("common.waiting") : stageLabel(w.stage)}</Pill>
        <span className="text-xs text-muted">{zoneName(s, w.zoneId)}</span>
      </div>
      <div className="mt-2 flex items-center gap-2">
        <Bar value={w.progress} tone="accent" className="flex-1" />
        <span className="text-xs text-muted">{Math.round(w.progress * 100)} %</span>
      </div>
      {w.blockedReason && <p className="mt-2 rounded-lg bg-warn/12 px-2.5 py-1.5 text-xs text-[#8a5d08]">{w.blockedReason}</p>}
      <Row label={t("common.account")}>{w.clientName}</Row>
      <Row label={t("detail.parcel")}>{w.physicalObject ?? "—"}</Row>
      <Row label={t("detail.owner")}>{owner ? `${owner.firstName} ${owner.lastName}` : "—"}</Row>
      <Row label={t("detail.amountTtc")}>{formatMoney(w.amountTtc)}</Row>
      <Row label={t("detail.receivedFem")}>{w.receivedAt ? `${formatDate(w.receivedAt)} · ${formatTime(w.receivedAt)}` : "—"}</Row>
      <Row label={t("detail.dueDate")}>{w.dueAt ? `${formatDate(w.dueAt)} · ${formatTime(w.dueAt)}` : "—"}</Row>
      <SectionTitle aside={`${w.checklist.filter((c) => c.done).length}/${w.checklist.length}`}>{t("detail.checklist")}</SectionTitle>
      {w.checklist.map((c) => (
        <Check key={c.label} label={c.label} done={c.done} progress={c.progress ?? undefined} />
      ))}
      <SectionTitle>{t("detail.history")}</SectionTitle>
      {w.stages.map((st, i) => (
        <Row key={i} label={stageLabel(st.stage)}>
          {formatDate(st.enteredAt)} · {formatTime(st.enteredAt)}
        </Row>
      ))}
      <button className="mt-3 w-full rounded-xl px-3 py-2 text-sm font-medium ring-1 ring-black/10 hover:bg-black/5" onClick={() => useMap.getState().toast({ title: t("detail.clientMessageTitle", { client: w.clientName ?? "" }), detail: t("detail.clientMessageDetail", { number: w.number, stage: stageLabel(w.stage) }), tone: "ok" })}>
        {t("detail.notifyClient")}
      </button>
    </div>
  );
}

function ZoneBody({ zoneKey, s }: { zoneKey: string; s: MapSnapshot }) {
  const now = useNow(1000);
  const t = useTranslations("map");
  const zone = s.zones.find((z) => z.key === zoneKey);
  const sim = engineRef.current?.sim;
  const inside = s.employees.filter((e) => {
    const a = sim?.agentByEmployee(e.id);
    return a?.onSite && a.rig.root.visible && sim?.zoneAt(a.pos) === zoneKey;
  });
  const parcels = s.workOrders.filter((w) => w.zoneId === zone?.id);
  return (
    <div className="pt-3">
      <Row label={t("detail.capacity")}>{zone ? t("detail.capacityValue", { count: zone.capacity }) : t("detail.capacityUnknown")}</Row>
      <SectionTitle aside={`${inside.length}`}>{t("detail.presentNow")}</SectionTitle>
      {inside.length === 0 && <p className="text-xs text-muted">{t("detail.nobody")}</p>}
      {inside.map((e) => (
        <button key={e.id} onClick={() => engineRef.current?.selectPick(`person:${e.id}`)} className="flex w-full items-center justify-between gap-2 border-b border-black/5 py-1.5 text-left text-[13px] hover:bg-black/[0.02]">
          <span className="truncate">
            {e.firstName} {e.lastName} <span className="text-xs text-muted">· {e.jobTitle}</span>
          </span>
          <span className="flex items-center gap-2">
            {e.status === "pause" && <span className="font-mono text-xs text-warn">{dur(minutes(e.since, now))}</span>}
            <Pill tone={e.status} />
          </span>
        </button>
      ))}
      {parcels.length > 0 && (
        <>
          <SectionTitle aside={`${parcels.length}`}>{sectorConfig.objetMetierCentral.nomPluriel}</SectionTitle>
          {parcels.map((w) => (
            <Row key={w.id} label={w.number}>
              {w.clientName}
            </Row>
          ))}
        </>
      )}
      {zone?.type === "preparation" && (
        <Row label={t("detail.onlineToPack")}>{s.shopToday.toPack}</Row>
      )}
    </div>
  );
}

function BadgeLog({ s }: { s: MapSnapshot }) {
  const t = useTranslations("map");
  const rows = s.employees.filter((e) => e.firstIn).sort((a, b) => (b.since ?? b.firstIn ?? "").localeCompare(a.since ?? a.firstIn ?? "")).slice(0, 12);
  return (
    <div className="pt-2">
      <SectionTitle>{t("detail.badgeLog")}</SectionTitle>
      {rows.map((e) => (
        <Row key={e.id} label={formatTime(e.since ?? e.firstIn!)}>
          {e.firstName} {e.lastName} · {e.status === "pause" ? t("detail.badgePause") : t("detail.badgeEntry")}
        </Row>
      ))}
    </div>
  );
}

function Live({ label, base, unit = "%", spread = 0.08 }: { label: string; base: number; unit?: string; spread?: number }) {
  const now = useNow(1200);
  const v = base + Math.sin(now / 1700 + base * 10) * spread;
  return unit === "%" ? (
    <div className="flex items-center gap-2 py-1 text-[13px]">
      <span className="w-12 text-muted">{label}</span>
      <Bar value={v} tone={v > 0.8 ? "accent" : "ok"} className="flex-1" />
      <span className="w-10 text-right font-mono text-xs">{Math.round(v * 100)} %</span>
    </div>
  ) : (
    <Row label={label}>
      {v.toFixed(1).replace(".", ",")} {unit}
    </Row>
  );
}

function CycleCountdown() {
  const now = useNow(1000);
  const t = useTranslations("map");
  const left = 40 - (Math.floor(now / 1000) % 40);
  return <Row label={t("detail.sealingCycle")}>{left} s · 165 °C</Row>;
}

function Check({ label, done, progress }: { label: string; done: boolean; progress?: number }) {
  const t = useTranslations("map");
  return (
    <div className="flex items-center gap-2 py-1 text-[13px]">
      <span role="img" aria-label={done ? t("detail.checkDone") : t("detail.checkTodo")} className={`grid size-4 place-items-center rounded ${done ? "bg-accent text-white" : "ring-1 ring-black/20"}`}>{done && <Icon name="check" size={11} />}</span>
      <span className={`flex-1 ${done ? "text-muted line-through" : ""}`}>{label}</span>
      {!done && progress != null && <span className="text-xs text-muted">{progress} %</span>}
    </div>
  );
}

function Action({ label, icon, detail }: { label: string; icon: string; detail: string }) {
  return (
    <button onClick={() => useMap.getState().toast({ title: label, detail, tone: "warn" })} className="flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-xs font-medium ring-1 ring-black/10 hover:bg-black/5">
      <Icon name={icon} size={13} /> {label}
    </button>
  );
}

export function Avatar({ e, size = 40 }: { e: Pick<MapEmployee, "firstName" | "lastName" | "avatarColor">; size?: number }) {
  const t = useTranslations("map");
  return (
    <span role="img" aria-label={t("detail.avatar", { name: `${e.firstName} ${e.lastName}` })} className="grid shrink-0 place-items-center rounded-full text-sm font-semibold text-white" style={{ width: size, height: size, background: e.avatarColor ?? "#173D2B" }}>
      {e.firstName[0]}
      {e.lastName[0]}
    </span>
  );
}

function Square({ icon, label }: { icon: string; label: string }) {
  const t = useTranslations("map");
  return (
    <span role="img" aria-label={t("detail.kindIcon", { kind: label })} className="grid size-10 shrink-0 place-items-center rounded-xl bg-ground text-brand">
      <Icon name={icon} size={18} />
    </span>
  );
}

export { Ring };

export const ASSET_DRAG = "application/x-matocha-asset";
const say = (t: T, r: { ok: boolean; message?: string; error?: string }, ok: string) => useMap.getState().toast(r.ok ? { title: r.message ?? ok, tone: "ok" } : { title: t("detail.actionRefused"), detail: r.error, tone: "warn" });

/** Salle : occuper maintenant (réservation réelle, conflits refusés) ou libérer. */
function RoomActions({ assetId, current }: { assetId: string; current: { id: string; title: string } | null }) {
  const [pending, start] = useTransition();
  const t = useTranslations("map");
  return current ? (
    <button disabled={pending} className="mt-3 w-full rounded-xl px-3 py-2 text-sm font-medium ring-1 ring-black/10 hover:bg-black/5" onClick={() => start(async () => say(t, await releaseRoom(current.id), t("detail.roomReleased")))}>
      {t("detail.releaseNow")}
    </button>
  ) : (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {[30, 60].map((m) => (
        <button key={m} disabled={pending} className="rounded-xl bg-brand px-3 py-2 text-sm font-medium text-ground disabled:opacity-60" onClick={() => start(async () => say(t, await occupyRoom(assetId, m), t("detail.roomBooked")))}>
          {t("detail.occupyFor", { minutes: m })}
        </button>
      ))}
    </div>
  );
}

/** Véhicule : affectation par liste ou par glisser-déposer de la puce sur une personne de la map. */
function AssignControl({ assetId, assigned, s }: { assetId: string; assigned: string | null; s: MapSnapshot }) {
  const [pending, start] = useTransition();
  const t = useTranslations("map");
  return (
    <div className="mt-3 rounded-xl bg-ground/60 p-3">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">{t("detail.assignment")}</p>
      <div className="flex items-center gap-2">
        <span
          draggable
          onDragStart={(e) => {
            e.dataTransfer.setData(ASSET_DRAG, assetId);
            e.dataTransfer.effectAllowed = "link";
          }}
          title={t("detail.dragHint")}
          className="cursor-grab rounded-full bg-accent px-2.5 py-1 text-[11px] font-semibold text-white active:cursor-grabbing"
        >
          {t("detail.drag")}
        </span>
        <select aria-label={t("detail.assignTo")} disabled={pending} value={assigned ?? ""} onChange={(e) => start(async () => say(t, await assignAsset(assetId, e.target.value || null), t("detail.assignmentSaved")))} className="min-w-0 flex-1 rounded-lg bg-white px-2 py-1 text-sm ring-1 ring-black/10">
          <option value="">{t("detail.unassigned")}</option>
          {s.employees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.firstName} {e.lastName}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
