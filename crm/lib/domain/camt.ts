/**
 * Import d'un relevé camt.054 (ISO 20022, notification de crédit) et
 * rapprochement avec les factures ouvertes.
 */
export interface BankEntry {
  amount: number;
  currency: string;
  bookedOn: string | null;
  reference: string;
  debtor: string | null;
}

const tag = (xml: string, name: string) => {
  const m = xml.match(new RegExp(`<(?:\\w+:)?${name}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:\\w+:)?${name}>`));
  return m ? m[1].trim() : null;
};
const all = (xml: string, name: string) => [...xml.matchAll(new RegExp(`<(?:\\w+:)?${name}(?:\\s[^>]*)?>([\\s\\S]*?)</(?:\\w+:)?${name}>`, "g"))].map((m) => m[1]);
const attr = (xml: string, name: string, a: string) => xml.match(new RegExp(`<(?:\\w+:)?${name}[^>]*\\s${a}="([^"]+)"`))?.[1] ?? null;

export function parseCamt054(xml: string): BankEntry[] {
  if (!/BkToCstmrDbtCdtNtfctn/.test(xml)) throw new Error("Fichier non reconnu : camt.054 attendu.");
  const out: BankEntry[] = [];
  for (const ntry of all(xml, "Ntry")) {
    if (tag(ntry, "CdtDbtInd") !== "CRDT") continue;
    const booked = tag(tag(ntry, "BookgDt") ?? "", "Dt");
    const txs = all(ntry, "TxDtls");
    for (const tx of txs.length ? txs : [ntry]) {
      const amtRaw = tag(tx, "Amt") ?? tag(ntry, "Amt");
      if (!amtRaw) continue;
      const reference = tag(tx, "Ustrd") ?? tag(tx, "Ref") ?? tag(tx, "EndToEndId") ?? "";
      out.push({ amount: Number(amtRaw), currency: attr(tx, "Amt", "Ccy") ?? attr(ntry, "Amt", "Ccy") ?? "EUR", bookedOn: booked, reference, debtor: tag(tag(tx, "Dbtr") ?? "", "Nm") });
    }
  }
  return out;
}

export interface OpenInvoice {
  id: string;
  number: string;
  remaining: number;
}

/** Rapprochement : numéro de facture trouvé dans la référence, sinon montant exact unique. */
export function matchEntries(entries: BankEntry[], invoices: OpenInvoice[]) {
  const used = new Set<string>();
  return entries.map((e) => {
    let inv = invoices.find((i) => !used.has(i.id) && e.reference.replace(/\s/g, "").toUpperCase().includes(i.number.toUpperCase()));
    let rule: "reference" | "montant" | null = inv ? "reference" : null;
    if (!inv) {
      const same = invoices.filter((i) => !used.has(i.id) && Math.abs(i.remaining - e.amount) < 0.005);
      if (same.length === 1) {
        inv = same[0];
        rule = "montant";
      }
    }
    if (inv) used.add(inv.id);
    return { entry: e, invoiceId: inv?.id ?? null, rule };
  });
}
