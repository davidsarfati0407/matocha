import { describe, expect, it } from "vitest";
import { addDays, dunningText, invoiceFromWorkOrder, nextDunning } from "@/lib/domain/billing";
import { matchEntries, parseCamt054 } from "@/lib/domain/camt";
import { toCsv } from "@/lib/domain/csv";
import { businessDays, checkLeave, easter, frenchHolidays } from "@/lib/domain/leave";
import { scoreCandidate } from "@/lib/domain/recruit";
import { reorderQuantity } from "@/lib/domain/stock";
import { computeDay, groupByLocalDay, weeklyOvertime } from "@/lib/domain/time";

describe("facture depuis une commande (sans ressaisie)", () => {
  it("reprend les lignes du devis et ajoute les heures facturables non facturées", () => {
    const d = invoiceFromWorkOrder({
      quoteLines: [{ label: "Daily Box", quantity: 20, unitPrice: 25.5, vatRate: 0.055 }],
      timeEntries: [
        { id: "a", hours: 1.5, billable: true, invoiced: false },
        { id: "b", hours: 2, billable: false, invoiced: false },
        { id: "c", hours: 1, billable: true, invoiced: true },
      ],
      hourlyRate: 65,
      standardVat: 0.2,
      reducedVat: 0.055,
    });
    expect(d.lines).toHaveLength(2);
    expect(d.lines[1]).toMatchObject({ quantity: 1.5, unitPrice: 65, vatRate: 0.2, source: "heures" });
    expect(d.timeEntryIds).toEqual(["a"]);
    expect(d.totals.ht).toBe(607.5);
    expect(d.totals.ttc).toBe(510 * 1.055 + 97.5 * 1.2);
  });
  it("sans devis : une ligne au montant de la commande", () => {
    const d = invoiceFromWorkOrder({ quoteLines: [], amountHt: 400, title: "Réassort", timeEntries: [], hourlyRate: 65, standardVat: 0.2, reducedVat: 0.055 });
    expect(d.lines[0]).toMatchObject({ label: "Réassort", unitPrice: 400, vatRate: 0.055 });
    expect(d.totals.ttc).toBe(422);
  });
});

describe("relances en 3 niveaux", () => {
  const inv = { dueOn: "2026-10-01", status: "overdue", totalTtc: 100, paidAmount: 0 };
  it("niveau 1 dès J+1", () => expect(nextDunning(inv, [], "2026-10-02")).toEqual({ level: 1, dueOn: "2026-10-02" }));
  it("pas avant l'échéance du niveau", () => expect(nextDunning(inv, [{ level: 1, sentAt: "x" }], "2026-10-10")).toBeNull());
  it("niveau 2 à J+15, niveau 3 à J+30", () => {
    expect(nextDunning(inv, [{ level: 1, sentAt: "x" }], "2026-10-16")?.level).toBe(2);
    expect(nextDunning(inv, [{ level: 1, sentAt: "x" }, { level: 2, sentAt: "y" }], "2026-11-01")?.level).toBe(3);
  });
  it("rien après le niveau 3 ni pour une facture payée", () => {
    expect(nextDunning(inv, [1, 2, 3].map((level) => ({ level, sentAt: "x" })), "2027-01-01")).toBeNull();
    expect(nextDunning({ ...inv, status: "paid", paidAmount: 100 }, [], "2027-01-01")).toBeNull();
  });
  it("texte de mise en demeure avec l'indemnité de 40 €", () => expect(dunningText(3, { client: "X", number: "F-1", amount: "10 €", dueOn: "01/10", company: "M" })).toMatch(/40 €/));
  it("addDays", () => expect(addDays("2026-12-31", 1)).toBe("2027-01-01"));
});

describe("badges → feuille de temps", () => {
  const day = [
    { kind: "in" as const, at: "2026-10-15T07:00:00Z" },
    { kind: "pause_start" as const, at: "2026-10-15T10:30:00Z" },
    { kind: "pause_end" as const, at: "2026-10-15T11:15:00Z" },
    { kind: "out" as const, at: "2026-10-15T15:30:00Z" },
  ];
  it("calcule le temps travaillé et la pause", () => {
    const d = computeDay(day);
    expect(d.workedMin).toBe(7 * 60 + 45);
    expect(d.pauseMin).toBe(45);
    expect(d.anomalies).toEqual([]);
  });
  it("journée en cours fermée à « maintenant »", () => {
    const d = computeDay(day.slice(0, 1), Date.parse("2026-10-15T09:00:00Z"));
    expect(d.workedMin).toBe(120);
    expect(d.open).toBe(true);
  });
  it("signale l'oubli de badge de sortie", () => expect(computeDay(day.slice(0, 1)).anomalies).toContain("pas de badge de sortie"));
  it("heures supplémentaires au-delà de 35 h (80 % → 28 h)", () => {
    expect(weeklyOvertime(38 * 60)).toBe(3);
    expect(weeklyOvertime(30 * 60, 0.8)).toBe(2);
  });
  it("regroupe par jour local (Paris)", () => expect([...groupByLocalDay([{ kind: "in", at: "2026-10-15T22:30:00Z" }]).keys()]).toEqual(["2026-10-16"]));
});

