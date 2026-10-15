/**
 * Écritures comptables simplifiées (plan comptable général) pour l'export vers
 * l'expert-comptable : journal des ventes (VT) et de banque (BQ).
 * Chaque pièce est équilibrée : total des débits = total des crédits.
 */
export interface JournalLine {
  journal: "VT" | "BQ";
  date: string;
  piece: string;
  account: string;
  label: string;
  debit: number;
  credit: number;
}

/** Comptes de produits et de TVA collectée par taux (taux réduit / normal). */
const SALES: Record<string, { product: string; vat: string }> = { "0.055": { product: "707100", vat: "445711" }, "0.2": { product: "707200", vat: "445712" } };
const r2 = (n: number) => Math.round(n * 100) / 100;

export function invoiceEntries(i: { number: string; kind: string; issuedOn: string; client: string; ttc: number; vatByRate: { rate: number; base: number; vat: number }[] }): JournalLine[] {
  const sign = i.kind === "avoir" ? -1 : 1;
  const side = (amount: number, debitSide: boolean) => {
    const v = r2(amount * sign);
    // un avoir inverse le sens des écritures
    return (v >= 0) === debitSide ? { debit: Math.abs(v), credit: 0 } : { debit: 0, credit: Math.abs(v) };
  };
  const label = `${i.kind === "avoir" ? "Avoir" : "Facture"} ${i.number} ${i.client}`;
  const out: JournalLine[] = [{ journal: "VT", date: i.issuedOn, piece: i.number, account: "411000", label, ...side(i.ttc, true) }];
  for (const v of i.vatByRate) {
    const acc = SALES[String(v.rate)] ?? { product: "706000", vat: "445710" };
    out.push({ journal: "VT", date: i.issuedOn, piece: i.number, account: acc.product, label, ...side(v.base, false) });
    if (v.vat) out.push({ journal: "VT", date: i.issuedOn, piece: i.number, account: acc.vat, label, ...side(v.vat, false) });
  }
  return out;
}

export function paymentEntries(p: { invoiceNumber: string; client: string; receivedOn: string; amount: number }): JournalLine[] {
  const label = `Règlement ${p.invoiceNumber} ${p.client}`;
  return [
    { journal: "BQ", date: p.receivedOn, piece: p.invoiceNumber, account: "512000", label, debit: r2(p.amount), credit: 0 },
    { journal: "BQ", date: p.receivedOn, piece: p.invoiceNumber, account: "411000", label, debit: 0, credit: r2(p.amount) },
  ];
}

export function isBalanced(lines: JournalLine[]) {
  return Math.round(lines.reduce((s, l) => s + l.debit - l.credit, 0) * 100) === 0;
}
