/**
 * PDF des devis, factures et avoirs (même mise en page). Rendu côté serveur
 * avec @react-pdf/renderer, polices standard (Helvetica, encodage WinAnsi).
 */
import { Document, Page, StyleSheet, Text, View, renderToBuffer } from "@react-pdf/renderer";
import { sectorConfig } from "@/config/sector.config";

export interface PdfLine {
  label: string;
  quantity: number;
  unitPrice: number;
  vatRate: number;
}
export interface CommercialPdf {
  kind: "Devis" | "Facture" | "Avoir";
  number: string;
  issuedOn: string;
  secondDate: { label: string; value: string };
  client: { name: string; address?: string | null; city?: string | null; email?: string | null };
  lines: PdfLine[];
  totals: { ht: number; vat: number; ttc: number; vatByRate: { rate: number; base: number; vat: number }[]; discountPct?: number };
  paid?: number;
  notes?: string | null;
  legal: Record<string, string>;
  reference?: string | null;
}

// Les espaces fines insécables d'Intl ne sont pas dans l'encodage des polices standard
const clean = (s: string) => s.replace(/[  ]/g, " ");
const money = (v: number) => clean(new Intl.NumberFormat("fr-FR", { style: "currency", currency: sectorConfig.entreprise.devise }).format(v));
const num = (v: number) => clean(new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 3 }).format(v));
const pct = (v: number) => clean(new Intl.NumberFormat("fr-FR", { style: "percent", maximumFractionDigits: 1 }).format(v));
const date = (d: string) => d.slice(0, 10).split("-").reverse().join("/");

const brand = sectorConfig.entreprise.couleurs?.identite ?? "#173D2B";
const s = StyleSheet.create({
  page: { padding: 40, fontSize: 9.5, fontFamily: "Helvetica", color: "#1f2421" },
  row: { flexDirection: "row" },
  between: { flexDirection: "row", justifyContent: "space-between" },
  h1: { fontSize: 20, fontFamily: "Helvetica-Bold", color: brand },
  muted: { color: "#6b6f6c" },
  th: { fontFamily: "Helvetica-Bold", fontSize: 8.5, color: "#6b6f6c", paddingVertical: 6, borderBottom: "1pt solid #d9d6cf" },
  td: { paddingVertical: 5, borderBottom: "0.5pt solid #ebe8e1" },
  box: { padding: 10, backgroundColor: "#f4f2ec", borderRadius: 4 },
});
const COLS = [{ w: "46%" }, { w: "10%", a: "right" }, { w: "16%", a: "right" }, { w: "10%", a: "right" }, { w: "18%", a: "right" }] as const;