describe("congés", () => {
  it("Pâques 2026 = 5 avril", () => expect(easter(2026).toISOString().slice(0, 10)).toBe("2026-04-05"));
  it("Lundi de Pentecôte et Ascension fériés", () => {
    const h = frenchHolidays(2026);
    expect(h.has("2026-05-14")).toBe(true);
    expect(h.has("2026-05-25")).toBe(true);
  });
  it("jours ouvrés hors week-ends et fériés", () => {
    expect(businessDays("2026-10-19", "2026-10-25")).toBe(5);
    expect(businessDays("2026-11-09", "2026-11-13")).toBe(4); // 11 novembre
  });
  it("refuse au-delà du solde, avertit sur blocage et présence minimale", () => {
    const r = checkLeave({ type: "conges", from: "2026-12-14", to: "2026-12-18", days: 5, balance: 3, blackouts: [{ from: "12-01", to: "12-24", label: "Pic des fêtes" }], teamSize: 4, teamAbsences: [{ from: "2026-12-15", to: "2026-12-16" }], minPresence: 0.6 });
    expect(r.ok).toBe(false);
    expect(r.errors[0]).toMatch(/Solde insuffisant/);
    expect(r.warnings.some((w) => w.includes("Pic des fêtes"))).toBe(true);
    expect(r.warnings.some((w) => w.includes("Présence"))).toBe(true);
  });
});

describe("stock, banque, export, recrutement", () => {
  it("réapprovisionne au double du minimum, arrondi au colisage", () => {
    expect(reorderQuantity({ quantity: 310, minQuantity: 400, packSize: 100 })).toBe(500);
    expect(reorderQuantity({ quantity: 45, minQuantity: 80, onOrder: true })).toBe(0);
    expect(reorderQuantity({ quantity: 500, minQuantity: 400 })).toBe(0);
  });
  const camt = `<?xml version="1.0"?><Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.054.001.08"><BkToCstmrDbtCdtNtfctn><Ntfctn>
    <Ntry><Amt Ccy="EUR">1307.46</Amt><CdtDbtInd>CRDT</CdtDbtInd><BookgDt><Dt>2026-10-14</Dt></BookgDt><NtryDtls><TxDtls><Amt Ccy="EUR">1307.46</Amt><RltdPties><Dbtr><Nm>La Brulerie du Canal</Nm></Dbtr></RltdPties><RmtInf><Ustrd>Paiement F-2026-0409</Ustrd></RmtInf></TxDtls></NtryDtls></Ntry>
    <Ntry><Amt Ccy="EUR">50.00</Amt><CdtDbtInd>DBIT</CdtDbtInd></Ntry>
    <Ntry><Amt Ccy="EUR">1033.90</Amt><CdtDbtInd>CRDT</CdtDbtInd><BookgDt><Dt>2026-10-14</Dt></BookgDt><NtryDtls><TxDtls><Amt Ccy="EUR">1033.90</Amt><RmtInf><Ustrd>VIR VERLAINE</Ustrd></RmtInf></TxDtls></NtryDtls></Ntry>
  </Ntfctn></BkToCstmrDbtCdtNtfctn></Document>`;
  it("lit les crédits d'un camt.054 (ignore les débits)", () => {
    const e = parseCamt054(camt);
    expect(e).toHaveLength(2);
    expect(e[0]).toMatchObject({ amount: 1307.46, reference: "Paiement F-2026-0409", debtor: "La Brulerie du Canal", bookedOn: "2026-10-14" });
  });
  it("rapproche par référence, puis par montant unique", () => {
    const m = matchEntries(parseCamt054(camt), [{ id: "1", number: "F-2026-0409", remaining: 1307.46 }, { id: "2", number: "F-2026-0414", remaining: 1033.9 }]);
    expect(m.map((x) => [x.invoiceId, x.rule])).toEqual([["1", "reference"], ["2", "montant"]]);
  });
  it("refuse un autre format", () => expect(() => parseCamt054("<x/>")).toThrow());
  it("CSV Excel : BOM, point-virgule, échappement, décimale virgule", () => {
    const s = toCsv([{ a: 'Café "Hinoki"', b: 12.5 }], [{ header: "Nom", value: (r) => r.a }, { header: "Montant", value: (r) => r.b }]);
    expect(s).toBe('﻿Nom;Montant\r\n"Café ""Hinoki""";12,5');
  });
  it("score A/B/C", () => {
    expect(scoreCandidate(["a", "b", "c"], ["a", "b", "c"])).toBe("A");
    expect(scoreCandidate(["a", "b", "c"], ["a", "b"])).toBe("B");
    expect(scoreCandidate(["a", "b", "c"], [])).toBe("C");
  });
});

import { canMove, nextStage, overlaps, stageZone } from "@/lib/domain/stages";
describe("étapes et planning", () => {
  it("avance d'une étape, autorise le retour, pas de facturation manuelle", () => {
    expect(nextStage("confirmee")).toBe("preparation");
    expect(canMove("preparation", "controle")).toBe(true);
    expect(canMove("preparation", "expedition")).toBe(false);
    expect(canMove("controle", "preparation")).toBe(true);
    expect(canMove("livree", "facturee")).toBe(false);
  });
  it("emplacement physique par étape", () => expect(stageZone("controle")).toBe("quarantaine"));
  it("détecte les conflits de réservation", () => {
    expect(overlaps({ start: "10:00", end: "11:00" }, { start: "10:30", end: "12:00" })).toBe(true);
    expect(overlaps({ start: "10:00", end: "11:00" }, { start: "11:00", end: "12:00" })).toBe(false);
  });
});
