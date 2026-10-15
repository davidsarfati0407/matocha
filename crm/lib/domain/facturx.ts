/**
 * XML Factur-X (UN/CEFACT CII D16B), profil BASIC WL : en-tête, parties,
 * ventilation de TVA et totaux. Ne produit PAS le PDF/A-3 hybride : le XML
 * est fourni à part (l'embarquement dans le PDF est prévu en phase 4).
 */
export interface FxInvoice {
  number: string;
  kind: "facture" | "avoir";
  issuedOn: string;
  dueOn: string;
  currency: string;
  seller: { name: string; vatNumber: string; address: string; country: string };
  buyer: { name: string; city?: string | null; country: string };
  vatByRate: { rate: number; base: number; vat: number }[];
  ht: number;
  vat: number;
  ttc: number;
  paid: number;
}

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const d8 = (iso: string) => iso.slice(0, 10).replace(/-/g, "");
const a = (n: number) => n.toFixed(2);

export function buildFacturX(i: FxInvoice): string {
  const taxes = i.vatByRate
    .map((t) => `      <ram:ApplicableTradeTax><ram:CalculatedAmount>${a(t.vat)}</ram:CalculatedAmount><ram:TypeCode>VAT</ram:TypeCode><ram:BasisAmount>${a(t.base)}</ram:BasisAmount><ram:CategoryCode>S</ram:CategoryCode><ram:RateApplicablePercent>${(t.rate * 100).toFixed(2)}</ram:RateApplicablePercent></ram:ApplicableTradeTax>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100" xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100" xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">
  <rsm:ExchangedDocumentContext>
    <ram:GuidelineSpecifiedDocumentContextParameter><ram:ID>urn:factur-x.eu:1p0:basicwl</ram:ID></ram:GuidelineSpecifiedDocumentContextParameter>
  </rsm:ExchangedDocumentContext>
  <rsm:ExchangedDocument>
    <ram:ID>${esc(i.number)}</ram:ID>
    <ram:TypeCode>${i.kind === "avoir" ? "381" : "380"}</ram:TypeCode>
    <ram:IssueDateTime><udt:DateTimeString format="102">${d8(i.issuedOn)}</udt:DateTimeString></ram:IssueDateTime>
  </rsm:ExchangedDocument>
  <rsm:SupplyChainTradeTransaction>
    <ram:ApplicableHeaderTradeAgreement>
      <ram:SellerTradeParty><ram:Name>${esc(i.seller.name)}</ram:Name><ram:PostalTradeAddress><ram:LineOne>${esc(i.seller.address)}</ram:LineOne><ram:CountryID>${i.seller.country}</ram:CountryID></ram:PostalTradeAddress><ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${esc(i.seller.vatNumber)}</ram:ID></ram:SpecifiedTaxRegistration></ram:SellerTradeParty>
      <ram:BuyerTradeParty><ram:Name>${esc(i.buyer.name)}</ram:Name><ram:PostalTradeAddress>${i.buyer.city ? `<ram:CityName>${esc(i.buyer.city)}</ram:CityName>` : ""}<ram:CountryID>${i.buyer.country}</ram:CountryID></ram:PostalTradeAddress></ram:BuyerTradeParty>
    </ram:ApplicableHeaderTradeAgreement>
    <ram:ApplicableHeaderTradeDelivery/>
    <ram:ApplicableHeaderTradeSettlement>
      <ram:InvoiceCurrencyCode>${i.currency}</ram:InvoiceCurrencyCode>
${taxes}
      <ram:SpecifiedTradePaymentTerms><ram:DueDateDateTime><udt:DateTimeString format="102">${d8(i.dueOn)}</udt:DateTimeString></ram:DueDateDateTime></ram:SpecifiedTradePaymentTerms>
      <ram:SpecifiedTradeSettlementHeaderMonetarySummation>
        <ram:LineTotalAmount>${a(i.ht)}</ram:LineTotalAmount>
        <ram:TaxBasisTotalAmount>${a(i.ht)}</ram:TaxBasisTotalAmount>
        <ram:TaxTotalAmount currencyID="${i.currency}">${a(i.vat)}</ram:TaxTotalAmount>
        <ram:GrandTotalAmount>${a(i.ttc)}</ram:GrandTotalAmount>
        <ram:TotalPrepaidAmount>${a(i.paid)}</ram:TotalPrepaidAmount>
        <ram:DuePayableAmount>${a(Math.max(0, i.ttc - i.paid))}</ram:DuePayableAmount>
      </ram:SpecifiedTradeSettlementHeaderMonetarySummation>
    </ram:ApplicableHeaderTradeSettlement>
  </rsm:SupplyChainTradeTransaction>
</rsm:CrossIndustryInvoice>
`;
}

/** Contrôle de cohérence avant export : la somme des bases = HT, la somme des TVA = TVA. */
export function checkFacturX(i: Pick<FxInvoice, "vatByRate" | "ht" | "vat" | "ttc">) {
  const errors: ("baseSum" | "vatSum" | "total")[] = []; // codes traduits par l'interface
  const base = Math.round(i.vatByRate.reduce((s, t) => s + t.base, 0) * 100);
  const vat = Math.round(i.vatByRate.reduce((s, t) => s + t.vat, 0) * 100);
  if (base !== Math.round(i.ht * 100)) errors.push("baseSum");
  if (vat !== Math.round(i.vat * 100)) errors.push("vatSum");
  if (Math.round((i.ht + i.vat) * 100) !== Math.round(i.ttc * 100)) errors.push("total");
  return errors;
}
