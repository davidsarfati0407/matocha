/**
 * Facturation et relances : facture construite depuis la commande (lignes du
 * devis + heures facturables), niveau de relance dû.
 */
import { computeTotals, type PricedLine, type Totals } from "./money";

export interface QuoteLine {
  label: string;
  quantity: number;
  unitPrice: number;
  unitCost?: number;
  vatRate: number;
}
export interface TimeEntry {
  id: string;
  hours: number;
  billable: boolean;
  invoiced: boolean;
  label?: string;
}
export interface InvoiceDraft {
  lines: (QuoteLine & { source: "devis" | "heures" | "montant" })[];
  timeEntryIds: string[];
  totals: Totals;
}

/** Commande → facture : lignes du devis, puis heures facturables non encore facturées (regroupées). */
export function invoiceFromWorkOrder(o: { quoteLines: QuoteLine[]; amountHt?: number; title?: string; timeEntries: TimeEntry[]; hourlyRate: number; standardVat: number; reducedVat: number; discountPct?: number }): InvoiceDraft {
  const lines: InvoiceDraft["lines"] = o.quoteLines.map((l) => ({ ...l, source: "devis" as const }));
  if (lines.length === 0 && (o.amountHt ?? 0) > 0) lines.push({ label: o.title ?? "Commande", quantity: 1, unitPrice: o.amountHt!, vatRate: o.reducedVat, source: "montant" });
  const billable = o.timeEntries.filter((t) => t.billable && !t.invoiced && t.hours > 0);
  const hours = Math.round(billable.reduce((s, t) => s + t.hours, 0) * 100) / 100;
  if (hours > 0) lines.push({ label: `Prestations (${hours.toString().replace(".", ",")} h)`, quantity: hours, unitPrice: o.hourlyRate, vatRate: o.standardVat, source: "heures" });
  const totals = computeTotals(lines as PricedLine[], { discountPct: o.discountPct });
  return { lines, timeEntryIds: billable.map((t) => t.id), totals };
}

export interface DunningStep {
  level: number;
  sentAt: string | null;
}

/**
 * Prochaine relance due pour une facture impayée.
 * Niveaux : 1 à J+days[0] après l'échéance, 2 à J+days[1], 3 à J+days[2].
 */
export function nextDunning(inv: { dueOn: string; status: string; totalTtc: number; paidAmount: number }, steps: DunningStep[], today: string, days = [1, 15, 30]): { level: 1 | 2 | 3; dueOn: string } | null {
  if (inv.status === "paid" || inv.status === "cancelled" || inv.status === "draft" || inv.paidAmount >= inv.totalTtc) return null;
  const sent = steps.filter((s) => s.sentAt).map((s) => s.level);
  const level = (sent.length ? Math.max(...sent) : 0) + 1;
  if (level > 3) return null;
  const dueOn = addDays(inv.dueOn, days[level - 1]);
  return dueOn <= today ? { level: level as 1 | 2 | 3, dueOn } : null;
}

export function addDays(isoDate: string, n: number) {
  const d = new Date(`${isoDate}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(a: string, b: string) {
  return Math.round((Date.parse(`${b}T12:00:00Z`) - Date.parse(`${a}T12:00:00Z`)) / 86400_000);
}

/** Texte de relance pré-rédigé selon le niveau (à relire avant envoi). */
export function dunningText(level: 1 | 2 | 3, o: { client: string; number: string; amount: string; dueOn: string; company: string }) {
  const intro = `Bonjour,\n\n`;
  const sign = `\n\nBien cordialement,\nService comptabilité — ${o.company}`;
  if (level === 1) return `${intro}Sauf erreur de notre part, la facture ${o.number} d'un montant de ${o.amount}, échue le ${o.dueOn}, reste impayée. Pourriez-vous vérifier de votre côté ?${sign}`;
  if (level === 2) return `${intro}Malgré notre précédent rappel, la facture ${o.number} (${o.amount}, échue le ${o.dueOn}) n'est toujours pas réglée. Merci de procéder au paiement sous 8 jours.${sign}`;
  return `${intro}Mise en demeure : la facture ${o.number} (${o.amount}) reste impayée. Conformément à nos conditions, des pénalités de retard et l'indemnité forfaitaire de recouvrement de 40 € sont exigibles. Sans règlement sous 8 jours, nous engagerons une procédure de recouvrement.${sign}`;
}
