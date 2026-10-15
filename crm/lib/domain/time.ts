/** Badges → présence → feuille de temps. */
export type BadgeKind = "in" | "out" | "pause_start" | "pause_end";
export interface Badge {
  kind: BadgeKind;
  at: string; // ISO
}
export interface Day {
  firstIn: string | null;
  lastOut: string | null;
  workedMin: number;
  pauseMin: number;
  open: boolean;
  anomalies: string[];
}

/** Calcule une journée à partir de ses badges (triés ou non). `now` ferme une période ouverte du jour en cours. */
export function computeDay(badges: Badge[], now?: number): Day {
  const ev = [...badges].sort((a, b) => a.at.localeCompare(b.at));
  let worked = 0;
  let pause = 0;
  let workStart: number | null = null;
  let pauseStart: number | null = null;
  const anomalies: string[] = [];
  for (const b of ev) {
    const t = Date.parse(b.at);
    if (b.kind === "in") {
      if (workStart !== null) anomalies.push("entrée en double");
      workStart = t;
    } else if (b.kind === "pause_start") {
      if (workStart !== null) worked += t - workStart;
      else anomalies.push("pause sans entrée");
      workStart = null;
      pauseStart = t;
    } else if (b.kind === "pause_end") {
      if (pauseStart !== null) pause += t - pauseStart;
      pauseStart = null;
      workStart = t;
    } else if (b.kind === "out") {
      if (workStart !== null) worked += t - workStart;
      else if (pauseStart === null) anomalies.push("sortie sans entrée");
      if (pauseStart !== null) pause += t - pauseStart;
      workStart = null;
      pauseStart = null;
    }
  }
  const open = workStart !== null || pauseStart !== null;
  if (open && now !== undefined) {
    if (workStart !== null) worked += Math.max(0, now - workStart);
    if (pauseStart !== null) pause += Math.max(0, now - pauseStart);
  } else if (open) anomalies.push("pas de badge de sortie");
  return {
    firstIn: ev.find((b) => b.kind === "in")?.at ?? null,
    lastOut: [...ev].reverse().find((b) => b.kind === "out")?.at ?? null,
    workedMin: Math.round(worked / 60000),
    pauseMin: Math.round(pause / 60000),
    open,
    anomalies,
  };
}

/** Heures supplémentaires d'une semaine : au-delà de 35 h × taux d'activité. */
export function weeklyOvertime(workedMin: number, workRate = 1) {
  return Math.max(0, Math.round((workedMin / 60 - 35 * workRate) * 100) / 100);
}

/** Regroupe les badges par jour civil local (clé AAAA-MM-JJ). */
export function groupByLocalDay(badges: Badge[], timeZone = "Europe/Paris") {
  const fmt = new Intl.DateTimeFormat("en-CA", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" });
  const out = new Map<string, Badge[]>();
  for (const b of badges) {
    const k = fmt.format(new Date(b.at));
    const list = out.get(k) ?? [];
    list.push(b);
    out.set(k, list);
  }
  return out;
}
