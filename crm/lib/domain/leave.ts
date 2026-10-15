/** Congés : jours ouvrés (jours fériés français), règles de validation. */

/** Dimanche de Pâques (algorithme de Meeus/Jones/Butcher). */
export function easter(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(Date.UTC(year, month - 1, day));
}

const iso = (d: Date) => d.toISOString().slice(0, 10);
const plus = (d: Date, n: number) => new Date(d.getTime() + n * 86400_000);

/** Jours fériés en France métropolitaine. */
export function frenchHolidays(year: number): Set<string> {
  const e = easter(year);
  return new Set([`${year}-01-01`, iso(plus(e, 1)), `${year}-05-01`, `${year}-05-08`, iso(plus(e, 39)), iso(plus(e, 50)), `${year}-07-14`, `${year}-08-15`, `${year}-11-01`, `${year}-11-11`, `${year}-12-25`]);
}

/** Jours ouvrés (lundi–vendredi hors fériés) entre deux dates incluses. */
export function businessDays(from: string, to: string): number {
  let n = 0;
  for (let d = new Date(`${from}T12:00:00Z`); iso(d) <= to; d = plus(d, 1)) {
    const dow = d.getUTCDay();
    if (dow === 0 || dow === 6) continue;
    if (frenchHolidays(d.getUTCFullYear()).has(iso(d))) continue;
    n++;
  }
  return n;
}

export interface LeaveCheck {
  ok: boolean;
  warnings: string[];
  errors: string[];
}

/**
 * Règles de validation : solde suffisant, période de blocage, présence minimale
 * de l'équipe (part de l'équipe qui reste présente chaque jour).
 */
export function checkLeave(o: {
  type: string;
  from: string;
  to: string;
  days: number;
  balance: number;
  blackouts: { from: string; to: string; label: string }[]; // MM-JJ
  teamSize: number;
  teamAbsences: { from: string; to: string }[]; // congés validés des collègues
  minPresence: number;
}): LeaveCheck {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (o.to < o.from) errors.push("La date de fin précède la date de début.");
  if ((o.type === "conges" || o.type === "rtt") && o.days > o.balance) errors.push(`Solde insuffisant (${o.balance} j disponibles).`);
  for (let d = new Date(`${o.from}T12:00:00Z`); iso(d) <= o.to; d = plus(d, 1)) {
    const md = iso(d).slice(5);
    const b = o.blackouts.find((x) => md >= x.from && md <= x.to);
    if (b && !warnings.some((w) => w.includes(b.label))) warnings.push(`Période de blocage : ${b.label}.`);
    const absent = 1 + o.teamAbsences.filter((a) => iso(d) >= a.from && iso(d) <= a.to).length;
    if (o.teamSize > 0 && (o.teamSize - absent) / o.teamSize < o.minPresence) {
      const msg = `Présence de l'équipe sous ${Math.round(o.minPresence * 100)} % le ${iso(d).split("-").reverse().join("/")}.`;
      if (!warnings.includes(msg)) warnings.push(msg);
    }
  }
  return { ok: errors.length === 0, warnings, errors };
}