function Doc({ d }: { d: CommercialPdf }) {
  const e = sectorConfig.entreprise;
  return (
    <Document title={`${d.kind} ${d.number}`} author={e.nom} creator={e.nomCourt}>
      <Page size="A4" style={s.page}>
        <View style={s.between}>
          <View>
            <Text style={{ fontSize: 16, fontFamily: "Helvetica-Bold", color: brand }}>{e.nomCourt}</Text>
            <Text style={s.muted}>{e.nom}</Text>
            <Text style={s.muted}>{d.legal.address}</Text>
            <Text style={s.muted}>SIREN {d.legal.siren} · TVA {d.legal.vat_number}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.h1}>{d.kind}</Text>
            <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 11 }}>{d.number}</Text>
            <Text style={s.muted}>Date : {date(d.issuedOn)}</Text>
            <Text style={s.muted}>
              {d.secondDate.label} : {date(d.secondDate.value)}
            </Text>
            {d.reference && <Text style={s.muted}>Réf. : {d.reference}</Text>}
          </View>
        </View>
        <View style={[s.box, { marginTop: 24, marginLeft: "55%" }]}>
          <Text style={{ fontFamily: "Helvetica-Bold" }}>{d.client.name}</Text>
          {d.client.address && <Text>{d.client.address}</Text>}
          {d.client.city && <Text>{d.client.city}</Text>}
          {d.client.email && <Text style={s.muted}>{d.client.email}</Text>}
        </View>
        <View style={{ marginTop: 24 }}>
          <View style={s.row}>
            {["Désignation", "Qté", "PU HT", "TVA", "Total HT"].map((h, i) => (
              <Text key={h} style={[s.th, { width: COLS[i].w, textAlign: ("a" in COLS[i] ? COLS[i].a : "left") as "left" }]}>
                {h}
              </Text>
            ))}
          </View>
          {d.lines.map((l, i) => (
            <View key={i} style={s.row} wrap={false}>
              <Text style={[s.td, { width: COLS[0].w }]}>{l.label}</Text>
              <Text style={[s.td, { width: COLS[1].w, textAlign: "right" }]}>{num(l.quantity)}</Text>
              <Text style={[s.td, { width: COLS[2].w, textAlign: "right" }]}>{money(l.unitPrice)}</Text>
              <Text style={[s.td, { width: COLS[3].w, textAlign: "right" }]}>{pct(l.vatRate)}</Text>
              <Text style={[s.td, { width: COLS[4].w, textAlign: "right" }]}>{money(l.quantity * l.unitPrice)}</Text>
            </View>
          ))}
        </View>
        <View style={[s.row, { marginTop: 16 }]}>
          <View style={{ width: "50%", paddingRight: 16 }}>
            <Text style={[s.muted, { marginBottom: 4 }]}>Détail TVA</Text>
            {d.totals.vatByRate.map((v) => (
              <Text key={v.rate} style={s.muted}>
                {pct(v.rate)} sur {money(v.base)} : {money(v.vat)}
              </Text>
            ))}
            {d.notes && <Text style={{ marginTop: 10 }}>{d.notes}</Text>}
          </View>
          <View style={{ width: "50%" }}>
            {d.totals.discountPct ? (
              <View style={s.between}>
                <Text>Remise</Text>
                <Text>{pct(d.totals.discountPct)}</Text>
              </View>
            ) : null}
            <View style={s.between}>
              <Text>Total HT</Text>
              <Text>{money(d.totals.ht)}</Text>
            </View>
            <View style={s.between}>
              <Text>TVA</Text>
              <Text>{money(d.totals.vat)}</Text>
            </View>
            <View style={[s.between, s.box, { marginTop: 6 }]}>
              <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 11 }}>Total TTC</Text>
              <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 11 }}>{money(d.totals.ttc)}</Text>
            </View>
            {d.paid ? (
              <View style={[s.between, { marginTop: 4 }]}>
                <Text>Déjà réglé · reste dû</Text>
                <Text>
                  {money(d.paid)} · {money(Math.max(0, d.totals.ttc - d.paid))}
                </Text>
              </View>
            ) : null}
          </View>
        </View>
        <View style={{ position: "absolute", bottom: 32, left: 40, right: 40 }} fixed>
          {d.kind === "Devis" ? (
            <Text style={s.muted}>Devis valable jusqu'au {date(d.secondDate.value)}. Bon pour accord : date, signature et cachet.</Text>
          ) : (
            <Text style={s.muted}>
              Paiement par virement : IBAN {d.legal.iban} · BIC {d.legal.bic}. Pénalités de retard : 3 fois le taux d'intérêt légal ; indemnité forfaitaire pour frais de recouvrement : 40 €. Pas d'escompte pour paiement anticipé.
            </Text>
          )}
          <Text style={[s.muted, { marginTop: 6, fontSize: 7.5 }]}>
            {e.nom} · capital {d.legal.capital} · {d.legal.rcs} · {e.statutDemo}
          </Text>
        </View>
      </Page>
    </Document>
  );
}

export async function renderCommercialPdf(d: CommercialPdf) {
  return renderToBuffer(<Doc d={d} />);
}
