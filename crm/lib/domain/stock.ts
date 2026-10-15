/** Réapprovisionnement : quantité à commander pour revenir au double du minimum, arrondie au colisage. */
export function reorderQuantity(o: { quantity: number; minQuantity: number; packSize?: number; onOrder?: boolean }) {
  if (o.onOrder || o.quantity >= o.minQuantity) return 0;
  const pack = Math.max(1, o.packSize ?? 1);
  const need = o.minQuantity * 2 - o.quantity;
  return Math.ceil(need / pack) * pack;
}

/** Couverture en jours au rythme de consommation moyen (null si pas de consommation). */
export function coverageDays(quantity: number, avgDailyOut: number) {
  return avgDailyOut > 0 ? Math.floor(quantity / avgDailyOut) : null;
}
