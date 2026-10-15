import { describe, expect, it } from "vitest";
import { budgetAlertLevel, computeTotals, htFromTtc, roundTo, ttcFromHt, vatAmount } from "@/lib/domain/money";

describe("arrondis", () => {
  it("arrondit au centime", () => {
    expect(roundTo(12.345)).toBe(12.35);
    expect(roundTo(12.344)).toBe(12.34);
    expect(roundTo(-12.345)).toBe(-12.35);
  });
  it("arrondit aux 5 centimes (mode suisse)", () => {
    expect(roundTo(3438.12, 0.05)).toBe(3438.1);
    expect(roundTo(3438.13, 0.05)).toBe(3438.15);
    expect(roundTo(0.025, 0.05)).toBe(0.05);
  });
  it("refuse un pas nul", () => expect(() => roundTo(1, 0)).toThrow());
});

describe("TVA", () => {
  it("taux réduit 5,5 % sur une Daily Box", () => {
    expect(htFromTtc(39.9, 0.055)).toBe(37.82);
    expect(vatAmount(37.82, 0.055)).toBe(2.08);
    expect(ttcFromHt(37.82, 0.055)).toBe(39.9);
  });
  it("taux normal 20 %", () => expect(ttcFromHt(20.75, 0.2)).toBe(24.9));
});

describe("totaux de devis", () => {
  const lines = [
    { quantity: 40, unitPrice: 24, unitCost: 13.5, vatRate: 0.055 },
    { quantity: 12, unitPrice: 16.5, unitCost: 6.2, vatRate: 0.2 },
  ];
  it("calcule HT, TVA par taux, TTC et marge", () => {
    const t = computeTotals(lines);
    expect(t.ht).toBe(1158);
    expect(t.vatByRate).toEqual([
      { rate: 0.055, base: 960, vat: 52.8 },
      { rate: 0.2, base: 198, vat: 39.6 },
    ]);
    expect(t.ttc).toBe(1250.4);
    expect(t.cost).toBe(614.4);
    expect(t.margin).toBe(543.6);
    expect(t.marginRate).toBeCloseTo(0.4694, 4);
  });
  it("applique une remise globale avant TVA", () => {
    const t = computeTotals(lines, { discountPct: 0.1 });
    expect(t.ht).toBe(1042.2);
    expect(t.ttc).toBe(1125.36);
  });
  it("devis vide", () => expect(computeTotals([]).marginRate).toBeNull());
  it("refuse une remise de 100 %", () => expect(() => computeTotals(lines, { discountPct: 1 })).toThrow());
});

describe("alertes de budget d'heures", () => {
  it.each([
    [0, 10, 0],
    [4.9, 10, 0],
    [5, 10, 50],
    [8, 10, 80],
    [10, 10, 100],
    [12, 10, 100],
    [1, 0, 100],
  ])("%s h sur %s h → %s %%", (used, budget, level) => expect(budgetAlertLevel(used, budget)).toBe(level));
});
