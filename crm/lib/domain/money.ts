/**
 * Calculs monétaires : TVA, arrondis, totaux de devis et de facture, marge.
 * Tout est calculé en centimes entiers pour éviter les erreurs de flottants.
 */

export type VatRate = number; // ex. 0.055

export interface PricedLine {
  quantity: number;
  unitPrice: number; // HT, en unité monétaire (ex. 24.5)
  unitCost?: number; // coût interne HT
  vatRate: VatRate;
}

export interface Totals {
  ht: number;
  vat: number;
  ttc: number;
  cost: number;
  margin: number;
  marginRate: number | null;
  vatByRate: { rate: VatRate; base: number; vat: number }[];
}

/** Centimes, arrondi « commercial » (demi vers l'extérieur), robuste aux flottants (1.005 → 101). */
const toCents = (v: number) => Math.sign(v) * Math.round(Number((Math.abs(v) * 100).toFixed(6))) + 0;
const fromCents = (c: number) => c / 100;

/** Arrondi au pas donné (0.01 au centime, 0.05 aux 5 centimes suisses). */
export function roundTo(value: number, step = 0.01): number {
  const stepCents = Math.round(step * 100);
  if (stepCents <= 0) throw new Error("pas d'arrondi invalide");
  const cents = toCents(value);
  // Math.round arrondit les .5 vers +∞ : on traite le signe à part (arrondi « commercial »).
  const rounded = Math.sign(cents) * Math.round(Math.abs(cents) / stepCents) * stepCents;
  return fromCents(rounded) + 0; // + 0 normalise -0
}

export function vatAmount(ht: number, rate: VatRate): number {
  return fromCents(Math.round(toCents(ht) * rate));
}

export function ttcFromHt(ht: number, rate: VatRate): number {
  return fromCents(toCents(ht) + toCents(vatAmount(ht, rate)));
}

export function htFromTtc(ttc: number, rate: VatRate): number {
  return fromCents(Math.round(toCents(ttc) / (1 + rate)));
}

/**
 * Totaux d'un devis ou d'une facture.
 * La TVA est calculée par taux sur la base cumulée (pas ligne à ligne),
 * la remise globale s'applique au HT avant TVA, l'arrondi final porte sur le TTC.
 */
export function computeTotals(lines: PricedLine[], opts: { discountPct?: number; rounding?: number } = {}): Totals {
  const discount = opts.discountPct ?? 0;
  if (discount < 0 || discount >= 1) throw new Error("remise hors bornes");
  const bases = new Map<VatRate, number>();
  let costCents = 0;
  for (const l of lines) {
    if (l.quantity < 0) throw new Error("quantité négative");
    const lineCents = Math.round(l.quantity * toCents(l.unitPrice));
    bases.set(l.vatRate, (bases.get(l.vatRate) ?? 0) + lineCents);
    costCents += Math.round(l.quantity * toCents(l.unitCost ?? 0));
  }
  const vatByRate = [...bases.entries()]
    .sort(([a], [b]) => a - b)
    .map(([rate, cents]) => {
      const base = Math.round(cents * (1 - discount));
      return { rate, base: fromCents(base), vat: fromCents(Math.round(base * rate)) };
    });
  const htCents = vatByRate.reduce((s, r) => s + toCents(r.base), 0);
  const vatCents = vatByRate.reduce((s, r) => s + toCents(r.vat), 0);
  const ttc = roundTo(fromCents(htCents + vatCents), opts.rounding ?? 0.01);
  const ht = fromCents(htCents);
  const margin = fromCents(htCents - costCents);
  return {
    ht,
    vat: roundTo(ttc - ht),
    ttc,
    cost: fromCents(costCents),
    margin,
    marginRate: htCents === 0 ? null : Math.round(((htCents - costCents) / htCents) * 10000) / 10000,
    vatByRate,
  };
}

/** Seuils d'alerte de budget d'heures : 0, 50, 80 ou 100 (%). */
export function budgetAlertLevel(usedHours: number, budgetHours: number): 0 | 50 | 80 | 100 {
  if (budgetHours <= 0) return usedHours > 0 ? 100 : 0;
  const r = usedHours / budgetHours;
  if (r >= 1) return 100;
  if (r >= 0.8) return 80;
  if (r >= 0.5) return 50;
  return 0;
}
